import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { PMCConfig, SearchOptions, EditOptions, GenerateOptions, UninstallOptions, CreateOptions, ListOptions, ShowOptions, WatchOptions, HistoryOptions, DiffOptions, RestoreOptions, VersionsOptions } from './types';
import { GitManager } from './git-manager';
import { PromptManager } from './prompt-manager';
import { DisplayManager } from './display';
import { SearchManager } from './search';
import { VersionCommands } from './version-commands';
import { fileExists, calculateFileHash, formatCommitMessage } from './utils';

export class PMCManager {
  private configPath: string;
  private promptsPath: string;
  private systemMetaPath: string;
  private hashPath: string;
  private config: PMCConfig;
  private git: GitManager;
  private promptManager: PromptManager;
  private displayManager: DisplayManager;
  private searchManager: SearchManager;
  private versionCommands: VersionCommands;

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
      },
      git: {
        enabled: true,
        autoCommit: true,
        commitMessageFormat: "Update prompt: {title}"
      }
    };
    
    // Initialize managers
    this.git = new GitManager(pmcDir);
    this.promptManager = new PromptManager(this.promptsPath, this.systemMetaPath);
    this.displayManager = new DisplayManager();
    this.searchManager = new SearchManager();
    this.versionCommands = new VersionCommands(this.git, this.config, this.promptsPath);
  }

  async initialize(): Promise<void> {
    try {
      const pmcDir = path.dirname(this.configPath);
      await fs.mkdir(pmcDir, { recursive: true });
      
      // Initialize config file
      if (!(await fileExists(this.configPath))) {
        await this.saveConfig();
      } else {
        await this.loadConfig();
      }

      // Initialize prompt files
      await this.promptManager.initializePromptsFile();
      await this.promptManager.initializeSystemMetaFile();

      // Initialize Git repository if enabled
      if (this.config.git.enabled) {
        await this.initializeGit();
      }

      // Auto-scan for changes on every command
      await this.autoScanChanges();
    } catch (error) {
      console.error('Failed to initialize PMC:', error);
      process.exit(1);
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
    
    const prompts = await this.promptManager.loadPrompts();
    const systemMeta = await this.promptManager.loadSystemMeta();
    
    // Combine system metadata with prompts
    const enrichedPrompts = prompts.map(prompt => ({
      ...prompt,
      systemMeta: systemMeta.get(prompt.title) || { created: '', updated: '', cwd: '' }
    }));

    const results = this.searchManager.filterPrompts(enrichedPrompts, options);
    this.displayManager.displayResults(results, options.contentMaxLength);
  }

  async showPrompt(options: ShowOptions): Promise<void> {
    await this.initialize();
    
    const prompts = await this.promptManager.loadPrompts();
    const systemMeta = await this.promptManager.loadSystemMeta();
    
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
    
    this.displayManager.displaySinglePrompt(enrichedPrompt);
  }

  async editPrompt(options: EditOptions): Promise<void> {
    console.log(chalk.blue('📝 Editing prompts'));
    console.log(chalk.gray('Edit the prompts.md file directly with your favorite editor.'));
    console.log(chalk.gray(`File location: ${this.promptsPath}`));
    
    if (options.title) {
      const prompts = await this.promptManager.loadPrompts();
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
    
    const prompts = await this.promptManager.loadPrompts();
    const systemMeta = await this.promptManager.loadSystemMeta();
    
    // Combine system metadata with prompts
    const enrichedPrompts = prompts.map(prompt => ({
      ...prompt,
      systemMeta: systemMeta.get(prompt.title) || { created: '', updated: '', cwd: '' }
    }));

    if (options.onlyTitles) {
      this.displayManager.displayTitlesOnly(enrichedPrompts);
    } else {
      this.displayManager.displayResults(enrichedPrompts);
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
      if (await fileExists(this.promptsPath)) {
        const prompts = await this.promptManager.loadPrompts();
        
        if (prompts.length > 1 || (prompts.length === 1 && !prompts[0].title.includes('Welcome'))) {
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
      if (await fileExists(installDir)) {
        await fs.rm(installDir, { recursive: true, force: true });
        console.log(chalk.gray(`✓ Removed installation directory: ${installDir}`));
      }

      // Remove binary symlink
      if (await fileExists(binPath)) {
        await fs.unlink(binPath);
        console.log(chalk.gray(`✓ Removed binary symlink: ${binPath}`));
      }

      // Remove configuration directory
      if (await fileExists(pmcDir)) {
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
      if (await fileExists(configFile)) {
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

  async watchPrompts(options: WatchOptions = {}): Promise<void> {
    await this.initialize();

    console.log(chalk.blue('🔍 Watching prompts.md for changes...'));
    console.log(chalk.gray(`File: ${this.promptsPath}`));
    console.log(chalk.gray('Press Ctrl+C to stop watching\n'));

    let lastModified = 0;
    let lastPrompts = await this.promptManager.loadPrompts();

    try {
      // Get initial state
      const stats = await fs.stat(this.promptsPath);
      lastModified = stats.mtimeMs;
      
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
          
          const currentPrompts = await this.promptManager.loadPrompts();
          const changedTitles = await this.promptManager.updateSystemMetadata(lastPrompts, currentPrompts, options.verbose);
          await this.commitChanges(changedTitles);
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

  private async autoScanChanges(): Promise<void> {
    try {
      if (!(await fileExists(this.promptsPath))) {
        return; // No prompts file to scan
      }

      const currentHash = await calculateFileHash(this.promptsPath);
      const storedHash = await this.getStoredHash();

      if (currentHash !== storedHash) {
        // File has changed, need to get old state for comparison
        const systemMeta = await this.promptManager.loadSystemMeta();
        const currentPrompts = await this.promptManager.loadPrompts();
        
        // Create old prompts from system metadata (approximation)
        const oldPrompts = Array.from(systemMeta.entries()).map(([title, meta]) => ({
          title,
          content: '', // We don't have old content, so changes will be detected by existence/non-existence
          userMeta: {},
          systemMeta: meta
        }));

        const changedTitles = await this.promptManager.updateSystemMetadata(oldPrompts, currentPrompts, false);
        await this.commitChanges(changedTitles);
        await this.storeHash(currentHash);
      }
    } catch (error) {
      // Silently handle errors in auto-scan to not disrupt user commands
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

  private async initializeGit(): Promise<void> {
    try {
      if (!(await this.git.isGitInstalled())) {
        console.log(chalk.yellow('⚠️  Git is not installed. Version control features disabled.'));
        this.config.git.enabled = false;
        return;
      }

      if (!(await this.git.isInitialized())) {
        await this.git.initialize();
        
        // Initial commit with prompts.md
        if (await fileExists(this.promptsPath)) {
          await this.git.addAndCommit('Initial PMC setup');
        }
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Failed to initialize Git. Version control features disabled.'));
      this.config.git.enabled = false;
    }
  }

  private async commitChanges(changedTitles: string[]): Promise<void> {
    if (!this.config.git.enabled || !this.config.git.autoCommit) {
      return;
    }

    try {
      let message: string;
      
      if (changedTitles.length === 1) {
        message = formatCommitMessage(this.config.git.commitMessageFormat, changedTitles[0]);
      } else if (changedTitles.length > 1) {
        message = `Update ${changedTitles.length} prompts`;
      } else {
        message = 'Update prompts';
      }

      await this.git.addAndCommit(message);
    } catch (error) {
      // Silently handle git errors to not disrupt user workflow
    }
  }

  // Version control command delegates
  async promptHistory(options: HistoryOptions): Promise<void> {
    await this.initialize();
    return this.versionCommands.history(options);
  }

  async promptDiff(options: DiffOptions): Promise<void> {
    await this.initialize();
    return this.versionCommands.diff(options);
  }

  async promptRestore(options: RestoreOptions): Promise<void> {
    await this.initialize();
    return this.versionCommands.restore(options);
  }

  async promptVersions(options: VersionsOptions): Promise<void> {
    await this.initialize();
    return this.versionCommands.versions(options);
  }
}