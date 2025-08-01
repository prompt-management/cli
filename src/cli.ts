#!/usr/bin/env node

import { Command } from 'commander';
import { PMCManager } from './pmc-manager';
import { SearchOptions, EditOptions, GenerateOptions } from './types';

const program = new Command();
const pmc = new PMCManager();

program
  .name('pmc')
  .description('Prompt Management CLI - A tool for managing AI prompts')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new prompt (opens text editor)')
  .action(async () => {
    await pmc.createPrompt();
  });

program
  .command('search')
  .alias('s')
  .description('Search prompts')
  .option('--dir <directory>', 'Target directory to filter by')
  .option('--text <text>', 'Text to search for in prompts')
  .option('--text-regex-off', 'Disable regex for text search')
  .option('--text-inverse', 'Invert text search results')
  .option('--meta <meta>', 'Metadata filter (format: key=value)')
  .option('--meta-inverse', 'Invert metadata search results')
  .action(async (options: SearchOptions) => {
    await pmc.searchPrompts(options);
  });

program
  .command('edit')
  .alias('e')
  .description('Edit an existing prompt')
  .option('--id <id>', 'Prompt ID to edit')
  .option('--text <text>', 'Text to search for when selecting prompt to edit')
  .action(async (options: EditOptions) => {
    await pmc.editPrompt(options);
  });

program
  .command('list')
  .alias('ls')
  .description('List all prompts')
  .action(async () => {
    await pmc.listPrompts();
  });

program
  .command('generate')
  .alias('g')
  .description('Generate sample prompts')
  .option('--sample', 'Generate predefined sample prompts')
  .action(async (options: GenerateOptions) => {
    await pmc.generatePrompts(options);
  });

program.parse();

if (!process.argv.slice(2).length) {
  pmc.createPrompt();
}