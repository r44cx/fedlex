import { NextResponse } from 'next/server';
import { indexWorker } from '@/lib/services/indexWorker';

export async function GET() {
  try {
    const status = await indexWorker.getWorkerStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching worker status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker status' },
      { status: 500 }
    );
  }
} 