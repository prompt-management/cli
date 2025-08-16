import { PromptEntry, SearchOptions } from './types';
import { parseDate } from './utils';

export class SearchManager {
  filterPrompts(prompts: PromptEntry[], options: SearchOptions): PromptEntry[] {
    let results = [...prompts];

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
        const createdDate = parseDate(prompt.systemMeta.created);
        if (!createdDate || !createdDate.isValid()) return true; // Include if no valid date
        
        if (options.dateAfter) {
          const afterDate = parseDate(options.dateAfter);
          if (afterDate && createdDate.isBefore(afterDate)) {
            return false;
          }
        }
        
        if (options.dateBefore) {
          const beforeDate = parseDate(options.dateBefore);
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

    return results;
  }
}