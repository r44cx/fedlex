import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data/settings.json');

export async function GET() {
  try {
    let settings;
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      settings = JSON.parse(data);
    } catch (error) {
      // Default settings if file doesn't exist
      settings = {
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
      };

      // Create data directory if it doesn't exist
      await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    }

    // Don't send API key back to client
    const { openaiApiKey, ...safeSettings } = settings;
    return NextResponse.json(safeSettings);
  } catch (error) {
    console.error('Error reading settings:', error);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json();
    
    // Load existing settings to preserve API key if not provided
    let existingSettings = {};
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      existingSettings = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, that's fine
    }

    // Merge settings, keeping existing API key if not provided
    const mergedSettings = {
      ...existingSettings,
      ...newSettings,
      openaiApiKey: newSettings.openaiApiKey || existingSettings.openaiApiKey,
    };

    // Validate settings
    if (mergedSettings.maxTokens < 1 || mergedSettings.maxTokens > 4096) {
      return NextResponse.json({ error: 'Invalid maxTokens value' }, { status: 400 });
    }

    if (mergedSettings.temperature < 0 || mergedSettings.temperature > 2) {
      return NextResponse.json({ error: 'Invalid temperature value' }, { status: 400 });
    }

    // Save settings
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(mergedSettings, null, 2));

    // Don't send API key back to client
    const { openaiApiKey, ...safeSettings } = mergedSettings;
    return NextResponse.json(safeSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
} 