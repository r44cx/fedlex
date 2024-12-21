'use client';

import { useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const path = params.path ? params.path.join('/') : '';

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
    console.log('Selected books:', selectedBooks);
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
                  placeholder="Search through laws... (Press Shift+Enter for new line)"
                  rows={2}
                  className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Search
                </button>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Include law books:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {LAW_BOOKS.map(book => (
                    <label
                      key={book.id}
                      className="relative flex items-start"
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
                        <span className="font-medium text-gray-700">{book.name}</span>
                        <p className="text-gray-500">{book.description}</p>
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