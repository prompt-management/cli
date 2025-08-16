import * as fs from 'fs/promises';
import * as toml from '@iarna/toml';
import chalk from 'chalk';
import { PromptEntry, SystemMeta } from './types';
import { fileExists } from './utils';

export class PromptManager {
  private promptsPath: string;
  private systemMetaPath: string;

  constructor(promptsPath: string, systemMetaPath: string) {
    this.promptsPath = promptsPath;
    this.systemMetaPath = systemMetaPath;
  }

  async loadPrompts(): Promise<PromptEntry[]> {
    try {
      const markdownContent = await fs.readFile(this.promptsPath, 'utf-8');
      return this.parseMarkdownPrompts(markdownContent);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      return [];
    }
  }

  private parseMarkdownPrompts(content: string): PromptEntry[] {
    const prompts: PromptEntry[] = [];
    const sections = content.split(/^# /gm).filter(s => s.trim());
    
    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      
      // Extract metadata comment
      const metaMatch = section.match(/<!--\s*\n?\[meta\]\s*\n([\s\S]*?)\n?\s*-->/);
      let userMeta: Record<string, any> = {};
      
      if (metaMatch) {
        try {
          userMeta = toml.parse(metaMatch[1]);
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Invalid TOML metadata in prompt "${title}"`));
        }
      }

      // Extract content (everything except the title and metadata comment)
      let content = section.replace(/<!--\s*\n?\[meta\]\s*\n[\s\S]*?\n?\s*-->/g, '').trim();
      // Remove the title line
      content = content.split('\n').slice(1).join('\n').trim();
      
      if (title && content) {
        prompts.push({
          title,
          content,
          userMeta,
          systemMeta: { created: '', updated: '', cwd: '' } // Will be loaded separately
        });
      }
    }

    return prompts;
  }

  async loadSystemMeta(): Promise<Map<string, SystemMeta>> {
    const systemMeta = new Map<string, SystemMeta>();
    
    try {
      const content = await fs.readFile(this.systemMetaPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.title) {
            systemMeta.set(entry.title, {
              created: entry.created || '',
              updated: entry.updated || '',
              cwd: entry.cwd || ''
            });
          }
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Invalid JSON line in system metadata`));
        }
      }
    } catch (error) {
      // File doesn't exist or is empty, that's ok
    }

    return systemMeta;
  }

  async saveSystemMeta(prompts: PromptEntry[]): Promise<void> {
    try {
      const lines = prompts.map(prompt => 
        JSON.stringify({
          title: prompt.title,
          created: prompt.systemMeta.created,
          updated: prompt.systemMeta.updated,
          cwd: prompt.systemMeta.cwd
        })
      );
      
      await fs.writeFile(this.systemMetaPath, lines.join('\n'), 'utf-8');
    } catch (error) {
      console.error('Failed to save system metadata:', error);
    }
  }

  async updateSystemMetadata(oldPrompts: PromptEntry[], newPrompts: PromptEntry[], verbose: boolean = false): Promise<string[]> {
    const systemMeta = await this.loadSystemMeta();
    const now = new Date().toISOString();
    const cwd = process.cwd();
    
    // Create maps for easier lookup
    const newTitles = new Set(newPrompts.map(p => p.title));
    
    let changes = 0;
    const changedTitles: string[] = [];
    
    // Process each new prompt
    for (const prompt of newPrompts) {
      const existing = systemMeta.get(prompt.title);
      
      if (!existing) {
        // New prompt
        systemMeta.set(prompt.title, {
          created: now,
          updated: now,
          cwd
        });
        changes++;
        changedTitles.push(prompt.title);
        
        if (verbose) {
          console.log(chalk.green(`  + Added: "${prompt.title}"`));
        }
      } else {
        // Check if content changed by comparing with old prompts
        const oldPrompt = oldPrompts.find(p => p.title === prompt.title);
        if (oldPrompt && oldPrompt.content !== prompt.content) {
          // Content changed
          systemMeta.set(prompt.title, {
            ...existing,
            updated: now,
            cwd
          });
          changes++;
          changedTitles.push(prompt.title);
          
          if (verbose) {
            console.log(chalk.blue(`  ~ Modified: "${prompt.title}"`));
          }
        }
      }
    }
    
    // Remove metadata for deleted prompts
    for (const [title] of systemMeta) {
      if (!newTitles.has(title)) {
        systemMeta.delete(title);
        changes++;
        changedTitles.push(`${title} (deleted)`);
        
        if (verbose) {
          console.log(chalk.red(`  - Removed: "${title}"`));
        }
      }
    }
    
    // Save updated metadata if there were changes
    if (changes > 0) {
      const updatedPrompts = newPrompts.map(prompt => ({
        ...prompt,
        systemMeta: systemMeta.get(prompt.title) || { created: '', updated: '', cwd: '' }
      }));
      
      await this.saveSystemMeta(updatedPrompts);
      
      if (verbose) {
        console.log(chalk.gray(`  📊 ${changes} change(s) processed`));
      }
    }
    
    return changedTitles;
  }

  async initializePromptsFile(): Promise<void> {
    if (!(await fileExists(this.promptsPath))) {
      await fs.writeFile(this.promptsPath, '# Welcome to PMC\n\nThis file contains your prompts. Edit directly with your favorite editor!\n\n<!--\n[meta]\ndescription = "Welcome prompt for PMC"\ntags = ["welcome", "pmc"]\n-->\n\n', 'utf-8');
    }
  }

  async initializeSystemMetaFile(): Promise<void> {
    if (!(await fileExists(this.systemMetaPath))) {
      await fs.writeFile(this.systemMetaPath, '', 'utf-8');
    }
  }
}