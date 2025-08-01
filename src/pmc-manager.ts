import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as YAML from 'yaml';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { PromptEntry, PMCConfig, SearchOptions, EditOptions, GenerateOptions } from './types';

export class PMCManager {
  private configPath: string;
  private config: PMCConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.pmc', 'pmc.yml');
    this.config = {
      data: [],
      settings: {
        colorEnabled: true,
        defaultEditor: 'nano',
        fallbackEditor: 'vi'
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      
      if (await this.fileExists(this.configPath)) {
        await this.loadConfig();
      } else {
        await this.saveConfig();
      }
    } catch (error) {
      console.error('Failed to initialize PMC:', error);
      process.exit(1);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.config = YAML.parse(content) || this.config;
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const yamlContent = YAML.stringify(this.config, { lineWidth: 0 });
      await fs.writeFile(this.configPath, yamlContent, 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  async createPrompt(): Promise<void> {
    await this.initialize();

    const tempFile = path.join(os.tmpdir(), `pmc-${Date.now()}.txt`);
    
    try {
      await this.openEditor(tempFile);
      
      const promptContent = await fs.readFile(tempFile, 'utf-8');
      
      if (promptContent.trim()) {
        const entry: PromptEntry = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          cwd: process.cwd(),
          prompt: promptContent.trim(),
          config: {}
        };

        this.config.data.push(entry);
        await this.saveConfig();
        
        console.log(chalk.green(`✓ Prompt saved with ID: ${entry.id}`));
      } else {
        console.log(chalk.yellow('No content entered, prompt not saved.'));
      }
    } finally {
      try {
        await fs.unlink(tempFile);
      } catch {}
    }
  }

  private async openEditor(filePath: string): Promise<void> {
    const editor = process.env.EDITOR || this.config.settings.defaultEditor;
    
    return new Promise((resolve, reject) => {
      const editorProcess = spawn(editor, [filePath], {
        stdio: 'inherit'
      });

      editorProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          const fallbackEditor = this.config.settings.fallbackEditor;
          if (editor !== fallbackEditor) {
            console.log(chalk.yellow(`${editor} failed, trying ${fallbackEditor}...`));
            
            const fallbackProcess = spawn(fallbackEditor, [filePath], {
              stdio: 'inherit'
            });

            fallbackProcess.on('close', (fallbackCode) => {
              if (fallbackCode === 0) {
                resolve();
              } else {
                reject(new Error(`Both ${editor} and ${fallbackEditor} failed`));
              }
            });
          } else {
            reject(new Error(`Editor ${editor} exited with code ${code}`));
          }
        }
      });

      editorProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async searchPrompts(options: SearchOptions): Promise<void> {
    await this.initialize();

    let results = [...this.config.data];

    if (options.dir) {
      results = results.filter(entry => 
        options.textInverse ? !entry.cwd.includes(options.dir!) : entry.cwd.includes(options.dir!)
      );
    }

    if (options.text) {
      const searchRegex = options.textRegexOff ? 
        new RegExp(options.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') :
        new RegExp(options.text, 'i');
      
      results = results.filter(entry => {
        const matches = searchRegex.test(entry.prompt);
        return options.textInverse ? !matches : matches;
      });
    }

    if (options.meta) {
      const [key, value] = options.meta.split('=');
      results = results.filter(entry => {
        const matches = entry.config[key] === value;
        return options.metaInverse ? !matches : matches;
      });
    }

    this.displayResults(results);
  }

  async editPrompt(options: EditOptions): Promise<void> {
    await this.initialize();

    let targetEntry: PromptEntry | null = null;

    if (options.id) {
      targetEntry = this.config.data.find(entry => entry.id === options.id) || null;
    } else if (options.text) {
      const searchRegex = new RegExp(options.text, 'i');
      const matches = this.config.data.filter(entry => searchRegex.test(entry.prompt));
      
      if (matches.length === 0) {
        console.log(chalk.red('No prompts found matching the search text.'));
        return;
      } else if (matches.length === 1) {
        targetEntry = matches[0];
      } else {
        targetEntry = await this.selectFromMultiple(matches);
      }
    } else {
      console.log(chalk.red('Please provide either --id or --text option.'));
      return;
    }

    if (!targetEntry) {
      console.log(chalk.red('Prompt not found.'));
      return;
    }

    const tempFile = path.join(os.tmpdir(), `pmc-edit-${Date.now()}.txt`);
    
    try {
      await fs.writeFile(tempFile, targetEntry.prompt, 'utf-8');
      await this.openEditor(tempFile);
      
      const updatedContent = await fs.readFile(tempFile, 'utf-8');
      
      if (updatedContent.trim() !== targetEntry.prompt) {
        targetEntry.prompt = updatedContent.trim();
        targetEntry.timestamp = new Date().toISOString();
        await this.saveConfig();
        
        console.log(chalk.green(`✓ Prompt ${targetEntry.id} updated successfully.`));
      } else {
        console.log(chalk.yellow('No changes made.'));
      }
    } finally {
      try {
        await fs.unlink(tempFile);
      } catch {}
    }
  }

  private async selectFromMultiple(entries: PromptEntry[]): Promise<PromptEntry | null> {
    const choices = entries.map(entry => ({
      name: `${entry.id.substring(0, 8)} - ${entry.prompt.substring(0, 50)}${entry.prompt.length > 50 ? '...' : ''}`,
      value: entry
    }));

    const { selectedEntry } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedEntry',
        message: 'Multiple prompts found. Select one to edit:',
        choices
      }
    ]);

    return selectedEntry;
  }

