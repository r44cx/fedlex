import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Get file groups configuration
    const fileGroupsPath = path.join(process.cwd(), 'data/file-groups.json');
    let fileGroups;

    try {
      const fileGroupsData = await fs.readFile(fileGroupsPath, 'utf-8');
      fileGroups = JSON.parse(fileGroupsData);
    } catch (error) {
      // If file doesn't exist, create default groups based on law books
      fileGroups = [
        {
          id: 'zgb',
          name: 'ZGB - Zivilgesetzbuch',
          files: ['data/laws/zgb/*.json'],
          totalSize: 0,
          lastModified: new Date().toISOString(),
        },
        {
          id: 'or',
          name: 'OR - Obligationenrecht',
          files: ['data/laws/or/*.json'],
          totalSize: 0,
          lastModified: new Date().toISOString(),
        },
        // Add more default groups as needed
      ];
      
      // Create data directory if it doesn't exist
      await fs.mkdir(path.dirname(fileGroupsPath), { recursive: true });
      await fs.writeFile(fileGroupsPath, JSON.stringify(fileGroups, null, 2));
    }

    // Calculate total size and last modified for each group
    for (const group of fileGroups) {
      let totalSize = 0;
      let lastModified = new Date(0);

      for (const filePattern of group.files) {
        const dirPath = path.dirname(path.join(process.cwd(), filePattern));
        const pattern = path.basename(filePattern);
        
        try {
          const files = await fs.readdir(dirPath);
          for (const file of files) {
            if (file.match(pattern.replace('*', '.*'))) {
              const filePath = path.join(dirPath, file);
              const stats = await fs.stat(filePath);
              totalSize += stats.size;
              if (stats.mtime > lastModified) {
                lastModified = stats.mtime;
              }
            }
          }
        } catch (error) {
          console.warn(`Directory ${dirPath} not found`);
        }
      }

      group.totalSize = totalSize;
      group.lastModified = lastModified.toISOString();
    }

    // Update file groups with calculated sizes
    await fs.writeFile(fileGroupsPath, JSON.stringify(fileGroups, null, 2));

    return NextResponse.json(fileGroups);
  } catch (error) {
    console.error('Error fetching file groups:', error);
    return NextResponse.json({ error: 'Failed to fetch file groups' }, { status: 500 });
  }
} 