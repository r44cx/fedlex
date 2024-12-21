import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// Add fetch polyfill for Node.js
import 'cross-fetch/polyfill';

const prisma = new PrismaClient();
const meilisearch = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

const LAW_INDEX = 'laws';

async function setupDatabase() {
  console.log('Setting up database...');
  try {
    // Run Prisma migrations
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

async function waitForMeilisearch() {
  for (let i = 0; i < 30; i++) {
    try {
      const health = await fetch('http://localhost:7700/health');
      if (health.ok) {
        console.log('Meilisearch is ready');
        return true;
      }
    } catch (e) {
      console.log('Waiting for Meilisearch to be ready...');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Meilisearch failed to start');
}

async function findJsonFiles(startPath: string): Promise<string[]> {
  const result: string[] = [];
  const queue: string[] = [startPath];

  while (queue.length > 0) {
    const currentPath = queue.shift()!;
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.name.endsWith('.json')) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

async function importLaws() {
  try {
    // Setup database first
    await setupDatabase();

    // Wait for Meilisearch to be ready
    await waitForMeilisearch();

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
        'content.included.attributes.title.xsd:string',
        'content.data.attributes.text',
      ],
      filterableAttributes: ['language'],
      sortableAttributes: ['createdAt'],
    });

    // Get all JSON files
    const eliDir = path.join(process.cwd(), '../eli');
    console.log('Scanning directory:', eliDir);
    const files = await findJsonFiles(eliDir);
    console.log(`Found ${files.length} JSON files`);

    // Process files in batches
    const batchSize = 50; // Reduced batch size for better memory management
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
      
      const documents = await Promise.all(
        batch.map(async (filePath) => {
          try {
            const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
            const relativePath = path.relative(eliDir, filePath);
            
            // Extract title and language
            const title = content.included?.[0]?.attributes?.title?.['xsd:string'] || path.basename(filePath);
            const language = content.included?.[0]?.references?.language?.split('/').pop();

            return {
              path: relativePath,
              title,
              content,
              language,
              metadata: {
                originalPath: filePath,
                fileName: path.basename(filePath),
              },
            };
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            return null;
          }
        })
      );

      // Filter out failed documents
      const validDocuments = documents.filter((doc): doc is NonNullable<typeof doc> => doc !== null);

      if (validDocuments.length === 0) {
        console.log('No valid documents in this batch, skipping...');
        continue;
      }

      // Insert into database
      console.log('Inserting into database...');
      await prisma.$transaction(
        validDocuments.map((doc) =>
          prisma.lawDocument.upsert({
            where: { path: doc.path },
            update: {
              title: doc.title,
              content: doc.content,
              language: doc.language,
              metadata: doc.metadata,
              updatedAt: new Date(),
            },
            create: {
              path: doc.path,
              title: doc.title,
              content: doc.content,
              language: doc.language,
              metadata: doc.metadata,
            },
          })
        )
      );

      // Index in Meilisearch
      console.log('Indexing in Meilisearch...');
      const searchDocs = validDocuments.map((doc) => ({
        path: doc.path,
        title: doc.title,
        language: doc.language,
        content: doc.content,
      }));
      await index.addDocuments(searchDocs);

      console.log(`Processed ${i + batch.length}/${files.length} files`);
    }

    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importLaws().catch(console.error); 