import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const contentFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'boolean', 'date', 'rich-text', 'image', 'file', 'reference']),
  required: z.boolean(),
  description: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

const contentTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  fields: z.array(contentFieldSchema),
});

export async function GET() {
  try {
    const contentTypes = await prisma.contentType.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(contentTypes);
  } catch (error) {
    console.error('Failed to fetch content types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contentTypeSchema.parse(body);

    const contentType = await prisma.contentType.create({
      data: {
        ...validatedData,
        fields: validatedData.fields as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(contentType);
  } catch (error) {
    console.error('Failed to create content type:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid content type data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create content type' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    const validatedData = contentTypeSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { error: 'Content type ID is required' },
        { status: 400 }
      );
    }

    const contentType = await prisma.contentType.update({
      where: { id },
      data: {
        ...validatedData,
        fields: validatedData.fields as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(contentType);
  } catch (error) {
    console.error('Failed to update content type:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid content type data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update content type' },
      { status: 500 }
    );
  }
} 