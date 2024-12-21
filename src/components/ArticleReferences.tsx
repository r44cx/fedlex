import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ArticleReference {
  code: string;     // e.g., 'StGB'
  article: string;  // e.g., '113'
  title?: string;   // e.g., 'Totschlag'
  url?: string;     // URL to the article
}

interface Props {
  message: string;
}

export function ArticleReferences({ message }: Props) {
  const [references, setReferences] = useState<ArticleReference[]>([]);

  useEffect(() => {
    // Extract article references from the message
    const refs = extractArticleReferences(message);
    setReferences(refs);
  }, [message]);

  function extractArticleReferences(text: string): ArticleReference[] {
    const refs: ArticleReference[] = [];
    
    // Match patterns like "Art. 113 StGB", "Artikel 113 StGB", etc.
    const regex = /(?:Art(?:ikel)?\.?\s*)(\d+(?:[a-z])?)\s*(StGB|OR|ZGB|BV|BGG|VStrR|ZPO)/gi;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const article = match[1];
      const code = match[2].toUpperCase();
      
      // Only add if not already present
      if (!refs.some(ref => ref.article === article && ref.code === code)) {
        refs.push({
          article,
          code,
          // Extract title if it appears after the reference (e.g., "Art. 113 StGB - Totschlag")
          title: extractTitle(text, match.index, article, code),
          url: constructUrl(code, article),
        });
      }
    }

    return refs.sort((a, b) => {
      // First sort by code (StGB, ZGB, etc.)
      if (a.code !== b.code) return a.code.localeCompare(b.code);
      // Then by article number
      return parseInt(a.article) - parseInt(b.article);
    });
  }

  function extractTitle(text: string, index: number, article: string, code: string): string | undefined {
    const afterRef = text.slice(index);
    const titleMatch = afterRef.match(new RegExp(`${article}\\s*${code}\\s*[-:]\\s*([^\\n.]+)`));
    return titleMatch ? titleMatch[1].trim() : undefined;
  }

  function constructUrl(code: string, article: string): string {
    // For now, we'll just construct a path that matches our expected URL structure
    const codeMap: Record<string, string> = {
      'STGB': 'sr/311.0',
      'ZGB': 'sr/210',
      'OR': 'sr/220',
      'BV': 'sr/101',
      'BGG': 'sr/173.110',
      'VSTRR': 'sr/313.0',
      'ZPO': 'sr/272',
    };

    const basePath = codeMap[code] || '';
    return basePath ? `/${basePath}#art${article}` : '#';
  }

  if (references.length === 0) return null;

  return (
    <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Referenced Articles</h3>
      <ol className="space-y-2">
        {references.map((ref, index) => (
          <li key={`${ref.code}-${ref.article}-${index}`} className="text-sm">
            <Link
              href={ref.url}
              className="block p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <span className="font-medium">Art. {ref.article} {ref.code}</span>
              {ref.title && (
                <span className="block text-gray-600 mt-1">
                  {ref.title}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
} 