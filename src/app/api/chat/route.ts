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

async function searchRelevantDocuments(query: string, selectedBooks: string[] = []) {
  const index = await meilisearch.index(LAW_INDEX);
  
  // Search for relevant documents
  const searchResults = await index.search(query, {
    limit: 5,
    filter: selectedBooks.length > 0 
      ? selectedBooks.map(book => `path LIKE "${book}/%"`).join(' OR ')
      : undefined,
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
    relevanceScore: searchResults.hits.find(hit => hit.path === doc.path)?._score || 0,
  }));
}

function formatDocumentForAI(doc: any) {
  const title = doc.title || 'Untitled';
  const content = doc.content;
  const language = doc.language || 'Unknown';

  return `
Title: ${title}
Language: ${language}
Path: ${doc.path}
Content: ${JSON.stringify(content, null, 2)}
---
`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, selectedBooks = [] } = await request.json();

    // Get or create chat session
    let session = sessionId
      ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
      : await prisma.chatSession.create({ 
          data: { 
            title: message.slice(0, 100) // Use first 100 chars of message as title
          } 
        });

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
    console.log('Searching for relevant documents...');
    const relevantDocs = await searchRelevantDocuments(message, selectedBooks);
    console.log(`Found ${relevantDocs.length} relevant documents`);

    // Create context links
    if (relevantDocs.length > 0) {
      await prisma.chatContext.createMany({
        data: relevantDocs.map(doc => ({
          sessionId: session.id,
          documentId: doc.id,
          relevanceScore: doc.relevanceScore,
        })),
      });
    }

    // Get chat history
    const history = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    // Prepare system message with context
    const systemMessage = `You are a helpful Swiss legal assistant. Use the following law documents as context for answering the user's question. 
Only use the information provided in the context. If you're not sure about something, say so.
Always cite the specific laws or documents you're referencing in your answers.

Context from Swiss Law Documents:
${relevantDocs.map(formatDocumentForAI).join('\n')}`;

    // Generate AI response
    console.log('Generating AI response...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: systemMessage,
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