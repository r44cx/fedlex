'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  type: 'full' | 'incremental';
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
}

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every Sunday at 2 AM', value: '0 2 * * 0' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every weekday at 3 AM', value: '0 3 * * 1-5' },
];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    description: '',
    cronExpression: '',
    type: 'incremental',
    enabled: true,
  });

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch schedules');
    }
  };

  const handleSaveSchedule = async (schedule: Partial<Schedule>) => {
    try {
      const response = await fetch('/api/admin/schedules', {
        method: schedule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) throw new Error('Failed to save schedule');
      
      toast.success('Schedule saved successfully');
      fetchSchedules();
      setEditingSchedule(null);
      setNewSchedule({
        name: '',
        description: '',
        cronExpression: '',
        type: 'incremental',
        enabled: true,
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/admin/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');
      
      toast.success('Schedule deleted successfully');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Schedule Management</h1>

              {/* Create New Schedule */}
              <div className="mb-8 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editingSchedule?.name || newSchedule.name}
                      onChange={(e) => editingSchedule 
                        ? setEditingSchedule({ ...editingSchedule, name: e.target.value })
                        : setNewSchedule({ ...newSchedule, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Schedule name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editingSchedule?.description || newSchedule.description}
                      onChange={(e) => editingSchedule
                        ? setEditingSchedule({ ...editingSchedule, description: e.target.value })
                        : setNewSchedule({ ...newSchedule, description: e.target.value })
                      }
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Schedule description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cron Expression</label>
                    <div className="mt-1 flex space-x-2">
                      <input
                        type="text"
                        value={editingSchedule?.cronExpression || newSchedule.cronExpression}
                        onChange={(e) => editingSchedule
                          ? setEditingSchedule({ ...editingSchedule, cronExpression: e.target.value })
                          : setNewSchedule({ ...newSchedule, cronExpression: e.target.value })
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Cron expression (e.g., 0 * * * *)"
                      />
                      <select
                        onChange={(e) => editingSchedule
                          ? setEditingSchedule({ ...editingSchedule, cronExpression: e.target.value })
                          : setNewSchedule({ ...newSchedule, cronExpression: e.target.value })
                        }
                        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Presets</option>
                        {CRON_PRESETS.map(preset => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={editingSchedule?.type || newSchedule.type}
                      onChange={(e) => editingSchedule
                        ? setEditingSchedule({ ...editingSchedule, type: e.target.value as 'full' | 'incremental' })
                        : setNewSchedule({ ...newSchedule, type: e.target.value as 'full' | 'incremental' })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="incremental">Incremental Update</option>
                      <option value="full">Full Index</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingSchedule?.enabled ?? newSchedule.enabled}
                      onChange={(e) => editingSchedule
                        ? setEditingSchedule({ ...editingSchedule, enabled: e.target.checked })
                        : setNewSchedule({ ...newSchedule, enabled: e.target.checked })
                      }
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Enable Schedule
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    {editingSchedule && (
                      <button
                        onClick={() => setEditingSchedule(null)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleSaveSchedule(editingSchedule || newSchedule)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingSchedule ? 'Save Changes' : 'Create Schedule'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Schedules */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Schedules</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {schedules.map(schedule => (
                      <li key={schedule.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{schedule.name}</h3>
                            <p className="text-sm text-gray-500">{schedule.description}</p>
                            <div className="mt-2 text-sm text-gray-500">
                              <p>Cron: {schedule.cronExpression}</p>
                              <p>Type: {schedule.type}</p>
                              {schedule.lastRun && (
                                <p>Last Run: {new Date(schedule.lastRun).toLocaleString()}</p>
                              )}
                              {schedule.nextRun && (
                                <p>Next Run: {new Date(schedule.nextRun).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={schedule.enabled}
                                onChange={(e) => handleSaveSchedule({
                                  ...schedule,
                                  enabled: e.target.checked,
                                })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">Enabled</span>
                            </label>
                            <button
                              onClick={() => setEditingSchedule(schedule)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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