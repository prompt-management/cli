import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import { GitManager } from './git-manager';
import { PMCConfig, HistoryOptions, DiffOptions, RestoreOptions, VersionsOptions } from './types';

export class VersionCommands {
  private git: GitManager;
  private config: PMCConfig;
  private promptsPath: string;

  constructor(git: GitManager, config: PMCConfig, promptsPath: string) {
    this.git = git;
    this.config = config;
    this.promptsPath = promptsPath;
  }

  async history(options: HistoryOptions): Promise<void> {
    if (!this.config.git.enabled) {
      console.log(chalk.yellow('Git version control is disabled. Enable it in config to use history features.'));
      return;
    }

    const history = await this.git.getHistory(options.count || 10);
    
    if (history.length === 0) {
      console.log(chalk.yellow('No version history found.'));
      return;
    }

    console.log(chalk.blue(`📚 Prompt History (${history.length} entries):\n`));
    
    history.forEach((entry, index) => {
      console.log(chalk.cyan(`[${index + 1}] ${entry.hash}`) + chalk.gray(` (${entry.date}) `) + entry.message);
    });
  }

  async diff(options: DiffOptions): Promise<void> {
    if (!this.config.git.enabled) {
      console.log(chalk.yellow('Git version control is disabled. Enable it in config to use diff features.'));
      return;
    }

    const diff = await this.git.getDiff(options.version1, options.version2);
    
    if (!diff) {
      console.log(chalk.yellow('No differences found.'));
      return;
    }

    console.log(chalk.blue('📊 Diff:'));
    console.log(diff);
  }

  async restore(options: RestoreOptions): Promise<void> {
    if (!this.config.git.enabled) {
      console.log(chalk.yellow('Git version control is disabled. Enable it in config to use restore features.'));
      return;
    }

    const content = await this.git.showVersion(options.version);
    
    if (!content) {
      console.log(chalk.red(`❌ Version "${options.version}" not found.`));
      return;
    }

    let shouldRestore = options.confirm;

    if (!shouldRestore) {
      const { confirmRestore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmRestore',
          message: `Are you sure you want to restore prompts.md to version "${options.version}"?`,
          default: false
        }
      ]);
      shouldRestore = confirmRestore;
    }

    if (!shouldRestore) {
      console.log(chalk.green('Restore cancelled.'));
      return;
    }

    try {
      await fs.writeFile(this.promptsPath, content, 'utf-8');
      await this.git.addAndCommit(`Restore to version ${options.version}`);
      console.log(chalk.green(`✓ Restored prompts.md to version "${options.version}"`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to restore:'), error);
    }
  }

  async versions(options: VersionsOptions): Promise<void> {
    await this.history({ count: options.count });
  }
}