import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

const prisma = new PrismaClient();
const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

const LAW_INDEX = 'laws';

export async function POST(request: NextRequest) {
  try {
    const { query, selectedBooks = [] } = await request.json();

    // Time the Meilisearch query
    const meilisearchStart = performance.now();
    const index = await meilisearch.index(LAW_INDEX);
    
    // Search for relevant documents
    const searchResults = await index.search(query, {
      limit: 5,
      filter: selectedBooks.length > 0 
        ? `path IN ['${selectedBooks.join("', '")}*']`
        : undefined,
      attributesToRetrieve: ['path', 'title', 'language'],
      attributesToHighlight: ['title', 'content'],
    });
    const meilisearchTime = performance.now() - meilisearchStart;

    // Time the Prisma query
    const prismaStart = performance.now();
    const documents = await prisma.lawDocument.findMany({
      where: {
        path: {
          in: searchResults.hits.map(hit => hit.path),
        },
      },
      select: {
        id: true,
        path: true,
        title: true,
        language: true,
        content: true,
        metadata: true,
      },
    });
    const prismaTime = performance.now() - prismaStart;

    // Combine results with relevance scores
    const combinedResults = documents.map(doc => ({
      ...doc,
      relevanceScore: searchResults.hits.find(hit => hit.path === doc.path)?._score || 0,
      highlights: searchResults.hits.find(hit => hit.path === doc.path)?._formatted || null,
    }));

    // Add debug information
    const debugInfo = {
      filterQuery: selectedBooks.length > 0 
        ? `path IN ['${selectedBooks.join("', '")}*']`
        : 'No filter applied',
      totalHits: searchResults.estimatedTotalHits,
      searchParams: searchResults.processingTimeMs ? {
        limit: 5,
        offset: searchResults.offset || 0,
        processingTimeMs: searchResults.processingTimeMs,
        query: searchResults.query,
      } : null,
    };

    return NextResponse.json({
      meilisearch: {
        hits: searchResults.hits,
        processingTimeMs: meilisearchTime,
        query: searchResults.query,
        debug: debugInfo,
      },
      prisma: {
        documents: documents,
        timeMs: prismaTime,
        query: {
          paths: searchResults.hits.map(hit => hit.path),
        },
      },
      rawDocuments: combinedResults,
    });
  } catch (error) {
    console.error('Search debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search request',
        details: error instanceof Error ? error.message : 'Unknown error',
        filterQuery: selectedBooks.length > 0 
          ? `path IN ['${selectedBooks.join("', '")}*']`
          : 'No filter applied',
      },
      { status: 500 }
    );
  }
} 