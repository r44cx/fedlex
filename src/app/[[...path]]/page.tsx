'use client';

import { useState } from 'react';
import { LawExplorer } from '@/components/LawExplorer';
import { Sidebar } from '@/components/Sidebar';

export default function CatchAllPage({ params }: { params: { path?: string[] } }) {
  const [searchQuery, setSearchQuery] = useState('');
  const path = params.path ? params.path.join('/') : '';

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Swiss Law Explorer</h1>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search through laws..."
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Search
              </button>
            </div>
          </div>
          <LawExplorer initialPath={path} />
        </div>
      </main>
    </div>
  );
} 