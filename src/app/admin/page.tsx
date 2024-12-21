'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AdminNav } from '@/components/AdminNav';

interface Assistant {
  id: string;
  name: string;
  description: string;
  model: string;
  files: string[];
  status: 'ready' | 'creating' | 'updating' | 'error';
  lastUpdated: string;
  fileSize: number;
}

interface FileGroup {
  id: string;
  name: string;
  files: string[];
  totalSize: number;
  lastModified: string;
}

export default function AdminPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantDescription, setNewAssistantDescription] = useState('');

  const handleCreateAssistant = async () => {
    if (!selectedGroup || !newAssistantName) return;
    
    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAssistantName,
          description: newAssistantDescription,
          fileGroupId: selectedGroup,
        }),
      });

      if (!response.ok) throw new Error('Failed to create assistant');

      // Refresh assistants list
      fetchAssistants();
    } catch (error) {
      console.error('Error creating assistant:', error);
    } finally {
      setIsCreating(false);
      setNewAssistantName('');
      setNewAssistantDescription('');
      setSelectedGroup(null);
    }
  };

  const handleUpdateAssistant = async (assistantId: string) => {
    try {
      const response = await fetch(`/api/admin/assistants/${assistantId}`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to update assistant');

      // Refresh assistants list
      fetchAssistants();
    } catch (error) {
      console.error('Error updating assistant:', error);
    }
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    if (!confirm('Are you sure you want to delete this assistant?')) return;

    try {
      const response = await fetch(`/api/admin/assistants/${assistantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete assistant');

      // Refresh assistants list
      fetchAssistants();
    } catch (error) {
      console.error('Error deleting assistant:', error);
    }
  };

  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/admin/assistants');
      if (!response.ok) throw new Error('Failed to fetch assistants');
      const data = await response.json();
      setAssistants(data);
    } catch (error) {
      console.error('Error fetching assistants:', error);
    }
  };

  const fetchFileGroups = async () => {
    try {
      const response = await fetch('/api/admin/file-groups');
      if (!response.ok) throw new Error('Failed to fetch file groups');
      const data = await response.json();
      setFileGroups(data);
    } catch (error) {
      console.error('Error fetching file groups:', error);
    }
  };

  useEffect(() => {
    fetchAssistants();
    fetchFileGroups();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Settings</h1>

              {/* Create New Assistant */}
              <div className="mb-12 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Assistant</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={newAssistantName}
                      onChange={(e) => setNewAssistantName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Assistant name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newAssistantDescription}
                      onChange={(e) => setNewAssistantDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Assistant description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Group</label>
                    <select
                      value={selectedGroup || ''}
                      onChange={(e) => setSelectedGroup(e.target.value || null)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select a file group</option>
                      {fileGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({(group.totalSize / 1024 / 1024).toFixed(2)} MB)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleCreateAssistant}
                    disabled={isCreating || !selectedGroup || !newAssistantName}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Assistant'}
                  </button>
                </div>
              </div>

              {/* Existing Assistants */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Assistants</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {assistants.map(assistant => (
                      <li key={assistant.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{assistant.name}</h3>
                            <p className="text-sm text-gray-500">{assistant.description}</p>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Files: {assistant.files.length}</p>
                              <p>Size: {(assistant.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                              <p>Last Updated: {new Date(assistant.lastUpdated).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleUpdateAssistant(assistant.id)}
                              disabled={assistant.status === 'updating'}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              {assistant.status === 'updating' ? 'Updating...' : 'Update'}
                            </button>
                            <button
                              onClick={() => handleDeleteAssistant(assistant.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
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