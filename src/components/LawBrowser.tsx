'use client';

import { useState } from 'react';
import { LawDocument } from '@/types/law';

export function LawBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [laws, setLaws] = useState<LawDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/laws/search?q=${searchQuery}&year=${selectedYear}&lang=${selectedLanguage}`);
      const data = await response.json();
      setLaws(data);
    } catch (error) {
      console.error('Error searching laws:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Search laws..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Years</option>
          {Array.from({ length: 2024 - 1848 + 1 }, (_, i) => 1848 + i).reverse().map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Languages</option>
          <option value="de">German</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
          <option value="rm">Romansh</option>
          <option value="en">English</option>
        </select>
      </div>

      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      <div className="mt-8">
        {laws.length > 0 ? (
          <div className="space-y-6">
            {laws.map((law) => (
              <div
                key={law.data.uri}
                className="bg-white p-6 rounded-lg shadow"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {law.included?.[0]?.attributes?.title?.['xsd:string'] || 'Untitled'}
                </h2>
                <div className="text-sm text-gray-500">
                  <p>Document Date: {law.data.attributes.dateDocument?.['xsd:date']}</p>
                  <p>Entry in Force: {law.data.attributes.dateEntryInForce?.['xsd:date']}</p>
                  {law.data.attributes.dateNoLongerInForce && (
                    <p>No Longer in Force: {law.data.attributes.dateNoLongerInForce['xsd:date']}</p>
                  )}
                </div>
                <div className="mt-4">
                  <a
                    href={law.data.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    View Full Text →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            {loading ? 'Loading...' : 'No laws found. Try searching with different criteria.'}
          </div>
        )}
      </div>
    </div>
  );
} 