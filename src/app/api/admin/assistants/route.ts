import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const assistants = await openai.beta.assistants.list();
    return NextResponse.json(assistants.data.map(assistant => ({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      model: assistant.model,
      files: assistant.file_ids,
      status: 'ready',
      lastUpdated: assistant.created_at,
      fileSize: 0, // TODO: Calculate from file metadata
    })));
  } catch (error) {
    console.error('Error fetching assistants:', error);
    return NextResponse.json({ error: 'Failed to fetch assistants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, fileGroupId } = await request.json();

    // Get file group data
    const fileGroupsPath = path.join(process.cwd(), 'data/file-groups.json');
    const fileGroupsData = await fs.readFile(fileGroupsPath, 'utf-8');
    const fileGroups = JSON.parse(fileGroupsData);
    const fileGroup = fileGroups.find((g: any) => g.id === fileGroupId);

    if (!fileGroup) {
      return NextResponse.json({ error: 'File group not found' }, { status: 404 });
    }

    // Combine JSON files
    const combinedContent: any[] = [];
    for (const filePath of fileGroup.files) {
      const content = await fs.readFile(path.join(process.cwd(), filePath), 'utf-8');
      combinedContent.push(JSON.parse(content));
    }

    // Create a temporary combined file
    const tempFilePath = path.join(process.cwd(), 'temp', `${fileGroupId}.json`);
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, JSON.stringify(combinedContent));

    // Upload file to OpenAI
    const file = await openai.files.create({
      file: await fs.readFile(tempFilePath),
      purpose: 'assistants',
    });

    // Create assistant
    const assistant = await openai.beta.assistants.create({
      name,
      description,
      model: 'gpt-4-1106-preview',
      file_ids: [file.id],
      tools: [{ type: 'retrieval' }],
    });

    // Clean up temp file
    await fs.unlink(tempFilePath);

    return NextResponse.json(assistant);
  } catch (error) {
    console.error('Error creating assistant:', error);
    return NextResponse.json({ error: 'Failed to create assistant' }, { status: 500 });
  }
} 