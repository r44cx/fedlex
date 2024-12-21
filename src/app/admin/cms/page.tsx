'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';

interface ContentType {
  id: string;
  name: string;
  description: string;
  fields: ContentField[];
  createdAt: string;
  updatedAt: string;
}

interface ContentField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'rich-text' | 'image' | 'file' | 'reference';
  required: boolean;
  description?: string;
  settings?: Record<string, any>;
}

export default function CMSPage() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedType, setEditedType] = useState<Partial<ContentType>>({});

  const fetchContentTypes = async () => {
    try {
      const response = await fetch('/api/admin/cms/types');
      if (!response.ok) throw new Error('Failed to fetch content types');
      const data = await response.json();
      setContentTypes(data);
    } catch (error) {
      console.error('Error fetching content types:', error);
      toast.error('Failed to fetch content types');
    }
  };

  const handleSaveContentType = async () => {
    try {
      const response = await fetch(`/api/admin/cms/types/${selectedType?.id || ''}`, {
        method: selectedType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedType),
      });

      if (!response.ok) throw new Error('Failed to save content type');
      
      toast.success('Content type saved successfully');
      fetchContentTypes();
      setIsEditing(false);
      setSelectedType(null);
      setEditedType({});
    } catch (error) {
      console.error('Error saving content type:', error);
      toast.error('Failed to save content type');
    }
  };

  const handleDeleteContentType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content type?')) return;

    try {
      const response = await fetch(`/api/admin/cms/types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete content type');
      
      toast.success('Content type deleted successfully');
      fetchContentTypes();
    } catch (error) {
      console.error('Error deleting content type:', error);
      toast.error('Failed to delete content type');
    }
  };

  useEffect(() => {
    fetchContentTypes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setSelectedType(null);
                    setEditedType({});
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Content Type
                </button>
              </div>

              {/* Content Types List */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {contentTypes.map(type => (
                  <div
                    key={type.id}
                    className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{type.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedType(type);
                            setEditedType(type);
                            setIsEditing(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteContentType(type.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Fields</h4>
                      <ul className="mt-2 divide-y divide-gray-200">
                        {type.fields.map((field, index) => (
                          <li key={index} className="py-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {field.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {field.type}
                                {field.required && ' *'}
                              </span>
                            </div>
                            {field.description && (
                              <p className="mt-1 text-sm text-gray-500">
                                {field.description}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit Modal */}
              {isEditing && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      {selectedType ? 'Edit Content Type' : 'New Content Type'}
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          value={editedType.name || ''}
                          onChange={(e) => setEditedType({ ...editedType, name: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={editedType.description || ''}
                          onChange={(e) => setEditedType({ ...editedType, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Fields</label>
                        <div className="mt-2 space-y-4">
                          {editedType.fields?.map((field, index) => (
                            <div key={index} className="flex items-start space-x-4">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => {
                                    const newFields = [...(editedType.fields || [])];
                                    newFields[index] = { ...field, name: e.target.value };
                                    setEditedType({ ...editedType, fields: newFields });
                                  }}
                                  placeholder="Field name"
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="w-32">
                                <select
                                  value={field.type}
                                  onChange={(e) => {
                                    const newFields = [...(editedType.fields || [])];
                                    newFields[index] = { ...field, type: e.target.value as ContentField['type'] };
                                    setEditedType({ ...editedType, fields: newFields });
                                  }}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                  <option value="text">Text</option>
                                  <option value="number">Number</option>
                                  <option value="boolean">Boolean</option>
                                  <option value="date">Date</option>
                                  <option value="rich-text">Rich Text</option>
                                  <option value="image">Image</option>
                                  <option value="file">File</option>
                                  <option value="reference">Reference</option>
                                </select>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => {
                                    const newFields = [...(editedType.fields || [])];
                                    newFields[index] = { ...field, required: e.target.checked };
                                    setEditedType({ ...editedType, fields: newFields });
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-500">Required</span>
                              </div>
                              <button
                                onClick={() => {
                                  const newFields = [...(editedType.fields || [])];
                                  newFields.splice(index, 1);
                                  setEditedType({ ...editedType, fields: newFields });
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newFields = [...(editedType.fields || [])];
                              newFields.push({
                                name: '',
                                type: 'text',
                                required: false,
                              });
                              setEditedType({ ...editedType, fields: newFields });
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            Add Field
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedType(null);
                            setEditedType({});
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveContentType}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 