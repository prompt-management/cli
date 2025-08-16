import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as toml from '@iarna/toml';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { PromptEntry, PMCConfig, SearchOptions, EditOptions, GenerateOptions, UninstallOptions, CreateOptions, SystemMeta, ListOptions, ShowOptions, WatchOptions } from './types';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export class PMCManager {
  private configPath: string;
  private promptsPath: string;
  private systemMetaPath: string;
  private hashPath: string;
  private config: PMCConfig;

  constructor() {
    const pmcDir = path.join(os.homedir(), '.pmc');
    this.configPath = path.join(pmcDir, 'pmc-config.yml');
    this.promptsPath = path.join(pmcDir, 'prompts.md');
    this.systemMetaPath = path.join(pmcDir, 'prompts-system-meta.jsonl');
    this.hashPath = path.join(pmcDir, '.prompts-hash');
    this.config = {
      settings: {
        colorEnabled: true,
        ignoreKeysDuplicatesWarning: false
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      const pmcDir = path.dirname(this.configPath);
      await fs.mkdir(pmcDir, { recursive: true });
      
      // Initialize config file
      if (!(await this.fileExists(this.configPath))) {
        await this.saveConfig();
      } else {
        await this.loadConfig();
      }

      // Initialize prompts.md if it doesn't exist
      if (!(await this.fileExists(this.promptsPath))) {
        await fs.writeFile(this.promptsPath, '# Welcome to PMC\n\nThis file contains your prompts. Edit directly with your favorite editor!\n\n<!--\n[meta]\ndescription = "Welcome prompt for PMC"\ntags = ["welcome", "pmc"]\n-->\n\n', 'utf-8');
      }

      // Initialize system metadata file if it doesn't exist
      if (!(await this.fileExists(this.systemMetaPath))) {
        await fs.writeFile(this.systemMetaPath, '', 'utf-8');
      }

      // Auto-scan for changes on every command
      await this.autoScanChanges();
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
      const parsed = JSON.parse(content);
      this.config = { ...this.config, ...parsed };
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      const jsonContent = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, jsonContent, 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private async loadPrompts(): Promise<PromptEntry[]> {
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

  private async loadSystemMeta(): Promise<Map<string, SystemMeta>> {
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

  private async saveSystemMeta(prompts: PromptEntry[]): Promise<void> {
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

  async createPrompt(options: CreateOptions = {}): Promise<void> {
    console.log(chalk.blue('📝 Creating a new prompt'));
    console.log(chalk.gray('Edit the prompts.md file directly with your favorite editor.'));
    console.log(chalk.gray(`File location: ${this.promptsPath}`));
    console.log('');
    console.log(chalk.yellow('Format:'));
    console.log('# Your Prompt Title');
    console.log('');
    console.log('Your prompt content here...');
    console.log('');
    console.log('<!--');
    console.log('[meta]');
    console.log('description = "Description of your prompt"');
    console.log('tags = ["tag1", "tag2"]');
    console.log('-->');
  }

  async searchPrompts(options: SearchOptions): Promise<void> {
    await this.initialize();
    
    const prompts = await this.loadPrompts();
    const systemMeta = await this.loadSystemMeta();
    
    // Combine system metadata with prompts
    const enrichedPrompts = prompts.map(prompt => ({
      ...prompt,
      systemMeta: systemMeta.get(prompt.title) || { created: '', updated: '', cwd: '' }
    }));

    let results = [...enrichedPrompts];

    // Filter by directory
    if (options.dir) {
      results = results.filter(prompt => {
        const cwd = prompt.systemMeta.cwd || '';
        const matches = cwd.includes(options.dir!);
        return options.textInverse ? !matches : matches;
      });
    }

    // Filter by text content
    if (options.text) {
      const searchRegex = options.textRegexOff ? 
        new RegExp(options.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') :
        new RegExp(options.text, 'i');
      
      results = results.filter(prompt => {
        const matches = searchRegex.test(prompt.content);
        return options.textInverse ? !matches : matches;
      });
    }

    // Filter by title
    if (options.title) {
      const titleRegex = new RegExp(options.title, 'i');
      results = results.filter(prompt => titleRegex.test(prompt.title));
    }

    // Filter by date range
    if (options.dateAfter || options.dateBefore) {
      results = results.filter(prompt => {
        const createdDate = dayjs(prompt.systemMeta.created);
        if (!createdDate.isValid()) return true; // Include if no valid date
        
        if (options.dateAfter) {
          const afterDate = this.parseDate(options.dateAfter);
          if (afterDate && createdDate.isBefore(afterDate)) {
            return false;
          }
        }
        
        if (options.dateBefore) {
          const beforeDate = this.parseDate(options.dateBefore);
          if (beforeDate && createdDate.isAfter(beforeDate)) {
            return false;
          }
        }
        
        return true;
      });
    }

    // Filter by metadata
    if (options.meta) {
      const [key, value] = options.meta.split('=');
      results = results.filter(prompt => {
        const userMetaValue = prompt.userMeta[key];
        let matches = false;
        
        if (Array.isArray(userMetaValue)) {
          matches = userMetaValue.includes(value);
        } else {
          matches = String(userMetaValue) === value;
        }
        
        return options.metaInverse ? !matches : matches;
      });
    }

    this.displayResults(results, options.contentMaxLength);
  }

  async showPrompt(options: ShowOptions): Promise<void> {
    await this.initialize();
    
    const prompts = await this.loadPrompts();
    const systemMeta = await this.loadSystemMeta();
    
    // Find exact title match
    const found = prompts.find(prompt => prompt.title === options.title);
    
    if (!found) {
      console.log(chalk.red(`❌ No prompt found with exact title: "${options.title}"`));
      console.log(chalk.gray('Use "pmc list --only-titles" to see available titles'));
      console.log(chalk.gray('Or use "pmc search --title <pattern>" for partial matches'));
      return;
    }
    
    // Combine with system metadata
    const enrichedPrompt = {
      ...found,
      systemMeta: systemMeta.get(found.title) || { created: '', updated: '', cwd: '' }
    };
    
    this.displaySinglePrompt(enrichedPrompt);
  }

  async editPrompt(options: EditOptions): Promise<void> {
    console.log(chalk.blue('📝 Editing prompts'));
    console.log(chalk.gray('Edit the prompts.md file directly with your favorite editor.'));
    console.log(chalk.gray(`File location: ${this.promptsPath}`));
    
    if (options.title) {
      const prompts = await this.loadPrompts();
      const found = prompts.find(p => p.title.toLowerCase().includes(options.title!.toLowerCase()));
      
      if (found) {
        console.log(chalk.green(`Found prompt: "${found.title}"`));
      } else {
        console.log(chalk.yellow(`No prompt found matching title: "${options.title}"`));
      }
    }
  }

  async listPrompts(options: ListOptions = {}): Promise<void> {
    await this.initialize();
    
    const prompts = await this.loadPrompts();
    const systemMeta = await this.loadSystemMeta();
    
    // Combine system metadata with prompts
    const enrichedPrompts = prompts.map(prompt => ({
      ...prompt,
      systemMeta: systemMeta.get(prompt.title) || { created: '', updated: '', cwd: '' }
    }));

    if (options.onlyTitles) {
      this.displayTitlesOnly(enrichedPrompts);
    } else {
      this.displayResults(enrichedPrompts);
    }
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
    const sampleMarkdown = `# github setup (general)

To make the project public on GitHub, follow these steps:
1. setup .git/config with username and email: neko, neko@example.com
2. create a new repository on GitHub with \`gh repo create\`
3. configure the repository settings, such as description, homepage, and topics with \`gh repo edit\`
4. wait 5 seconds so human can read the above steps
5. push the local repository to GitHub with \`git push -u origin main\`

<!-- 
[meta]
description = "This is a general guide for setting up a public repository on GitHub."
tags = ["github", "setup", "general"]
-->

# github setup (private)

Run \`pmc search "github setup (general)"\` to see and understand the general steps for setting up a public repository on GitHub.
But for this time, we will create a private repository instead.
Note that:
- Instead of \`gh repo create\`, we will use \`gh repo create --private\`
- The rest of the steps remain the same.

<!-- 
[meta]
description = "Guide for setting up a private repository on GitHub"
tags = ["github", "setup", "private"]
-->

# nodejs initial setup

To set up a Node.js project, follow these steps:
1. Initialize a new Node.js project with \`npm init -y\`
2. Make sure to use the following dependencies for TypeScript and Node.js:

\`\`\`json
"devDependencies": {
  "@types/node": "^24.2.1",
  "tsx": "^4.20.4",
  "typescript": "^5.9.2"
}
\`\`\`

3. Create a .vscode/launch.json (if not exists) file with the following content:

\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "\${workspaceFolder}/src/index.ts"
    }
  ]
}
\`\`\`

<!-- 
[meta]
description = "Complete setup guide for Node.js projects with TypeScript"
tags = ["nodejs", "typescript", "setup", "vscode"]
language = "typescript"
-->

# docker node.js setup

Create a Docker configuration for a Node.js application with the following requirements:
- Use Alpine Linux base image for smaller size
- Install dependencies securely 
- Configure proper non-root user
- Expose port 3000
- Use multi-stage build for optimization

\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

<!-- 
[meta]
description = "Docker setup for Node.js applications with security best practices"
tags = ["docker", "nodejs", "deployment", "security"]
category = "deployment"
-->
`;

    try {
      // Check if prompts.md already has substantial content (more than just welcome message)
      if (await this.fileExists(this.promptsPath)) {
        const existingContent = await fs.readFile(this.promptsPath, 'utf-8');
        const promptsFromExisting = this.parseMarkdownPrompts(existingContent);
        
        if (promptsFromExisting.length > 1 || (promptsFromExisting.length === 1 && !promptsFromExisting[0].title.includes('Welcome'))) {
          console.log(chalk.yellow('prompts.md already has content. Sample prompts not added.'));
          console.log(chalk.gray('To see sample format, check the documentation.'));
          return;
        }
      }

      await fs.writeFile(this.promptsPath, sampleMarkdown, 'utf-8');
      
      // Create corresponding system metadata
      const now = new Date().toISOString();
      const cwd = process.cwd();
      
      const systemMetaEntries = [
        { title: 'github setup (general)', created: now, updated: now, cwd },
        { title: 'github setup (private)', created: now, updated: now, cwd },
        { title: 'nodejs initial setup', created: now, updated: now, cwd },
        { title: 'docker node.js setup', created: now, updated: now, cwd }
      ];

      const jsonLines = systemMetaEntries.map(entry => JSON.stringify(entry));
      await fs.writeFile(this.systemMetaPath, jsonLines.join('\n'), 'utf-8');

      console.log(chalk.green('✓ Generated sample prompts successfully.'));
      console.log(chalk.gray(`Edit prompts at: ${this.promptsPath}`));
      
    } catch (error) {
      console.error(chalk.red('Failed to generate sample prompts:'), error);
    }
  }

  async uninstallPMC(options: UninstallOptions): Promise<void> {
    const pmcDir = path.join(os.homedir(), '.pmc');
    const installDir = path.join(os.homedir(), '.pmc-cli');
    const binPath = path.join(os.homedir(), '.local', 'bin', 'pmc');

    console.log(chalk.yellow('⚠️  PMC Uninstallation'));
    console.log(chalk.gray('This will remove:'));
    console.log(chalk.gray(`  - Installation directory: ${installDir}`));
    console.log(chalk.gray(`  - Binary symlink: ${binPath}`));
    console.log(chalk.red(`  - Configuration and prompts: ${pmcDir}`));
    console.log('');

    let shouldUninstall = options.confirm;

    if (!shouldUninstall) {
      const { confirmUninstall } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmUninstall',
          message: 'Are you sure you want to uninstall PMC? This will delete all your prompts.',
          default: false
        }
      ]);
      shouldUninstall = confirmUninstall;
    }

    if (!shouldUninstall) {
      console.log(chalk.green('Uninstallation cancelled.'));
      return;
    }

    console.log(chalk.blue('Uninstalling PMC...'));

    try {
      // Remove installation directory
      if (await this.fileExists(installDir)) {
        await fs.rm(installDir, { recursive: true, force: true });
        console.log(chalk.gray(`✓ Removed installation directory: ${installDir}`));
      }

      // Remove binary symlink
      if (await this.fileExists(binPath)) {
        await fs.unlink(binPath);
        console.log(chalk.gray(`✓ Removed binary symlink: ${binPath}`));
      }

      // Remove configuration directory
      if (await this.fileExists(pmcDir)) {
        await fs.rm(pmcDir, { recursive: true, force: true });
        console.log(chalk.gray(`✓ Removed configuration directory: ${pmcDir}`));
      }

      // Clean up shell configurations
      await this.cleanupShellConfigs();

      console.log('');
      console.log(chalk.green('✅ PMC has been successfully uninstalled!'));
      console.log(chalk.yellow('Note: You may need to restart your terminal or run "hash -r" to update your PATH.'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error during uninstallation:'), error);
      console.log(chalk.yellow('You may need to manually remove the following directories:'));
      console.log(chalk.gray(`  - ${installDir}`));
      console.log(chalk.gray(`  - ${binPath}`));
      console.log(chalk.gray(`  - ${pmcDir}`));
      process.exit(1);
    }
  }

  private async cleanupShellConfigs(): Promise<void> {
    const binDir = path.join(os.homedir(), '.local', 'bin');
    const configFiles = [
      path.join(os.homedir(), '.bashrc'),
      path.join(os.homedir(), '.zshrc'),
      path.join(os.homedir(), '.profile')
    ];

    for (const configFile of configFiles) {
      if (await this.fileExists(configFile)) {
        try {
          const content = await fs.readFile(configFile, 'utf-8');
          const lines = content.split('\n');
          const filteredLines = lines.filter(line => 
            !line.includes('# Added by PMC installer') &&
            !line.includes(`export PATH="$PATH:${binDir}"`) &&
            !line.includes(`export PATH="\$PATH:${binDir}"`)
          );
          
          if (filteredLines.length !== lines.length) {
            await fs.writeFile(configFile, filteredLines.join('\n'), 'utf-8');
            console.log(chalk.gray(`✓ Cleaned up ${configFile}`));
          }
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Could not clean up ${configFile}: ${error}`));
        }
      }
    }
  }

  private parseDate(dateStr: string): dayjs.Dayjs | null {
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
    
    console.warn(chalk.yellow(`Warning: Could not parse date "${dateStr}"`));
    return null;
  }

  private displayTitlesOnly(results: PromptEntry[]): void {
    if (results.length === 0) {
      console.log(chalk.yellow('No prompts found.'));
      return;
    }

    console.log(chalk.blue(`Found ${results.length} prompt(s):\n`));
    
    results.forEach((prompt, index) => {
      const dateStr = prompt.systemMeta.created ? 
        dayjs(prompt.systemMeta.created).format('YYYY-MM-DD') : 
        'no-date';
      
      console.log(chalk.cyan(`[${index + 1}]`) + ` ${prompt.title} ` + chalk.gray(`(${dateStr})`));
    });
    
    console.log('');
    console.log(chalk.gray('Use "pmc list" for detailed view or "pmc search --title <pattern>" to filter.'));
  }

  private displaySinglePrompt(prompt: PromptEntry): void {
    console.log(chalk.cyan(`📄 ${prompt.title}`));
    console.log('');
    
    if (prompt.systemMeta.created) {
      console.log(chalk.gray(`Created: ${dayjs(prompt.systemMeta.created).format('YYYY-MM-DD HH:mm:ss')}`));
    }
    if (prompt.systemMeta.updated) {
      console.log(chalk.gray(`Updated: ${dayjs(prompt.systemMeta.updated).format('YYYY-MM-DD HH:mm:ss')}`));
    }
    if (prompt.systemMeta.cwd) {
      console.log(chalk.gray(`Directory: ${prompt.systemMeta.cwd}`));
    }
    
    // Display user metadata
    if (Object.keys(prompt.userMeta).length > 0) {
      const metaEntries = Object.entries(prompt.userMeta).map(([k, v]) => {
        if (Array.isArray(v)) {
          return `${k}=[${v.join(', ')}]`;
        }
        return `${k}=${v}`;
      });
      console.log(chalk.gray(`Metadata: ${metaEntries.join(', ')}`));
    }
    
    console.log('');
    console.log(chalk.blue('Content:'));
    console.log(chalk.white(prompt.content));
    console.log('');
  }

  private displayResults(results: PromptEntry[], contentMaxLength: number = 100): void {
    if (results.length === 0) {
      console.log(chalk.yellow('No prompts found.'));
      return;
    }

    console.log(chalk.blue(`Found ${results.length} prompt(s):\n`));

    results.forEach((prompt, index) => {
      console.log(chalk.cyan(`[${index + 1}] ${prompt.title}`));
      
      if (prompt.systemMeta.created) {
        console.log(chalk.gray(`    Created: ${prompt.systemMeta.created}`));
      }
      if (prompt.systemMeta.updated) {
        console.log(chalk.gray(`    Updated: ${prompt.systemMeta.updated}`));
      }
      if (prompt.systemMeta.cwd) {
        console.log(chalk.gray(`    Directory: ${prompt.systemMeta.cwd}`));
      }
      
      // Display content with controlled length
      let contentDisplay: string;
      if (contentMaxLength === -1) {
        // Show full content
        contentDisplay = prompt.content;
      } else {
        // Show truncated content
        contentDisplay = prompt.content.substring(0, contentMaxLength);
        if (prompt.content.length > contentMaxLength) {
          contentDisplay += '...';
        }
      }
      console.log(chalk.white(`    Content: ${contentDisplay}`));
      
      // Display user metadata
      if (Object.keys(prompt.userMeta).length > 0) {
        const metaEntries = Object.entries(prompt.userMeta).map(([k, v]) => {
          if (Array.isArray(v)) {
            return `${k}=[${v.join(', ')}]`;
          }
          return `${k}=${v}`;
        });
        console.log(chalk.gray(`    Meta: ${metaEntries.join(', ')}`));
      }
      
      console.log('');
    });
  }

  async watchPrompts(options: WatchOptions = {}): Promise<void> {
    await this.initialize();

    console.log(chalk.blue('🔍 Watching prompts.md for changes...'));
    console.log(chalk.gray(`File: ${this.promptsPath}`));
    console.log(chalk.gray('Press Ctrl+C to stop watching\n'));

    let lastModified = 0;
    let lastPrompts: PromptEntry[] = [];

    try {
      // Get initial state
      const stats = await fs.stat(this.promptsPath);
      lastModified = stats.mtimeMs;
      lastPrompts = await this.loadPrompts();
      
      if (options.verbose) {
        console.log(chalk.green(`✓ Initial scan: ${lastPrompts.length} prompts found`));
      }
    } catch (error) {
      console.error(chalk.red('Failed to initialize watcher:'), error);
      return;
    }

    // Watch for changes
    const watcher = setInterval(async () => {
      try {
        const stats = await fs.stat(this.promptsPath);
        
        if (stats.mtimeMs > lastModified) {
          lastModified = stats.mtimeMs;
          
          if (options.verbose) {
            console.log(chalk.yellow('📝 File changed, updating metadata...'));
          }
          
          const currentPrompts = await this.loadPrompts();
          await this.updateSystemMetadata(lastPrompts, currentPrompts, options.verbose);
          lastPrompts = currentPrompts;
          
          console.log(chalk.green(`✓ Updated at ${new Date().toLocaleTimeString()}`));
        }
      } catch (error) {
        if (options.verbose) {
          console.error(chalk.red('Error checking file:'), error);
        }
      }
    }, 1000); // Check every second

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      clearInterval(watcher);
      console.log('\n' + chalk.blue('👋 Stopped watching prompts.md'));
      process.exit(0);
    });
  }

  private async updateSystemMetadata(oldPrompts: PromptEntry[], newPrompts: PromptEntry[], verbose: boolean = false): Promise<void> {
    const systemMeta = await this.loadSystemMeta();
    const now = new Date().toISOString();
    const cwd = process.cwd();
    
    // Create maps for easier lookup
    const newTitles = new Set(newPrompts.map(p => p.title));
    
    let changes = 0;
    
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
  }

  private async autoScanChanges(): Promise<void> {
    try {
      if (!(await this.fileExists(this.promptsPath))) {
        return; // No prompts file to scan
      }

      const currentHash = await this.calculateFileHash(this.promptsPath);
      const storedHash = await this.getStoredHash();

      if (currentHash !== storedHash) {
        // File has changed, need to get old state for comparison
        const systemMeta = await this.loadSystemMeta();
        const currentPrompts = await this.loadPrompts();
        
        // Create old prompts from system metadata (approximation)
        const oldPrompts: PromptEntry[] = Array.from(systemMeta.entries()).map(([title, meta]) => ({
          title,
          content: '', // We don't have old content, so changes will be detected by existence/non-existence
          userMeta: {},
          systemMeta: meta
        }));

        await this.updateSystemMetadata(oldPrompts, currentPrompts, false);
        await this.storeHash(currentHash);
      }
    } catch (error) {
      // Silently handle errors in auto-scan to not disrupt user commands
    }
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return '';
    }
  }

  private async getStoredHash(): Promise<string> {
    try {
      return await fs.readFile(this.hashPath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  private async storeHash(hash: string): Promise<void> {
    try {
      await fs.writeFile(this.hashPath, hash, 'utf-8');
    } catch (error) {
      // Silently handle errors
    }
  }
}