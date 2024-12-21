import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';
import 'cross-fetch/polyfill';

const prisma = new PrismaClient();
const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

const LAW_INDEX = 'laws';
const DEBUG_LIMIT = 10; // Only process 10 documents for testing

async function waitForIndexing(index: any) {
  let isIndexing = true;
  let attempts = 0;
  const maxAttempts = 30;

  while (isIndexing && attempts < maxAttempts) {
    const stats = await index.getStats();
    isIndexing = stats.isIndexing;
    
    if (isIndexing) {
      console.log('Still indexing... waiting 1 second');
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error('Indexing timed out after 30 seconds');
  }
}

async function reindexToMeilisearchDebug() {
  try {
    console.log('Starting debug reindex process...');

    // First, let's check what paths we have in the database
    console.log('Checking available paths in the database...');
    const pathSamples = await prisma.lawDocument.findMany({
      take: 5,
      select: { path: true },
      orderBy: { path: 'asc' }
    });
    console.log('Sample paths:', pathSamples.map(p => p.path));

    const pathPrefixes = await prisma.$queryRaw<Array<{ prefix: string, count: number }>>`
      SELECT SUBSTRING(path FROM '^[^/]+') as prefix, COUNT(*) as count 
      FROM "law_documents" 
      GROUP BY SUBSTRING(path FROM '^[^/]+') 
      ORDER BY count DESC`;
    console.log('\nPath prefixes and counts:');
    pathPrefixes.forEach(p => console.log(`${p.prefix}: ${p.count} documents`));

    // Initialize Meilisearch index
    try {
      await meilisearch.deleteIndex(LAW_INDEX);
      console.log('\nDeleted existing index');
    } catch {
      console.log('\nNo existing index to delete');
    }

    console.log('Creating new index');
    await meilisearch.createIndex(LAW_INDEX, { primaryKey: 'path' });
    const index = await meilisearch.index(LAW_INDEX);

    console.log('Updating index settings');
    await index.updateSettings({
      searchableAttributes: [
        'title',
        'content',
        'rawContent'
      ],
      filterableAttributes: ['language', 'path'],
      sortableAttributes: ['updatedAt'],
    });

    // Get sample documents using the most common prefix
    const prefix = pathPrefixes[0]?.prefix || '';
    console.log(`\nFetching sample documents with prefix '${prefix}'...`);
    const documents = await prisma.lawDocument.findMany({
      take: DEBUG_LIMIT,
      select: {
        path: true,
        title: true,
        content: true,
        language: true,
        updatedAt: true,
      },
      where: {
        path: {
          startsWith: prefix
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`Found ${documents.length} documents to index`);
    console.log('Sample documents:');
    documents.forEach(doc => {
      // Try to extract text from various possible locations in the content
      const content = doc.content;
      let text = '';
      
      if (typeof content === 'object' && content !== null) {
        // Try different possible paths where text might be stored
        if (content.included?.[0]?.attributes?.text) {
          text = content.included[0].attributes.text;
        } else if (content.data?.attributes?.text) {
          text = content.data.attributes.text;
        } else if (content.text) {
          text = content.text;
        } else {
          text = JSON.stringify(content);
        }
      }

      console.log(`\n- ${doc.path}: ${doc.title}`);
      console.log('Content structure:', Object.keys(doc.content || {}).join(', '));
      console.log('First 200 characters of extracted text:', text.slice(0, 200));
    });

    // Prepare documents for Meilisearch
    const searchDocs = documents.map(doc => {
      const content = doc.content;
      let text = '';
      
      if (typeof content === 'object' && content !== null) {
        if (content.included?.[0]?.attributes?.text) {
          text = content.included[0].attributes.text;
        } else if (content.data?.attributes?.text) {
          text = content.data.attributes.text;
        } else if (content.text) {
          text = content.text;
        } else {
          text = JSON.stringify(content);
        }
      }

      return {
        ...doc,
        content: JSON.stringify(content),
        rawContent: text,
        updatedAt: doc.updatedAt.toISOString(),
      };
    });

    // Index documents
    console.log('\nIndexing documents in Meilisearch...');
    const task = await index.addDocuments(searchDocs);
    console.log('Waiting for indexing to complete...');
    await waitForIndexing(index);
    
    // Verify the documents were indexed
    const stats = await index.getStats();
    console.log('Meilisearch index stats:', stats);

    // Test searches
    console.log('\nTesting search functionality...');
    const searchTerms = ['Lärm', 'bruit', 'rumore', 'noise'];
    for (const term of searchTerms) {
      const searchResult = await index.search(term);
      console.log(`\nSearch for '${term}' found ${searchResult.hits.length} results`);
      if (searchResult.hits.length > 0) {
        console.log('First result:', {
          path: searchResult.hits[0].path,
          title: searchResult.hits[0].title,
          excerpt: searchResult.hits[0]._formatted?.rawContent?.slice(0, 200) || 'No excerpt available'
        });
      }
    }

    console.log('\nDebug reindex completed successfully');
  } catch (error) {
    console.error('Debug reindex failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug reindex
reindexToMeilisearchDebug().catch(console.error); 