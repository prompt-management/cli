import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return '';
  }
}

export function parseDate(dateStr: string): dayjs.Dayjs | null {
  // Try different date formats
  const formats = [
    'YYYY-MM-DD',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD HH:mm:ss',
    'MM/DD/YYYY',
    'DD/MM/YYYY'
  ];
  
  // Try standard formats first
  for (const format of formats) {
    const parsed = dayjs(dateStr, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }
  
  // Try relative time parsing
  const now = dayjs();
  const relativeParsing = [
    { pattern: /(\d+)\s*days?\s*ago/i, unit: 'day' },
    { pattern: /(\d+)\s*weeks?\s*ago/i, unit: 'week' },
    { pattern: /(\d+)\s*months?\s*ago/i, unit: 'month' },
    { pattern: /(\d+)\s*years?\s*ago/i, unit: 'year' },
    { pattern: /(\d+)\s*hours?\s*ago/i, unit: 'hour' },
    { pattern: /(\d+)\s*minutes?\s*ago/i, unit: 'minute' }
  ];
  
  for (const { pattern, unit } of relativeParsing) {
    const match = dateStr.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      return now.subtract(amount, unit as any);
    }
  }
  
  // Special cases
  if (dateStr.toLowerCase() === 'today') {
    return now.startOf('day');
  }
  if (dateStr.toLowerCase() === 'yesterday') {
    return now.subtract(1, 'day').startOf('day');
  }
  if (dateStr.toLowerCase() === 'last week') {
    return now.subtract(1, 'week').startOf('week');
  }
  if (dateStr.toLowerCase() === 'last month') {
    return now.subtract(1, 'month').startOf('month');
  }
  
  return null;
}

export function formatCommitMessage(template: string, title: string): string {
  return template.replace('{title}', title);
}