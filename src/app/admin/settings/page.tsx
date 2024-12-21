'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';

interface SystemSettings {
  indexing: {
    batchSize: number;
    maxConcurrentJobs: number;
    retryAttempts: number;
    retryDelay: number;
  };
  search: {
    minScore: number;
    maxResults: number;
    highlightLength: number;
    fuzzyDistance: number;
  };
  meilisearch: {
    host: string;
    apiKey: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <AdminNav />
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Indexing Settings */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Indexing Settings</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      value={settings.indexing.batchSize}
                      onChange={(e) => setSettings({
                        ...settings,
                        indexing: {
                          ...settings.indexing,
                          batchSize: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Number of documents to process in each batch
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Concurrent Jobs
                    </label>
                    <input
                      type="number"
                      value={settings.indexing.maxConcurrentJobs}
                      onChange={(e) => setSettings({
                        ...settings,
                        indexing: {
                          ...settings.indexing,
                          maxConcurrentJobs: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum number of jobs that can run simultaneously
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      value={settings.indexing.retryAttempts}
                      onChange={(e) => setSettings({
                        ...settings,
                        indexing: {
                          ...settings.indexing,
                          retryAttempts: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Number of times to retry failed operations
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Retry Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={settings.indexing.retryDelay}
                      onChange={(e) => setSettings({
                        ...settings,
                        indexing: {
                          ...settings.indexing,
                          retryDelay: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Delay between retry attempts in milliseconds
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Settings */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Settings</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Score
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.search.minScore}
                      onChange={(e) => setSettings({
                        ...settings,
                        search: {
                          ...settings.search,
                          minScore: parseFloat(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum relevance score for search results
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Results
                    </label>
                    <input
                      type="number"
                      value={settings.search.maxResults}
                      onChange={(e) => setSettings({
                        ...settings,
                        search: {
                          ...settings.search,
                          maxResults: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum number of search results to return
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Highlight Length
                    </label>
                    <input
                      type="number"
                      value={settings.search.highlightLength}
                      onChange={(e) => setSettings({
                        ...settings,
                        search: {
                          ...settings.search,
                          highlightLength: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Length of highlighted text snippets in results
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fuzzy Distance
                    </label>
                    <input
                      type="number"
                      value={settings.search.fuzzyDistance}
                      onChange={(e) => setSettings({
                        ...settings,
                        search: {
                          ...settings.search,
                          fuzzyDistance: parseInt(e.target.value),
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum edit distance for fuzzy matching
                    </p>
                  </div>
                </div>
              </div>

              {/* Meilisearch Settings */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Meilisearch Settings</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Host
                    </label>
                    <input
                      type="text"
                      value={settings.meilisearch.host}
                      onChange={(e) => setSettings({
                        ...settings,
                        meilisearch: {
                          ...settings.meilisearch,
                          host: e.target.value,
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Meilisearch server URL
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={settings.meilisearch.apiKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        meilisearch: {
                          ...settings.meilisearch,
                          apiKey: e.target.value,
                        },
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Meilisearch API key for authentication
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 