import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const documents = [];

    for (const file of files) {
      // Save file to disk temporarily
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = join(UPLOAD_DIR, file.name);
      await writeFile(filePath, buffer);

      try {
        // Load and parse document based on file type
        let loader;
        let content = '';
        let metadata = {};

        if (file.name.endsWith('.pdf')) {
          loader = new PDFLoader(filePath);
          const docs = await loader.load();
          content = docs.map(doc => doc.pageContent).join('\n\n');
          metadata = {
            ...docs[0].metadata,
            pageCount: docs.length,
          };
        } else if (file.name.endsWith('.docx')) {
          loader = new DocxLoader(filePath);
          const docs = await loader.load();
          content = docs[0].pageContent;
          metadata = docs[0].metadata;
        } else if (file.name.endsWith('.txt')) {
          loader = new TextLoader(filePath);
          const docs = await loader.load();
          content = docs[0].pageContent;
          metadata = docs[0].metadata;
        } else {
          throw new Error('Unsupported file type');
        }

        // Create document in database
        const document = await prisma.document.create({
          data: {
            title: file.name,
            content,
            metadata: {
              ...metadata,
              originalFileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date().toISOString(),
            },
            status: 'pending',
          },
        });

        documents.push(document);
      } finally {
        // Clean up temporary file
        try {
          await unlink(filePath);
        } catch (error) {
          console.error('Error deleting temporary file:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}

// Configure body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}; 