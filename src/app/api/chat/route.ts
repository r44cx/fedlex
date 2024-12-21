import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LAW_INDEX = 'laws';

async function searchRelevantDocuments(query: string, selectedBooks: string[]) {
  const index = await meilisearch.getIndex(LAW_INDEX);
  
  // Search for relevant documents
  const searchResults = await index.search(query, {
    limit: 5,
    filter: selectedBooks.length > 0 ? `path IN [${selectedBooks.map(b => `"${b}"`).join(',')}]` : undefined,
  });

  // Get full documents from database
  const documents = await prisma.lawDocument.findMany({
    where: {
      path: {
        in: searchResults.hits.map(hit => hit.path),
      },
    },
  });

  return documents.map(doc => ({
    ...doc,
    relevanceScore: searchResults.hits.find(hit => hit.path === doc.path)._score,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, selectedBooks = [] } = await request.json();

    // Get or create chat session
    let session = sessionId
      ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
      : await prisma.chatSession.create({ data: {} });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message,
      },
    });

    // Search for relevant documents
    const relevantDocs = await searchRelevantDocuments(message, selectedBooks);

    // Create context links
    await prisma.chatContext.createMany({
      data: relevantDocs.map(doc => ({
        sessionId: session.id,
        documentId: doc.id,
        relevanceScore: doc.relevanceScore,
      })),
    });

    // Prepare context for AI
    const context = relevantDocs.map(doc => `
Title: ${doc.title}
Content: ${JSON.stringify(doc.content)}
---
`).join('\n');

    // Get chat history
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful legal assistant. Use the following law documents as context for answering the user's question. Only use the information provided in the context. If you're not sure about something, say so.

Context:
${context}`,
        },
        ...history.map(msg => ({
          role: msg.role as any,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      message: aiResponse,
      context: relevantDocs.map(doc => ({
        title: doc.title,
        path: doc.path,
        relevanceScore: doc.relevanceScore,
      })),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 