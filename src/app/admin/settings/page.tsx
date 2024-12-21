'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

interface Settings {
  openaiApiKey?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  lawGroups: {
    id: string;
    name: string;
    enabled: boolean;
  }[];
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    defaultModel: 'gpt-4-1106-preview',
    maxTokens: 4000,
    temperature: 0.7,
    systemPrompt: 'You are a helpful Swiss law assistant. Answer questions based on the provided law documents.',
    lawGroups: [
      { id: 'zgb', name: 'Zivilgesetzbuch (ZGB)', enabled: true },
      { id: 'or', name: 'Obligationenrecht (OR)', enabled: true },
      { id: 'stgb', name: 'Strafgesetzbuch (StGB)', enabled: true },
      { id: 'bgb', name: 'Bundesgesetz (BGB)', enabled: true },
    ],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load settings from API
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(error => console.error('Error loading settings:', error));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Application Settings</h1>

            {/* OpenAI Settings */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">OpenAI Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">API Key</label>
                  <input
                    type="password"
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Model</label>
                  <select
                    value={settings.defaultModel}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultModel: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="gpt-4-1106-preview">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Assistant Settings */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Assistant Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
                  <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Temperature</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="mt-1 block w-full"
                  />
                  <div className="mt-1 text-sm text-gray-500">
                    {settings.temperature} (Higher values make the output more creative)
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">System Prompt</label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Law Groups */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Law Groups</h2>
              <div className="space-y-4">
                {settings.lawGroups.map((group) => (
                  <div key={group.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={group.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        lawGroups: prev.lawGroups.map(g =>
                          g.id === group.id ? { ...g, enabled: e.target.checked } : g
                        ),
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end space-x-4">
              {saveStatus === 'success' && (
                <span className="text-green-600">Settings saved successfully!</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600">Failed to save settings</span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 