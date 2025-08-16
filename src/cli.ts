#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { PMCManager } from './pmc-manager';
import { SearchOptions, EditOptions, GenerateOptions, UninstallOptions, CreateOptions, ListOptions, ShowOptions, WatchOptions, HistoryOptions, DiffOptions, RestoreOptions, VersionsOptions } from './types';

const program = new Command();

// Helper function to get PMC instance with options
function getPMC(): PMCManager {
  const options = program.opts();
  return new PMCManager(options.promptsFile);
}

program
  .name('pmc')
  .description('Prompt Management CLI - A tool for managing AI prompts')
  .version('1.0.0')
  .option('--prompts-file <path>', 'Specify custom prompts.md file path');

program
  .command('create')
  .alias('c')
  .description('Create a new prompt (edit prompts.md file directly)')
  .option('--ignore-duplicates-warning', 'Ignore duplicate title warnings')
  .action(async (options: CreateOptions) => {
    await getPMC().createPrompt(options);
  });

program
  .command('search')
  .alias('s')
  .description('Search prompts with flexible filtering options')
  .option('--dir <directory>', 'Filter by directory path (supports partial matches)')
  .option('--text <text>', 'Search in prompt content (regex supported by default)')
  .option('--text-regex-off', 'Disable regex for text search (literal string match)')
  .option('--text-inverse', 'Invert text search results (show non-matching)')
  .option('--title <title>', 'Search in prompt titles (regex supported)')
  .option('--meta <meta>', 'Filter by metadata (format: key=value)')
  .option('--meta-inverse', 'Invert metadata search results')
  .option('--date-after <date>', 'Show prompts created after date (YYYY-MM-DD, YYYY-MM-DD HH:mm, or relative like "7 days ago")')
  .option('--date-before <date>', 'Show prompts created before date (YYYY-MM-DD, YYYY-MM-DD HH:mm, or relative like "1 week ago")')
  .option('-m, --content-max-length <length>', 'Maximum content length to display (-1 for full content, default: 100)', (value) => parseInt(value), 100)
  .action(async (options: SearchOptions, cmd) => {
    // Show help if no search criteria provided (only contentMaxLength doesn't count)
    const searchCriteria = Object.keys(options).filter(key => key !== 'contentMaxLength');
    if (searchCriteria.length === 0) {
      cmd.help();
      console.log('\n' + chalk.blue('Examples:'));
      console.log('  pmc search --title "docker"                 # Find prompts with "docker" in title');
      console.log('  pmc search --text "kubernetes"              # Search content for "kubernetes"');
      console.log('  pmc search --meta "tags=github"             # Find prompts tagged with "github"');
      console.log('  pmc search --dir "/home/user/projects"      # Filter by directory');
      console.log('  pmc search --date-after "2024-01-01"       # Created after specific date');
      console.log('  pmc search --date-after "7 days ago"       # Created in last 7 days');
      console.log('  pmc search --date-before "last week"       # Created before last week');
      console.log('  pmc search --title "setup" --meta "tags=nodejs" # Combine filters');
      console.log('  pmc search --text "docker" --text-inverse  # Find prompts NOT about docker');
      console.log('  pmc search --title "nodejs" -m 200         # Show more content (200 chars)');
      console.log('  pmc search --meta "tags=setup" -m -1      # Show full content');
      console.log('\n' + chalk.blue('Date formats supported:'));
      console.log('  • YYYY-MM-DD (e.g., 2024-01-15)');
      console.log('  • YYYY-MM-DD HH:mm (e.g., 2024-01-15 14:30)');
      console.log('  • Relative: "X days ago", "X weeks ago", "X months ago"');
      console.log('  • Keywords: "today", "yesterday", "last week", "last month"');
      console.log('\n' + chalk.blue('Metadata search examples:'));
      console.log('  • --meta "tags=docker"     # Exact tag match');
      console.log('  • --meta "category=setup"  # Custom metadata fields');
      console.log('  • --meta "language=typescript" # Any TOML field from prompts');
      return;
    }
    await getPMC().searchPrompts(options);
  });

program
  .command('edit')
  .alias('e')
  .description('Edit prompts (edit prompts.md file directly)')
  .option('--title <title>', 'Search for prompt by title')
  .option('--text <text>', 'Text to search for when selecting prompt to edit')
  .action(async (options: EditOptions) => {
    await getPMC().editPrompt(options);
  });

program
  .command('list')
  .alias('ls')
  .description('List all prompts')
  .option('--only-titles', 'Show only prompt titles (compact view)')
  .action(async (options: ListOptions) => {
    await getPMC().listPrompts(options);
  });

program
  .command('show <title>')
  .description('Show full content of a prompt by exact title')
  .action(async (title: string) => {
    await getPMC().showPrompt({ title });
  });

program
  .command('generate')
  .alias('g')
  .description('Generate sample prompts')
  .option('--sample', 'Generate predefined sample prompts')
  .action(async (options: GenerateOptions) => {
    await getPMC().generatePrompts(options);
  });

program
  .command('uninstall')
  .description('Uninstall PMC from the system')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (options: UninstallOptions) => {
    await getPMC().uninstallPMC(options);
  });

program
  .command('watch')
  .alias('w')
  .description('Monitor changes to prompts.md and update system metadata')
  .option('-v, --verbose', 'Show detailed information about file changes')
  .action(async (options: WatchOptions) => {
    await getPMC().watchPrompts(options);
  });

program
  .command('history')
  .description('Show version history of prompts')
  .option('-c, --count <number>', 'Number of history entries to show', (value) => parseInt(value), 10)
  .action(async (options: HistoryOptions) => {
    await getPMC().promptHistory(options);
  });

program
  .command('diff [version1] [version2]')
  .description('Show differences between prompt versions')
  .action(async (version1: string, version2: string) => {
    await getPMC().promptDiff({ title: '', version1, version2 });
  });

program
  .command('restore <version>')
  .description('Restore prompts.md to a specific version')
  .option('--confirm', 'Skip confirmation prompt')
  .action(async (version: string, options: Omit<RestoreOptions, 'title' | 'version'>) => {
    await getPMC().promptRestore({ title: '', version, ...options });
  });

program
  .command('versions')
  .description('List all available versions')
  .option('-c, --count <number>', 'Number of versions to show', (value) => parseInt(value), 10)
  .action(async (options: VersionsOptions) => {
    await getPMC().promptVersions(options);
  });

program.parse();

if (!process.argv.slice(2).length) {
  getPMC().createPrompt();
}