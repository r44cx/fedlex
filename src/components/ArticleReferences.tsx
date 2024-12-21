import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);

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
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-64 bg-white border-l border-[#e5e5e5] p-4 overflow-y-auto shadow-lg"
    >
      <motion.h3 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-lg font-semibold text-[#0c387b] mb-4 flex items-center"
      >
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          initial={{ rotate: -180 }}
          animate={{ rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
        Referenced Articles
      </motion.h3>
      <motion.ol 
        className="space-y-2"
        variants={{
          show: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {references.map((ref, index) => {
          const refKey = `${ref.code}-${ref.article}`;
          return (
            <motion.li
              key={`${refKey}-${index}`}
              variants={{
                hidden: { opacity: 0, x: 20 },
                show: { opacity: 1, x: 0 }
              }}
              className="text-sm"
              onMouseEnter={() => setHoveredRef(refKey)}
              onMouseLeave={() => setHoveredRef(null)}
            >
              <Link
                href={ref.url}
                className="block p-2 rounded transition-all duration-200 relative"
              >
                <motion.div
                  className="absolute inset-0 bg-[#f7f7f7] rounded"
                  initial={false}
                  animate={{
                    opacity: hoveredRef === refKey ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                />
                <div className="relative">
                  <motion.div
                    className="flex items-center"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <span className="font-medium text-[#0c387b] group-hover:text-[#dc1f3d]">
                      Art. {ref.article} {ref.code}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: hoveredRef === refKey ? 1 : 0,
                        scale: hoveredRef === refKey ? 1 : 0.5
                      }}
                      className="ml-2 text-[#dc1f3d]"
                    >
                      →
                    </motion.span>
                  </motion.div>
                  {ref.title && (
                    <motion.span
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block text-[#666666] mt-1"
                    >
                      {ref.title}
                    </motion.span>
                  )}
                </div>
              </Link>
            </motion.li>
          );
        })}
      </motion.ol>
    </motion.div>
  );
} 