  async listPrompts(): Promise<void> {
    await this.initialize();
    this.displayResults(this.config.data);
  }

  async generatePrompts(options: GenerateOptions): Promise<void> {
    await this.initialize();

    if (options.sample) {
      await this.generateSamplePrompts();
    } else {
      console.log(chalk.yellow('Use --sample flag to generate predefined sample prompts.'));
      console.log(chalk.gray('Example: pmc generate --sample'));
    }
  }

  private async generateSamplePrompts(): Promise<void> {
    const samplePrompts: Omit<PromptEntry, 'id' | 'timestamp'>[] = [
      {
        cwd: '/home/user/projects/web-app',
        prompt: `Create a Docker configuration for a Node.js application with the following requirements:
- Use Alpine Linux base image for smaller size
- Install dependencies securely 
- Configure proper non-root user
- Expose port 3000
- Use multi-stage build for optimization`,
        config: {
          type: 'deployment',
          env: 'production',
          category: 'docker'
        }
      },
      {
        cwd: '/home/user/projects/api-service',
        prompt: `Generate comprehensive unit tests for a REST API with these specifications:
- Test all CRUD operations
- Mock external dependencies
- Include error handling scenarios  
- Validate request/response schemas
- Achieve 90%+ code coverage`,
        config: {
          type: 'testing',
          framework: 'jest',
          category: 'api'
        }
      },
      {
        cwd: '/home/user/projects/frontend',
        prompt: `Implement a responsive navigation component with:
- Mobile hamburger menu
- Dropdown submenus
- Active state highlighting
- Accessibility compliance (ARIA)
- CSS-in-JS or styled-components
- TypeScript interfaces`,
        config: {
          type: 'component',
          framework: 'react',
          category: 'ui'
        }
      },
      {
        cwd: '/home/user/projects/database',
        prompt: `Design a database schema for a blog platform including:
- Users table with authentication
- Posts with categories and tags
- Comments with threading support
- Proper indexing for performance
- Foreign key relationships
- Migration scripts`,
        config: {
          type: 'database',
          db: 'postgresql',
          category: 'schema'
        }
      },
      {
        cwd: '/home/user/projects/devops',
        prompt: `Create a CI/CD pipeline configuration that:
- Runs tests on pull requests
- Builds Docker images on merge
- Deploys to staging automatically
- Requires manual approval for production
- Includes security scanning
- Sends notifications on failure`,
        config: {
          type: 'cicd',
          platform: 'github-actions',
          category: 'automation'
        }
      },
      {
        cwd: '/home/user/projects/monitoring',
        prompt: `Set up application monitoring and logging with:
- Structured JSON logging
- Error tracking and alerting  
- Performance metrics collection
- Database query monitoring
- Health check endpoints
- Dashboard creation`,
        config: {
          type: 'monitoring',
          tools: 'prometheus,grafana',
          category: 'observability'
        }
      }
    ];

    let addedCount = 0;

    for (const samplePrompt of samplePrompts) {
      const existingPrompt = this.config.data.find(entry => 
        entry.prompt === samplePrompt.prompt
      );

      if (!existingPrompt) {
        const newEntry: PromptEntry = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          ...samplePrompt
        };

        this.config.data.push(newEntry);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await this.saveConfig();
      console.log(chalk.green(`✓ Generated ${addedCount} sample prompts successfully.`));
      console.log(chalk.gray(`Total prompts in database: ${this.config.data.length}`));
    } else {
      console.log(chalk.yellow('All sample prompts already exist in the database.'));
    }
  }

  private displayResults(results: PromptEntry[]): void {
    if (results.length === 0) {
      console.log(chalk.yellow('No prompts found.'));
      return;
    }

    console.log(chalk.blue(`Found ${results.length} prompt(s):\n`));

    results.forEach((entry, index) => {
      console.log(chalk.cyan(`[${index + 1}] ID: ${entry.id}`));
      console.log(chalk.gray(`    Timestamp: ${entry.timestamp}`));
      console.log(chalk.gray(`    Directory: ${entry.cwd}`));
      console.log(chalk.white(`    Prompt: ${entry.prompt.substring(0, 100)}${entry.prompt.length > 100 ? '...' : ''}`));
      
      if (Object.keys(entry.config).length > 0) {
        console.log(chalk.gray(`    Config: ${Object.entries(entry.config).map(([k, v]) => `${k}=${v}`).join(', ')}`));
      }
      
      console.log('');
    });
  }
}