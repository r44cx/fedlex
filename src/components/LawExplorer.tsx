'use client';

import { useState, useEffect } from 'react';
import { LawDocument } from '@/types/law';

interface DirectoryItem {
  type: 'file' | 'directory';
  name: string;
  path: string;
  content?: any;
}

interface DirectoryContents {
  currentPath: string;
  items: DirectoryItem[];
}

function LawViewer({ content }: { content: any }) {
  const [showSource, setShowSource] = useState(false);

  const getLanguageName = (code: string) => {
    const names: { [key: string]: string } = {
      DEU: 'German',
      FRA: 'French',
      ITA: 'Italian',
      ROH: 'Romansh',
      ENG: 'English'
    };
    return names[code] || code;
  };

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {content.included?.[0]?.attributes?.title?.['xsd:string'] || 'Untitled'}
        </h2>
        {content.included?.[0]?.attributes?.titleShort?.['xsd:string'] && (
          <p className="text-gray-500 mt-1">
            Short Title: {content.included[0].attributes.titleShort['xsd:string']}
          </p>
        )}
        <div className="mt-4 flex items-center space-x-4">
          {content.data.attributes.dateDocument?.['xsd:date'] && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              📅 {new Date(content.data.attributes.dateDocument['xsd:date']).toLocaleDateString()}
            </span>
          )}
          {content.data.attributes.dateNoLongerInForce ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              ⚠️ No Longer in Force
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ In Force
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Document Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {content.data.attributes.dateDocument?.['xsd:date'] 
                  ? new Date(content.data.attributes.dateDocument['xsd:date']).toLocaleDateString()
                  : 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Entry in Force</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {content.data.attributes.dateEntryInForce?.['xsd:date']
                  ? new Date(content.data.attributes.dateEntryInForce['xsd:date']).toLocaleDateString()
                  : 'Not specified'}
              </dd>
            </div>
            {content.data.attributes.dateNoLongerInForce && (
              <div>
                <dt className="text-sm font-medium text-gray-500">No Longer in Force Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(content.data.attributes.dateNoLongerInForce['xsd:date']).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Languages</h3>
          <div className="grid grid-cols-2 gap-3">
            {content.included?.map((expr: any) => {
              const langCode = expr.references?.language.split('/').pop();
              const langName = getLanguageName(langCode);
              return (
                <a
                  key={expr.uri}
                  href={expr.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-900 transition-colors"
                >
                  <span className="mr-2">🌐</span>
                  {langName}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* References */}
      {content.data.references.isRealizedBy?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Documents</h3>
          <div className="grid gap-3">
            {content.data.references.isRealizedBy.map((ref: string) => (
              <a
                key={ref}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-900 transition-colors"
              >
                <span className="mr-2">📄</span>
                {ref.split('/').slice(-2).join('/')}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Source */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={() => setShowSource(!showSource)}
          className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg
            className={`w-5 h-5 mr-2 transform transition-transform ${showSource ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View Source JSON
        </button>
        {showSource && (
          <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-sm">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export function LawExplorer() {
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState<DirectoryContents | null>(null);
  const [selectedFile, setSelectedFile] = useState<DirectoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContents(currentPath);
  }, [currentPath]);

  const fetchContents = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/laws/list?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch directory contents');
      }
      const data = await response.json();
      setContents(data);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error fetching contents:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (item: DirectoryItem) => {
    if (item.type === 'directory') {
      setCurrentPath(item.path);
    } else {
      try {
        setLoading(true);
        const response = await fetch(`/api/laws/list?path=${encodeURIComponent(item.path)}&action=read`);
        if (!response.ok) {
          throw new Error('Failed to read file');
        }
        const data = await response.json();
        setSelectedFile(data);
      } catch (error) {
        console.error('Error reading file:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !contents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchContents(currentPath)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (selectedFile) {
    const content = selectedFile.content;
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedFile(null)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </button>
          <div className="text-sm text-gray-500">
            {selectedFile.path}
          </div>
        </div>

        {content.data && <LawViewer content={content} />}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm breadcrumbs">
          <span className="text-gray-500">Current Path: </span>
          <button
            onClick={() => setCurrentPath('')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            root
          </button>
          {currentPath.split('/').filter(Boolean).map((segment, index, array) => (
            <span key={index}>
              <span className="text-gray-500 mx-2">/</span>
              <button
                onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {segment}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {contents?.items.map((item, index) => (
          <button
            key={item.path}
            onClick={() => handleFileClick(item)}
            className="w-full px-4 py-3 flex items-center hover:bg-gray-50 text-left"
          >
            <span className="flex-shrink-0 w-6 h-6 mr-3">
              {item.type === 'directory' ? (
                <svg className="text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              ) : (
                <svg className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </span>
            <span className={item.type === 'directory' ? 'text-indigo-600 font-medium' : 'text-gray-900'}>
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
} 