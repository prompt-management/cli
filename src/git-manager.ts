import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitManager {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  private async runGit(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git ${command}`, { cwd: this.repoPath });
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  async isGitInstalled(): Promise<boolean> {
    try {
      await execAsync('git --version');
      return true;
    } catch {
      return false;
    }
  }

  async isInitialized(): Promise<boolean> {
    try {
      await this.runGit('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    await this.runGit('init');
    await this.runGit('config user.name "PMC"');
    await this.runGit('config user.email "pmc@local"');
    
    // Create .gitignore
    const gitignorePath = path.join(this.repoPath, '.gitignore');
    await fs.writeFile(gitignorePath, [
      'prompts-system-meta.jsonl',
      '.prompts-hash',
      'pmc-config.yml'
    ].join('\n'), 'utf-8');
    
    await this.runGit('add .gitignore');
    await this.runGit('commit -m "Initial commit"');
  }

  async addAndCommit(message: string): Promise<void> {
    await this.runGit('add prompts.md');
    try {
      await this.runGit(`commit -m "${message.replace(/"/g, '\\"')}"`);
    } catch (error: any) {
      if (!error.message.includes('nothing to commit')) {
        throw error;
      }
    }
  }

  async getHistory(count: number = 10): Promise<Array<{hash: string, date: string, message: string}>> {
    try {
      const output = await this.runGit(`log --oneline --max-count=${count} --pretty=format:"%h|%ad|%s" --date=short`);
      return output.split('\n').map(line => {
        const [hash, date, message] = line.split('|');
        return { hash, date, message };
      });
    } catch {
      return [];
    }
  }

  async getDiff(version1?: string, version2?: string): Promise<string> {
    const v1 = version1 || 'HEAD~1';
    const v2 = version2 || 'HEAD';
    try {
      return await this.runGit(`diff ${v1} ${v2} -- prompts.md`);
    } catch {
      return '';
    }
  }

  async showVersion(version: string): Promise<string> {
    try {
      return await this.runGit(`show ${version}:prompts.md`);
    } catch {
      return '';
    }
  }
}