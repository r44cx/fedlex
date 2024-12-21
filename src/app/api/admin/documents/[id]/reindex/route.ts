import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { indexService } from '@/lib/services/indexService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Update document status to pending
    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'pending',
        lastIndexed: null,
      },
    });

    // Create a new index job for this document
    const job = await prisma.indexJob.create({
      data: {
        type: 'incremental',
        status: 'pending',
        startedAt: new Date(),
        scheduleId: 'manual', // Special ID for manual operations
      },
    });

    // Process the document in the background
    indexService.runIncrementalIndex(job.id).catch(error => {
      console.error('Error processing document:', error);
    });

    return NextResponse.json({
      success: true,
      document,
      job,
    });
  } catch (error) {
    console.error('Error reindexing document:', error);
    return NextResponse.json(
      { error: 'Failed to reindex document' },
      { status: 500 }
    );
  }
} 