import { NextRequest, NextResponse } from 'next/server';
import { indexWorker } from '@/lib/services/indexWorker';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const cancelled = await indexWorker.cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Job not found or already completed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
} 