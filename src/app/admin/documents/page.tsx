'use client';

import { useState, useEffect } from 'react';
import { AdminNav } from '@/components/AdminNav';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  status: 'pending' | 'indexed' | 'failed' | 'skipped';
  createdAt: string;
  updatedAt: string;
  lastIndexed: string | null;
}

interface DocumentFilter {
  status?: string;
  searchTerm?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>({});
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(filter.status && { status: filter.status }),
        ...(filter.searchTerm && { search: filter.searchTerm }),
        ...(filter.dateRange?.start && { startDate: filter.dateRange.start }),
        ...(filter.dateRange?.end && { endDate: filter.dateRange.end }),
      });

      const response = await fetch(`/api/admin/documents?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDocument = async () => {
    try {
      const response = await fetch(`/api/admin/documents/${selectedDocument?.id || ''}`, {
        method: selectedDocument ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDocument),
      });

      if (!response.ok) throw new Error('Failed to save document');
      
      toast.success('Document saved successfully');
      fetchDocuments();
      setIsEditing(false);
      setSelectedDocument(null);
      setEditedDocument({});
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/admin/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete document');
      
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload documents');
      
      toast.success('Documents uploaded successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleReindexDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${id}/reindex`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reindex document');
      
      toast.success('Document queued for reindexing');
      fetchDocuments();
    } catch (error) {
      console.error('Error reindexing document:', error);
      toast.error('Failed to reindex document');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, filter]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    {isUploading ? 'Uploading...' : 'Upload Documents'}
                  </label>
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setSelectedDocument(null);
                      setEditedDocument({});
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    New Document
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={filter.status || ''}
                      onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="indexed">Indexed</option>
                      <option value="failed">Failed</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Search</label>
                    <input
                      type="text"
                      value={filter.searchTerm || ''}
                      onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value || undefined })}
                      placeholder="Search documents..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filter.dateRange?.start || ''}
                        onChange={(e) => setFilter({
                          ...filter,
                          dateRange: { ...filter.dateRange, start: e.target.value },
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <input
                        type="date"
                        value={filter.dateRange?.end || ''}
                        onChange={(e) => setFilter({
                          ...filter,
                          dateRange: { ...filter.dateRange, end: e.target.value },
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document List */}
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Title</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Indexed</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Updated</th>
                        <th className="relative py-3.5 pl-3 pr-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {documents.map(doc => (
                        <tr key={doc.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                            <div className="font-medium text-gray-900">{doc.title}</div>
                            <div className="text-gray-500">{doc.id}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              doc.status === 'indexed' ? 'bg-green-100 text-green-800' :
                              doc.status === 'failed' ? 'bg-red-100 text-red-800' :
                              doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {doc.lastIndexed ? new Date(doc.lastIndexed).toLocaleString() : 'Never'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(doc.updatedAt).toLocaleString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setEditedDocument(doc);
                                  setIsEditing(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleReindexDocument(doc.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                Reindex
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{page}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">First</span>
                        ⟪
                      </button>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        ←
                      </button>
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.min(Math.max(1, page - 2 + i), totalPages);
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        →
                      </button>
                      <button
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Last</span>
                        ⟫
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedDocument ? 'Edit Document' : 'New Document'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={editedDocument.title || ''}
                  onChange={(e) => setEditedDocument({ ...editedDocument, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={editedDocument.content || ''}
                  onChange={(e) => setEditedDocument({ ...editedDocument, content: e.target.value })}
                  rows={10}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Metadata</label>
                <textarea
                  value={editedDocument.metadata ? JSON.stringify(editedDocument.metadata, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const metadata = JSON.parse(e.target.value);
                      setEditedDocument({ ...editedDocument, metadata });
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                  placeholder="{}"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedDocument(null);
                    setEditedDocument({});
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDocument}
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
  );
} 