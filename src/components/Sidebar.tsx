'use client';

import { useState, useEffect } from 'react';

interface DirectoryItem {
  type: 'file' | 'directory';
  name: string;
  path: string;
}

export function Sidebar() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [topLevelDirs, setTopLevelDirs] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopLevelDirs();
  }, []);

  const fetchTopLevelDirs = async () => {
    try {
      const response = await fetch('/api/laws/list');
      if (!response.ok) throw new Error('Failed to fetch directories');
      const data = await response.json();
      const dirs = data.items.filter((item: DirectoryItem) => item.type === 'directory');
      setTopLevelDirs(dirs);
    } catch (error) {
      console.error('Error fetching directories:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Laws', icon: '📚' },
    { id: 'cc', name: 'Federal Laws', icon: '🏛️' },
    { id: 'treaty', name: 'International Treaties', icon: '🌐' },
    { id: 'oc', name: 'Official Compilation', icon: '📜' },
    { id: 'dl', name: 'Draft Laws', icon: '📝' },
  ];

  const languages = [
    { id: 'de', name: 'German' },
    { id: 'fr', name: 'French' },
    { id: 'it', name: 'Italian' },
    { id: 'rm', name: 'Romansh' },
    { id: 'en', name: 'English' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        
        <nav className="space-y-6">
          <div>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    selectedCategory === category.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Top-Level Directories
            </h3>
            <div className="space-y-1">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
              ) : (
                topLevelDirs.map((dir) => (
                  <button
                    key={dir.path}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {dir.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
              Languages
            </h3>
            <div className="space-y-1">
              {languages.map((lang) => (
                <label
                  key={lang.id}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2">{lang.name}</span>
                </label>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
} 