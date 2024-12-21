import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';
import 'cross-fetch/polyfill';

const prisma = new PrismaClient();
const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

const LAW_INDEX = 'laws';
const BATCH_SIZE = 1000;

async function reindexToMeilisearch() {
  try {
    console.log('Starting reindex process...');

    // Initialize Meilisearch index
    try {
      await meilisearch.deleteIndex(LAW_INDEX);
      console.log('Deleted existing index');
    } catch {
      console.log('No existing index to delete');
    }

    console.log('Creating new index');
    await meilisearch.createIndex(LAW_INDEX, { primaryKey: 'path' });
    const index = await meilisearch.index(LAW_INDEX);

    console.log('Updating index settings');
    await index.updateSettings({
      searchableAttributes: [
        'title',
        'content',
      ],
      filterableAttributes: ['language', 'path'],
      sortableAttributes: ['updatedAt'],
    });

    // Count total documents
    const totalDocuments = await prisma.lawDocument.count();
    console.log(`Total documents to process: ${totalDocuments}`);

    // Process in batches
    for (let skip = 0; skip < totalDocuments; skip += BATCH_SIZE) {
      console.log(`Processing batch starting at ${skip}`);
      
      const documents = await prisma.lawDocument.findMany({
        skip,
        take: BATCH_SIZE,
        select: {
          path: true,
          title: true,
          content: true,
          language: true,
          updatedAt: true,
        },
      });

      // Prepare documents for Meilisearch
      const searchDocs = documents.map(doc => ({
        ...doc,
        content: JSON.stringify(doc.content), // Convert content to string for searchability
        updatedAt: doc.updatedAt.toISOString(),
      }));

      // Index batch in Meilisearch
      await index.addDocuments(searchDocs);
      console.log(`Indexed ${skip + documents.length}/${totalDocuments} documents`);
    }

    console.log('Reindex completed successfully');
  } catch (error) {
    console.error('Reindex failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reindex
reindexToMeilisearch().catch(console.error); 