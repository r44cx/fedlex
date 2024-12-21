'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';

interface IndexConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  weight: number;
  filters: {
    field: string;
    operator: string;
    value: string;
  }[];
}

export default function QueryManagementPage() {
  const [indexes, setIndexes] = useState<IndexConfig[]>([]);
  const [editingIndex, setEditingIndex] = useState<IndexConfig | null>(null);

  const handleSaveIndex = async (index: IndexConfig) => {
    try {
      const response = await fetch(`/api/admin/indexes/${index.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(index),
      });

      if (!response.ok) throw new Error('Failed to update index');
      
      // Refresh indexes
      fetchIndexes();
      setEditingIndex(null);
    } catch (error) {
      console.error('Error updating index:', error);
    }
  };

  const handleToggleIndex = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/indexes/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle index');
      
      // Refresh indexes
      fetchIndexes();
    } catch (error) {
      console.error('Error toggling index:', error);
    }
  };

  const fetchIndexes = async () => {
    try {
      const response = await fetch('/api/admin/indexes');
      if (!response.ok) throw new Error('Failed to fetch indexes');
      const data = await response.json();
      setIndexes(data);
    } catch (error) {
      console.error('Error fetching indexes:', error);
    }
  };

  useEffect(() => {
    fetchIndexes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Query Management</h1>

              {/* Index List */}
              <div className="space-y-6">
                {indexes.map(index => (
                  <div key={index.id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{index.name}</h3>
                        <p className="text-sm text-gray-500">{index.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={index.enabled}
                            onChange={(e) => handleToggleIndex(index.id, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">Enabled</span>
                        </label>
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {editingIndex?.id === index.id && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Weight</label>
                          <input
                            type="number"
                            value={editingIndex.weight}
                            onChange={(e) => setEditingIndex({
                              ...editingIndex,
                              weight: parseFloat(e.target.value)
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Filters</label>
                          {editingIndex.filters.map((filter, idx) => (
                            <div key={idx} className="mt-2 flex items-center space-x-2">
                              <input
                                type="text"
                                value={filter.field}
                                onChange={(e) => {
                                  const newFilters = [...editingIndex.filters];
                                  newFilters[idx].field = e.target.value;
                                  setEditingIndex({
                                    ...editingIndex,
                                    filters: newFilters
                                  });
                                }}
                                placeholder="Field"
                                className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                              <select
                                value={filter.operator}
                                onChange={(e) => {
                                  const newFilters = [...editingIndex.filters];
                                  newFilters[idx].operator = e.target.value;
                                  setEditingIndex({
                                    ...editingIndex,
                                    filters: newFilters
                                  });
                                }}
                                className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              >
                                <option value="equals">Equals</option>
                                <option value="contains">Contains</option>
                                <option value="startsWith">Starts With</option>
                                <option value="endsWith">Ends With</option>
                              </select>
                              <input
                                type="text"
                                value={filter.value}
                                onChange={(e) => {
                                  const newFilters = [...editingIndex.filters];
                                  newFilters[idx].value = e.target.value;
                                  setEditingIndex({
                                    ...editingIndex,
                                    filters: newFilters
                                  });
                                }}
                                placeholder="Value"
                                className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                            </div>
                          ))}
                          <button
                            onClick={() => setEditingIndex({
                              ...editingIndex,
                              filters: [...editingIndex.filters, { field: '', operator: 'equals', value: '' }]
                            })}
                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Add Filter
                          </button>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveIndex(editingIndex)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 