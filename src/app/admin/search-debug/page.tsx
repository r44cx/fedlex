'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

interface SearchResult {
  meilisearch: {
    hits: any[];
    processingTimeMs: number;
    query: string;
    debug: {
      filterQuery: string;
      totalHits: number;
      searchParams: {
        limit: number;
        offset: number;
        processingTimeMs: number;
        query: string;
      } | null;
    };
  };
  prisma: {
    documents: any[];
    timeMs: number;
    query: {
      paths: string[];
    };
  };
  rawDocuments: Array<{
    id: string;
    path: string;
    title: string;
    language: string;
    content: any;
    metadata: any;
    relevanceScore: number;
    highlights: any;
  }>;
}

export default function SearchDebugPage() {
  const [query, setQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LAW_BOOKS = [
    { id: 'zgb', name: 'ZGB', description: 'Zivilgesetzbuch' },
    { id: 'or', name: 'OR', description: 'Obligationenrecht' },
    { id: 'stgb', name: 'StGB', description: 'Strafgesetzbuch' },
    { id: 'bgb', name: 'BGB', description: 'Bundesgesetz' },
    { id: 'vstrr', name: 'VStR', description: 'Verwaltungsstrafrecht' },
    { id: 'zpo', name: 'ZPO', description: 'Zivilprozessordnung' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/search-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          selectedBooks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Search request failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Debug Tool</h1>
            
            {/* Search Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter search query..."
                  className="flex-1 p-2 border rounded-md"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Law Books Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by law books:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {LAW_BOOKS.map(book => (
                  <label key={book.id} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedBooks.includes(book.id)}
                      onChange={() => toggleBook(book.id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-700">{book.name}</div>
                      <div className="text-sm text-gray-500">{book.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                <div className="font-medium">Error:</div>
                <div className="mt-1">{error}</div>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <div className="space-y-6">
                {/* Search Parameters */}
                <div className="border rounded-md p-4">
                  <h2 className="text-lg font-semibold mb-2">Search Parameters</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Filter Query:</div>
                      <div className="mt-1 font-mono bg-gray-50 p-2 rounded">
                        {results.meilisearch.debug.filterQuery}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Total Hits:</div>
                      <div className="mt-1">{results.meilisearch.debug.totalHits}</div>
                    </div>
                  </div>
                </div>

                {/* Meilisearch Results */}
                <div className="border rounded-md p-4">
                  <h2 className="text-lg font-semibold mb-2">Meilisearch Results</h2>
                  <div className="text-sm text-gray-500 mb-2">
                    Processing Time: {results.meilisearch.processingTimeMs.toFixed(2)}ms
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto">
                    <pre className="text-sm">
                      {JSON.stringify(results.meilisearch.hits, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Prisma Results */}
                <div className="border rounded-md p-4">
                  <h2 className="text-lg font-semibold mb-2">Prisma Results</h2>
                  <div className="text-sm text-gray-500 mb-2">
                    Processing Time: {results.prisma.timeMs.toFixed(2)}ms
                  </div>
                  <div className="mb-2">
                    <div className="font-medium text-sm">Queried Paths:</div>
                    <div className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded">
                      {results.prisma.query.paths.join(', ')}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto">
                    <pre className="text-sm">
                      {JSON.stringify(results.prisma.documents, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Combined Results */}
                <div className="border rounded-md p-4">
                  <h2 className="text-lg font-semibold mb-2">Combined Results</h2>
                  <div className="space-y-4">
                    {results.rawDocuments.map((doc, index) => (
                      <div key={doc.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{doc.title || 'Untitled'}</div>
                            <div className="text-sm text-gray-500">Path: {doc.path}</div>
                            <div className="text-sm text-gray-500">Language: {doc.language}</div>
                          </div>
                          <div className="text-sm bg-blue-50 px-2 py-1 rounded">
                            Score: {doc.relevanceScore.toFixed(4)}
                          </div>
                        </div>
                        {doc.highlights && (
                          <div className="mt-2 text-sm">
                            <div className="font-medium text-gray-700">Highlights:</div>
                            <div className="mt-1 bg-yellow-50 p-2 rounded" 
                                 dangerouslySetInnerHTML={{ __html: doc.highlights.content || doc.highlights.title || '' }} 
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 