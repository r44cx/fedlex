import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, messages } = await request.json();

    // 1. Search for relevant laws
    const searchResponse = await fetch(`${request.nextUrl.origin}/api/laws/index?q=${encodeURIComponent(query)}`);
    if (!searchResponse.ok) throw new Error('Failed to search laws');
    const relevantLaws = await searchResponse.json();

    // 2. Combine relevant law documents
    const combinedContent: any[] = [];
    for (const law of relevantLaws.slice(0, 10)) { // Limit to top 10 most relevant laws
      const content = await fs.readFile(path.join(process.cwd(), law.path), 'utf-8');
      combinedContent.push({
        ...JSON.parse(content),
        _index: {
          id: law.id,
          title: law.title,
          book: law.book,
        },
      });
    }

    // 3. Create temporary file with combined content
    const tempFilePath = path.join(process.cwd(), 'temp', `query-${Date.now()}.json`);
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, JSON.stringify(combinedContent));

    // 4. Upload file to OpenAI
    const file = await openai.files.create({
      file: await fs.readFile(tempFilePath),
      purpose: 'assistants',
    });

    // 5. Create temporary assistant
    const assistant = await openai.beta.assistants.create({
      name: `Temporary Assistant for: ${query}`,
      description: 'Temporary assistant created for a specific query',
      model: 'gpt-4-1106-preview',
      file_ids: [file.id],
      tools: [{ type: 'retrieval' }],
    });

    // 6. Create a thread
    const thread = await openai.beta.threads.create();

    // 7. Add messages to thread
    for (const message of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role,
        content: message.content,
      });
    }

    // 8. Run assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // 9. Wait for completion
    let response;
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        response = messages.data[0].content[0];
        break;
      } else if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 10. Cleanup
    await openai.files.del(file.id);
    await openai.beta.assistants.del(assistant.id);
    await fs.unlink(tempFilePath);

    return NextResponse.json({
      response,
      relevantLaws: relevantLaws.slice(0, 10).map((law: any) => ({
        id: law.id,
        title: law.title,
        book: law.book,
      })),
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
} 