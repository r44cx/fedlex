import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cronValidator } from '@/lib/validators/cron';

const scheduleSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  cronExpression: cronValidator,
  type: z.enum(['full', 'incremental']),
  enabled: z.boolean(),
});

export async function GET() {
  try {
    const schedules = await prisma.indexSchedule.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate next run time for each schedule
    const schedulesWithNextRun = schedules.map(schedule => ({
      ...schedule,
      nextRun: calculateNextRun(schedule.cronExpression),
    }));

    return NextResponse.json(schedulesWithNextRun);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scheduleSchema.parse(body);

    const schedule = await prisma.indexSchedule.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid schedule data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = scheduleSchema.parse(body);
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const schedule = await prisma.indexSchedule.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid schedule data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

function calculateNextRun(cronExpression: string): Date {
  // TODO: Implement cron expression parsing and next run calculation
  // For now, return a placeholder date
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
} 