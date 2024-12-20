import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface DirectoryItem {
  type: 'file' | 'directory';
  name: string;
  path: string;
  content?: any;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const currentPath = searchParams.get('path') || '';
  const action = searchParams.get('action') || 'list';

  try {
    const basePath = path.join(process.cwd(), '../eli');
    const fullPath = path.join(basePath, currentPath);

    // Ensure the path is within the eli directory
    if (!fullPath.startsWith(basePath)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (action === 'read' && fullPath.endsWith('.json')) {
      // Read a specific JSON file
      const content = await fs.readFile(fullPath, 'utf-8');
      return NextResponse.json({
        type: 'file',
        name: path.basename(fullPath),
        path: currentPath,
        content: JSON.parse(content)
      });
    } else {
      // List directory contents
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const items: DirectoryItem[] = [];

      // Add parent directory if not at root
      if (currentPath) {
        items.push({
          type: 'directory',
          name: '..',
          path: path.dirname(currentPath)
        });
      }

      // Add directory contents
      for (const entry of entries) {
        const relativePath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          items.push({
            type: 'directory',
            name: entry.name,
            path: relativePath
          });
        } else if (entry.name.endsWith('.json')) {
          items.push({
            type: 'file',
            name: entry.name,
            path: relativePath
          });
        }
      }

      // Sort items: directories first, then files
      items.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });

      return NextResponse.json({
        currentPath,
        items
      });
    }
  } catch (error) {
    console.error('Error accessing files:', error);
    return NextResponse.json({ error: 'Failed to access files' }, { status: 500 });
  }
} 