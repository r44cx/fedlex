import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface LawIndex {
  id: string;
  title: string;
  description?: string;
  book: string;
  path: string;
  keywords: string[];
  references: string[];
  metadata: {
    dateDocument?: string;
    dateEntryInForce?: string;
    dateNoLongerInForce?: string;
    [key: string]: any;
  };
}

let lawIndex: LawIndex[] | null = null;

async function buildIndex() {
  const indexPath = path.join(process.cwd(), 'data/law-index.json');
  
  try {
    // Try to load existing index
    const indexData = await fs.readFile(indexPath, 'utf-8');
    lawIndex = JSON.parse(indexData);
    return lawIndex;
  } catch (error) {
    // Build new index
    lawIndex = [];
    const booksPath = path.join(process.cwd(), 'data/laws');
    const books = await fs.readdir(booksPath);

    for (const book of books) {
      const bookPath = path.join(booksPath, book);
      const stats = await fs.stat(bookPath);
      
      if (!stats.isDirectory()) continue;

      const files = await fs.readdir(bookPath);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(bookPath, file);
        const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));

        // Extract relevant information for indexing
        const lawDoc: LawIndex = {
          id: content.data?.id || file.replace('.json', ''),
          title: content.included?.[0]?.attributes?.title?.['xsd:string'] || 'Untitled',
          description: content.included?.[0]?.attributes?.abstract?.['xsd:string'],
          book: book.toUpperCase(),
          path: path.relative(process.cwd(), filePath),
          keywords: extractKeywords(content),
          references: extractReferences(content),
          metadata: {
            dateDocument: content.data?.attributes?.dateDocument?.['xsd:date'],
            dateEntryInForce: content.data?.attributes?.dateEntryInForce?.['xsd:date'],
            dateNoLongerInForce: content.data?.attributes?.dateNoLongerInForce?.['xsd:date'],
          }
        };

        lawIndex.push(lawDoc);
      }
    }

    // Save index for future use
    await fs.writeFile(indexPath, JSON.stringify(lawIndex, null, 2));
    return lawIndex;
  }
}

function extractKeywords(content: any): string[] {
  const keywords = new Set<string>();
  
  // Extract from title
  const title = content.included?.[0]?.attributes?.title?.['xsd:string'];
  if (title) {
    title.split(/\s+/).forEach((word: string) => keywords.add(word.toLowerCase()));
  }

  // Extract from abstract
  const abstract = content.included?.[0]?.attributes?.abstract?.['xsd:string'];
  if (abstract) {
    abstract.split(/\s+/).forEach((word: string) => keywords.add(word.toLowerCase()));
  }

  // Add any specific keywords or tags from the content
  if (content.data?.type) {
    content.data.type.forEach((type: string) => keywords.add(type.toLowerCase()));
  }

  return Array.from(keywords);
}

function extractReferences(content: any): string[] {
  const references = new Set<string>();

  // Add direct references
  if (content.data?.references) {
    Object.values(content.data.references).forEach((ref: any) => {
      if (Array.isArray(ref)) {
        ref.forEach(r => references.add(r));
      } else if (typeof ref === 'string') {
        references.add(ref);
      }
    });
  }

  return Array.from(references);
}

function searchLaws(query: string, index: LawIndex[]): LawIndex[] {
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  return index
    .filter(law => {
      const searchText = [
        law.title,
        law.description,
        ...law.keywords
      ].join(' ').toLowerCase();

      return searchTerms.some(term => searchText.includes(term));
    })
    .sort((a, b) => {
      // Sort by relevance (number of matching terms)
      const aMatches = searchTerms.filter(term => 
        law.title.toLowerCase().includes(term) ||
        (law.description?.toLowerCase().includes(term) ?? false) ||
        law.keywords.some(k => k.includes(term))
      ).length;

      const bMatches = searchTerms.filter(term => 
        law.title.toLowerCase().includes(term) ||
        (law.description?.toLowerCase().includes(term) ?? false) ||
        law.keywords.some(k => k.includes(term))
      ).length;

      return bMatches - aMatches;
    });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Ensure index is built
    const index = await buildIndex();

    if (!query) {
      return NextResponse.json(index);
    }

    // Search and return relevant laws
    const results = searchLaws(query, index);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching laws:', error);
    return NextResponse.json({ error: 'Failed to search laws' }, { status: 500 });
  }
} 