import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { LawDocument } from '@/types/law';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const year = searchParams.get('year') || '';
  const lang = searchParams.get('lang') || '';

  try {
    // Get all law files from the eli/cc directory
    const lawsDir = path.join(process.cwd(), '../../eli/cc');
    const laws: LawDocument[] = [];

    // Recursive function to read all JSON files
    async function readLawFiles(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await readLawFiles(fullPath);
        } else if (entry.name.endsWith('.json')) {
          const content = await fs.readFile(fullPath, 'utf-8');
          const law: LawDocument = JSON.parse(content);

          // Apply filters
          let matches = true;

          // Year filter
          if (year && law.data.attributes.dateDocument) {
            const docYear = new Date(law.data.attributes.dateDocument['xsd:date']).getFullYear().toString();
            if (docYear !== year) {
              matches = false;
            }
          }

          // Language filter
          if (lang && law.included) {
            const hasLanguage = law.included.some(expr => 
              expr.references?.language.endsWith(`/${lang.toUpperCase()}`)
            );
            if (!hasLanguage) {
              matches = false;
            }
          }

          // Text search
          if (query) {
            const hasMatch = law.included?.some(expr => {
              const title = expr.attributes?.title?.['xsd:string']?.toLowerCase() || '';
              return title.includes(query.toLowerCase());
            });
            if (!hasMatch) {
              matches = false;
            }
          }

          if (matches) {
            laws.push(law);
          }
        }
      }
    }

    await readLawFiles(lawsDir);

    // Sort laws by date (newest first)
    laws.sort((a, b) => {
      const dateA = a.data.attributes.dateDocument?.['xsd:date'] || '';
      const dateB = b.data.attributes.dateDocument?.['xsd:date'] || '';
      return dateB.localeCompare(dateA);
    });

    // Limit to first 50 results for performance
    const limitedLaws = laws.slice(0, 50);

    return NextResponse.json(limitedLaws);
  } catch (error) {
    console.error('Error searching laws:', error);
    return NextResponse.json({ error: 'Failed to search laws' }, { status: 500 });
  }
} 