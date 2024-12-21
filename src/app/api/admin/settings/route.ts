import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
  indexing: z.object({
    batchSize: z.number().min(1).max(1000),
    maxConcurrentJobs: z.number().min(1).max(10),
    retryAttempts: z.number().min(0).max(10),
    retryDelay: z.number().min(0).max(60000),
  }),
  search: z.object({
    minScore: z.number().min(0).max(1),
    maxResults: z.number().min(1).max(1000),
    highlightLength: z.number().min(10).max(1000),
    fuzzyDistance: z.number().min(0).max(5),
  }),
  meilisearch: z.object({
    host: z.string().url(),
    apiKey: z.string().min(1),
  }),
});

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        indexing: {
          batchSize: 100,
          maxConcurrentJobs: 1,
          retryAttempts: 3,
          retryDelay: 1000,
        },
        search: {
          minScore: 0.3,
          maxResults: 100,
          highlightLength: 150,
          fuzzyDistance: 2,
        },
        meilisearch: {
          host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
          apiKey: process.env.MEILISEARCH_API_KEY || '',
        },
      });
    }

    return NextResponse.json({
      indexing: JSON.parse(settings.indexingSettings),
      search: JSON.parse(settings.searchSettings),
      meilisearch: JSON.parse(settings.meilisearchSettings),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        indexingSettings: JSON.stringify(validatedData.indexing),
        searchSettings: JSON.stringify(validatedData.search),
        meilisearchSettings: JSON.stringify(validatedData.meilisearch),
        updatedAt: new Date(),
      },
      create: {
        id: 'default',
        indexingSettings: JSON.stringify(validatedData.indexing),
        searchSettings: JSON.stringify(validatedData.search),
        meilisearchSettings: JSON.stringify(validatedData.meilisearch),
      },
    });

    return NextResponse.json({
      indexing: JSON.parse(settings.indexingSettings),
      search: JSON.parse(settings.searchSettings),
      meilisearch: JSON.parse(settings.meilisearchSettings),
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
} 