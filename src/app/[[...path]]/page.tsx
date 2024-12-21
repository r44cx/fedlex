'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LawExplorer } from '@/components/LawExplorer';
import { Sidebar } from '@/components/Sidebar';

interface LawBook {
  id: string;
  name: string;
  description: string;
}

const LAW_BOOKS: LawBook[] = [
  { id: 'zgb', name: 'ZGB', description: 'Zivilgesetzbuch' },
  { id: 'or', name: 'OR', description: 'Obligationenrecht' },
  { id: 'stgb', name: 'StGB', description: 'Strafgesetzbuch' },
  { id: 'bgb', name: 'BGB', description: 'Bundesgesetz' },
  { id: 'vstrr', name: 'VStR', description: 'Verwaltungsstrafrecht' },
  { id: 'zpo', name: 'ZPO', description: 'Zivilprozessordnung' },
];

export default function CatchAllPage({ params }: { params: { path?: string[] } }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Handle path parameter, ensuring empty path works for root
  const path = params.path ? params.path.join('/') : '';

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const queryParams = new URLSearchParams();
    queryParams.set('query', searchQuery);
    if (selectedBooks.length > 0) {
      queryParams.set('books', selectedBooks.join(','));
    }
    if (attachments.length > 0) {
      queryParams.set('hasAttachments', 'true');
    }
    
    router.push(`/chat?${queryParams.toString()}`);
  };

  const toggleBook = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Swiss Law Explorer</h1>
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
                  placeholder="Ask any question about Swiss law... (Press Shift+Enter for new line)"
                  rows={3}
                  className="w-full p-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-500"
                />
                <div className="absolute right-3 top-3 flex gap-2">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    📎 {attachments.length ? `${attachments.length} files` : 'Attach files'}
                  </label>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Ask
                  </button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Include law books:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {LAW_BOOKS.map(book => (
                    <label
                      key={book.id}
                      className="relative flex items-start cursor-pointer group"
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book.id)}
                          onChange={() => toggleBook(book.id)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </div>
                      <div className="ml-2 text-sm">
                        <span className="font-medium text-gray-700 group-hover:text-gray-900">{book.name}</span>
                        <p className="text-gray-500 group-hover:text-gray-700">{book.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <LawExplorer initialPath={path} />
        </div>
      </main>
    </div>
  );
} 