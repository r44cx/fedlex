'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';

interface IndexJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  type: 'full' | 'incremental';
}

export default function IndexingPage() {
  const [jobs, setJobs] = useState<IndexJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunIndex = async (type: 'full' | 'incremental') => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/admin/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error('Failed to start indexing');
      
      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error('Error starting index:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/admin/index/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Content Indexing</h1>

              {/* Manual Index Controls */}
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Index</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleRunIndex('full')}
                    disabled={isRunning}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Run Full Index
                  </button>
                  <button
                    onClick={() => handleRunIndex('incremental')}
                    disabled={isRunning}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Run Incremental Update
                  </button>
                </div>
              </div>

              {/* Job History */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Index History</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {jobs.map(job => (
                      <li key={job.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{job.name}</h3>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Type: {job.type}</p>
                              <p>Schedule: {job.schedule}</p>
                              <p>Last Run: {new Date(job.lastRun).toLocaleString()}</p>
                              <p>Status: {job.status}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 