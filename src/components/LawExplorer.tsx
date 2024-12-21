'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

  const getLanguageFromRef = (reference: string | undefined) => {
    if (!reference) return 'Unknown';
    const parts = reference.split('/');
    return parts[parts.length - 1] || 'Unknown';
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not specified';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const getFileIcon = (format: string) => {
    const icons: { [key: string]: string } = {
      'PDF': '📄',
      'HTML': '🌐',
      'DOCX': '📝',
      'DOC': '📝',
      'XML': '📋'
    };
    const formatKey = format.split('/').pop() || '';
    return icons[formatKey] || '📎';
  };

  if (!content?.data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  }

  const title = content.included?.[0]?.attributes?.title?.['xsd:string'] || 'Untitled';
  const shortTitle = content.included?.[0]?.attributes?.titleShort?.['xsd:string'];
  const documentDate = content.data.attributes?.dateDocument?.['xsd:date'];
  const entryInForceDate = content.data.attributes?.dateEntryInForce?.['xsd:date'];
  const noLongerInForceDate = content.data.attributes?.dateNoLongerInForce?.['xsd:date'];

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {shortTitle && (
          <p className="text-gray-500 mt-1">
            Short Title: {shortTitle}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {documentDate && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              📅 {formatDate(documentDate)}
            </span>
          )}
          {noLongerInForceDate ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              ⚠️ No Longer in Force
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ In Force
            </span>
          )}
          {content.data.type?.map((type: string) => (
            <span key={type} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              🏷️ {type}
            </span>
          ))}
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
              <dd className="mt-1 text-sm text-gray-900">{formatDate(documentDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Entry in Force</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(entryInForceDate)}</dd>
            </div>
            {noLongerInForceDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">No Longer in Force Since</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(noLongerInForceDate)}</dd>
              </div>
            )}
            {content.data.attributes?.basicAct?.['rdfs:Resource'] && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Basic Act</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a 
                    href={content.data.attributes.basicAct['rdfs:Resource']}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View Basic Act
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Languages and Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Languages</h3>
          <div className="space-y-4">
            {content.included?.filter((expr: any) => expr?.references?.language).map((expr: any) => {
              const langCode = getLanguageFromRef(expr.references?.language);
              const langName = getLanguageName(langCode);
              return (
                <div key={expr.uri} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">{langName}</h4>
                  {expr.attributes?.title?.['xsd:string'] && (
                    <p className="text-sm text-gray-600">{expr.attributes.title['xsd:string']}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Consolidation Documents */}
      {content.facets?.consolidates && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Consolidated Documents</h3>
          <div className="space-y-6">
            {content.facets.consolidates.map((consolidation: any, index: number) => (
              <div key={consolidation.uri} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    📅 {formatDate(consolidation.dateDocument)}
                  </span>
                  {consolidation.memorialLabel && (
                    <span className="text-sm text-gray-500">
                      {consolidation.memorialLabel}
                    </span>
                  )}
                </div>
                {Object.entries(consolidation.expression || {}).map(([lang, data]: [string, any]) => (
                  <div key={lang} className="ml-4 mt-2">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {getLanguageName(getLanguageFromRef(lang))}
                    </h4>
                    {data.title && (
                      <p className="text-sm text-gray-600 mb-2">{data.title}</p>
                    )}
                    {data.manifestation && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {data.manifestation.map((manifest: any) => (
                          <a
                            key={manifest.uri}
                            href={manifest.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors"
                          >
                            {getFileIcon(manifest.format)} {manifest.format.split('/').pop()}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {content.data.references && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
          <dl className="space-y-4">
            {Object.entries(content.data.references).map(([key, value]: [string, any]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-900">{key}</dt>
                <dd className="mt-1 text-sm text-gray-600">
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {value.map((item: string) => (
                        <li key={item}>
                          <a
                            href={item}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {value}
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>
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
          <pre className="mt-4 p-4 bg-gray-50 text-gray-800 rounded-lg overflow-auto text-sm border border-gray-200">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

interface LawExplorerProps {
  initialPath?: string;
}

export function LawExplorer({ initialPath = '' }: LawExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [contents, setContents] = useState<DirectoryContents | null>(null);
  const [selectedFile, setSelectedFile] = useState<LawDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sanitize path to prevent directory traversal
  const sanitizePath = (path: string): string => {
    // Remove any attempts to traverse up directories
    const cleanPath = path
      .split('/')
      .filter(segment => segment !== '..' && segment !== '.' && segment !== '')
      .join('/');
    return cleanPath;
  };

  useEffect(() => {
    if (initialPath.endsWith('.json')) {
      loadFile(initialPath);
    } else {
      loadContent(initialPath || '');
    }
  }, [initialPath]);

  const loadContent = async (path: string) => {
    try {
      setLoading(true);
      setSelectedFile(null);
      const sanitizedPath = sanitizePath(path);
      const response = await fetch(`/api/laws/list?path=${encodeURIComponent(sanitizedPath)}`);
      if (!response.ok) {
        throw new Error('Failed to load content');
      }
      const data = await response.json();
      setContents(data);
      setCurrentPath(sanitizedPath);
      setError(null);
    } catch (err) {
      setError('Failed to load content');
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string) => {
    try {
      setLoading(true);
      setContents(null);
      const sanitizedPath = sanitizePath(path);
      const response = await fetch(`/api/laws/list?path=${encodeURIComponent(sanitizedPath)}&action=read`);
      if (!response.ok) {
        throw new Error('Failed to load file');
      }
      const data = await response.json();
      setSelectedFile(data);
      setCurrentPath(sanitizedPath);
      setError(null);
    } catch (err) {
      setError('Failed to load file');
      console.error('Error loading file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (item: DirectoryItem) => {
    if (item.type === 'file') {
      const sanitizedPath = sanitizePath(item.path);
      router.push(`/${sanitizedPath}`);
    } else {
      const sanitizedPath = sanitizePath(item.path);
      router.push(sanitizedPath ? `/${sanitizedPath}` : '/');
    }
  };

  const handleBackClick = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    const sanitizedPath = sanitizePath(parentPath);
    router.push(sanitizedPath ? `/${sanitizedPath}` : '/');
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadContent(currentPath)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (selectedFile) {
    const content = selectedFile.content?.content || selectedFile.content;
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackClick}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </button>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {selectedFile.path}
            </div>
            <button
              onClick={() => {
                const title = content.included?.[0]?.attributes?.title?.['xsd:string'] || 'this law';
                router.push(`/chat?context=${encodeURIComponent(selectedFile.path)}&title=${encodeURIComponent(title)}`);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Chat about this law
            </button>
          </div>
        </div>

        {content && <LawViewer content={content} />}
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