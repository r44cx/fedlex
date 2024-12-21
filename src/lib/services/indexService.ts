import { prisma } from '@/lib/prisma';
import { Document, SearchIndex } from '@prisma/client';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { MeiliSearch } from 'meilisearch';

const BATCH_SIZE = 100;

export class IndexService extends EventEmitter {
  private meiliSearch: MeiliSearch;

  constructor() {
    super();
    this.meiliSearch = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }

  public async runFullIndex(jobId: string, onProgress?: (progress: number) => void) {
    // Get total document count
    const totalDocuments = await prisma.document.count();

    // Update job with total items
    await prisma.indexJob.update({
      where: { id: jobId },
      data: { totalItems: totalDocuments },
    });

    let processedCount = 0;
    let page = 0;

    while (true) {
      // Get batch of documents
      const documents = await prisma.document.findMany({
        take: BATCH_SIZE,
        skip: page * BATCH_SIZE,
        orderBy: { updatedAt: 'asc' },
      });

      if (documents.length === 0) {
        break;
      }

      // Process batch
      await this.processBatch(documents);

      // Update progress
      processedCount += documents.length;
      const progress = (processedCount / totalDocuments) * 100;

      await prisma.indexJob.update({
        where: { id: jobId },
        data: {
          progress,
          processed: processedCount,
        },
      });

      if (onProgress) {
        onProgress(progress);
      }

      page++;
    }

    // Update all documents as indexed
    await prisma.document.updateMany({
      where: { status: 'pending' },
      data: {
        status: 'indexed',
        lastIndexed: new Date(),
      },
    });
  }

  public async runIncrementalIndex(jobId: string, onProgress?: (progress: number) => void) {
    // Get documents that need indexing
    const totalDocuments = await prisma.document.count({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'failed' },
        ],
      },
    });

    // Update job with total items
    await prisma.indexJob.update({
      where: { id: jobId },
      data: { totalItems: totalDocuments },
    });

    let processedCount = 0;
    let page = 0;

    while (true) {
      // Get batch of documents that need indexing
      const documents = await prisma.document.findMany({
        where: {
          OR: [
            { status: 'pending' },
            { status: 'failed' },
          ],
        },
        take: BATCH_SIZE,
        skip: page * BATCH_SIZE,
        orderBy: { updatedAt: 'asc' },
      });

      if (documents.length === 0) {
        break;
      }

      // Process batch
      await this.processBatch(documents);

      // Update progress
      processedCount += documents.length;
      const progress = (processedCount / totalDocuments) * 100;

      await prisma.indexJob.update({
        where: { id: jobId },
        data: {
          progress,
          processed: processedCount,
        },
      });

      if (onProgress) {
        onProgress(progress);
      }

      page++;
    }
  }

  private async processBatch(documents: Document[]) {
    // Get all enabled search indexes
    const searchIndexes = await prisma.searchIndex.findMany({
      where: { enabled: true },
    });

    for (const searchIndex of searchIndexes) {
      await this.indexDocumentsForIndex(documents, searchIndex);
    }

    // Mark documents as indexed
    const documentIds = documents.map(doc => doc.id);
    await prisma.document.updateMany({
      where: { id: { in: documentIds } },
      data: {
        status: 'indexed',
        lastIndexed: new Date(),
      },
    });
  }

  private async indexDocumentsForIndex(documents: Document[], searchIndex: SearchIndex) {
    const index = this.meiliSearch.index(searchIndex.name);
    const filters = JSON.parse(searchIndex.filters as string);

    // Process documents according to index filters
    const processedDocs = documents.map(doc => {
      const processed = {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        ...JSON.parse(doc.metadata as string),
        _hash: this.generateDocumentHash(doc),
      };

      // Apply filters
      for (const filter of filters) {
        if (filter.field && filter.operator && filter.value) {
          switch (filter.operator) {
            case 'equals':
              if (processed[filter.field] !== filter.value) {
                return null;
              }
              break;
            case 'contains':
              if (!processed[filter.field]?.includes(filter.value)) {
                return null;
              }
              break;
            case 'startsWith':
              if (!processed[filter.field]?.startsWith(filter.value)) {
                return null;
              }
              break;
            case 'endsWith':
              if (!processed[filter.field]?.endsWith(filter.value)) {
                return null;
              }
              break;
          }
        }
      }

      return processed;
    }).filter(Boolean);

    // Add documents to search index
    if (processedDocs.length > 0) {
      await index.addDocuments(processedDocs);
    }
  }

  private generateDocumentHash(document: Document): string {
    const content = JSON.stringify({
      title: document.title,
      content: document.content,
      metadata: document.metadata,
      updatedAt: document.updatedAt,
    });

    return createHash('sha256').update(content).digest('hex');
  }

  public async deleteDocument(documentId: string) {
    // Get all enabled search indexes
    const searchIndexes = await prisma.searchIndex.findMany({
      where: { enabled: true },
    });

    // Delete document from all search indexes
    for (const searchIndex of searchIndexes) {
      const index = this.meiliSearch.index(searchIndex.name);
      await index.deleteDocument(documentId);
    }

    // Delete document from database
    await prisma.document.delete({
      where: { id: documentId },
    });
  }

  public async getIndexStats() {
    const searchIndexes = await prisma.searchIndex.findMany({
      where: { enabled: true },
    });

    const stats = await Promise.all(
      searchIndexes.map(async (searchIndex) => {
        const index = this.meiliSearch.index(searchIndex.name);
        const stats = await index.getStats();
        return {
          name: searchIndex.name,
          numberOfDocuments: stats.numberOfDocuments,
          isIndexing: stats.isIndexing,
          lastUpdate: searchIndex.lastIndexed,
        };
      })
    );

    return stats;
  }
}

// Create a singleton instance
export const indexService = new IndexService(); 