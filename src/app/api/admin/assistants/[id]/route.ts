import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assistant = await openai.beta.assistants.retrieve(params.id);
    
    // Get the current file
    const currentFiles = await openai.files.list();
    const assistantFile = currentFiles.data.find(file => 
      assistant.file_ids.includes(file.id)
    );

    if (assistantFile) {
      // Upload new version of the file
      const newFile = await openai.files.create({
        file: await fetch(assistantFile.filename).then(res => res.blob()),
        purpose: 'assistants',
      });

      // Update assistant with new file
      const updatedAssistant = await openai.beta.assistants.update(params.id, {
        file_ids: [newFile.id],
      });

      // Delete old file
      await openai.files.del(assistantFile.id);

      return NextResponse.json(updatedAssistant);
    }

    return NextResponse.json({ error: 'No file found to update' }, { status: 404 });
  } catch (error) {
    console.error('Error updating assistant:', error);
    return NextResponse.json({ error: 'Failed to update assistant' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assistant = await openai.beta.assistants.retrieve(params.id);
    
    // Delete associated files
    for (const fileId of assistant.file_ids) {
      await openai.files.del(fileId);
    }

    // Delete the assistant
    await openai.beta.assistants.del(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    return NextResponse.json({ error: 'Failed to delete assistant' }, { status: 500 });
  }
} 