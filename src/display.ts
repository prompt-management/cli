import chalk from 'chalk';
import dayjs from 'dayjs';
import { PromptEntry } from './types';

export class DisplayManager {
  displayTitlesOnly(results: PromptEntry[]): void {
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

  displaySinglePrompt(prompt: PromptEntry): void {
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

  displayResults(results: PromptEntry[], contentMaxLength: number = 100): void {
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
}