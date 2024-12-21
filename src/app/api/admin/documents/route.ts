import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PAGE_SIZE = 20;

const documentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional().default({}),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.updatedAt = {};
      if (startDate) {
        where.updatedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.updatedAt.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const totalDocuments = await prisma.document.count({ where });
    const totalPages = Math.ceil(totalDocuments / PAGE_SIZE);

    // Get documents for current page
    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return NextResponse.json({
      documents,
      totalPages,
      currentPage: page,
      totalDocuments,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = documentSchema.parse(body);

    const document = await prisma.document.create({
      data: {
        ...validatedData,
        status: 'pending',
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid document data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    const validatedData = documentSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...validatedData,
        status: 'pending', // Reset status since content changed
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid document data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 