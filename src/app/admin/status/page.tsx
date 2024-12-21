'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';

interface IndexStats {
  name: string;
  numberOfDocuments: number;
  isIndexing: boolean;
  lastUpdate: string | null;
}

interface Job {
  id: string;
  type: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  progress: number | null;
  totalItems: number | null;
  processed: number | null;
  error: string | null;
  schedule: {
    name: string;
    description: string;
  };
}

interface WorkerStatus {
  isRunning: boolean;
  activeJob: Job | null;
  recentJobs: Job[];
  indexStats: IndexStats[];
}

export default function StatusPage() {
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/cancel`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel job');
      toast.success('Job cancelled successfully');
      fetchStatus();
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel job');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-600">
                    Refresh Interval:
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value={1000}>1s</option>
                      <option value={5000}>5s</option>
                      <option value={10000}>10s</option>
                      <option value={30000}>30s</option>
                    </select>
                  </label>
                  <button
                    onClick={fetchStatus}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Refresh Now
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  {/* Worker Status */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Worker Status</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${status?.isRunning ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {status?.isRunning ? 'Active' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Job */}
                  {status?.activeJob && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Job</h2>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {status.activeJob.schedule.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {status.activeJob.schedule.description}
                            </p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                Type: {status.activeJob.type}
                              </p>
                              <p className="text-sm text-gray-600">
                                Started: {new Date(status.activeJob.startedAt).toLocaleString()}
                              </p>
                              {status.activeJob.totalItems && (
                                <p className="text-sm text-gray-600">
                                  Progress: {status.activeJob.processed} / {status.activeJob.totalItems} items
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelJob(status.activeJob!.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                        {status.activeJob.progress !== null && (
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${status.activeJob.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Jobs */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Jobs</h2>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {status?.recentJobs.map(job => (
                          <li key={job.id} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {job.schedule.name}
                                </h3>
                                <div className="mt-2 text-sm text-gray-500">
                                  <p>Type: {job.type}</p>
                                  <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
                                  {job.completedAt && (
                                    <p>Completed: {new Date(job.completedAt).toLocaleString()}</p>
                                  )}
                                  {job.error && (
                                    <p className="text-red-600">Error: {job.error}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Index Stats */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Index Statistics</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {status?.indexStats.map(stat => (
                        <div key={stat.name} className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-medium text-gray-900">{stat.name}</h3>
                          <dl className="mt-2 text-sm text-gray-500">
                            <div className="flex justify-between">
                              <dt>Documents:</dt>
                              <dd>{stat.numberOfDocuments}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt>Status:</dt>
                              <dd className={stat.isIndexing ? 'text-yellow-600' : 'text-green-600'}>
                                {stat.isIndexing ? 'Indexing' : 'Ready'}
                              </dd>
                            </div>
                            {stat.lastUpdate && (
                              <div className="flex justify-between">
                                <dt>Last Update:</dt>
                                <dd>{new Date(stat.lastUpdate).toLocaleString()}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 