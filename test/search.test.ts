import { SearchManager } from '../src/search';
import { PromptEntry } from '../src/types';

describe('SearchManager', () => {
  let searchManager: SearchManager;
  let mockPrompts: PromptEntry[];

  beforeEach(() => {
    searchManager = new SearchManager();
    mockPrompts = [
      {
        title: 'Docker Setup',
        content: 'How to set up Docker containers with Node.js',
        userMeta: { tags: ['docker', 'nodejs'], category: 'setup' },
        systemMeta: { created: '2024-01-01T00:00:00.000Z', updated: '2024-01-02T00:00:00.000Z', cwd: '/project1' }
      },
      {
        title: 'Git Workflow',
        content: 'Best practices for Git branching and merging',
        userMeta: { tags: ['git', 'workflow'], category: 'development' },
        systemMeta: { created: '2024-01-05T00:00:00.000Z', updated: '2024-01-06T00:00:00.000Z', cwd: '/project2' }
      },
      {
        title: 'React Components',
        content: 'Creating reusable React components with TypeScript',
        userMeta: { tags: ['react', 'typescript'], category: 'frontend' },
        systemMeta: { created: '2024-01-10T00:00:00.000Z', updated: '2024-01-11T00:00:00.000Z', cwd: '/project1' }
      }
    ];
  });

  describe('filterPrompts', () => {
    it('should filter by title', () => {
      const results = searchManager.filterPrompts(mockPrompts, { title: 'docker' });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Docker Setup');
    });

    it('should filter by text content', () => {
      const results = searchManager.filterPrompts(mockPrompts, { text: 'typescript' });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('React Components');
    });

    it('should filter by directory', () => {
      const results = searchManager.filterPrompts(mockPrompts, { dir: 'project1' });
      expect(results).toHaveLength(2);
      expect(results.map(p => p.title)).toContain('Docker Setup');
      expect(results.map(p => p.title)).toContain('React Components');
    });

    it('should filter by metadata', () => {
      const results = searchManager.filterPrompts(mockPrompts, { meta: 'category=setup' });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Docker Setup');

      const tagResults = searchManager.filterPrompts(mockPrompts, { meta: 'tags=git' });
      expect(tagResults).toHaveLength(1);
      expect(tagResults[0].title).toBe('Git Workflow');
    });

    it('should support text inversion', () => {
      const results = searchManager.filterPrompts(mockPrompts, { text: 'docker', textInverse: true });
      expect(results).toHaveLength(2);
      expect(results.map(p => p.title)).not.toContain('Docker Setup');
    });

    it('should support regex disabled', () => {
      const results = searchManager.filterPrompts(mockPrompts, { text: 'Node.js', textRegexOff: true });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Docker Setup');
    });

    it('should combine multiple filters', () => {
      const results = searchManager.filterPrompts(mockPrompts, { 
        dir: 'project1',
        meta: 'category=setup'
      });
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Docker Setup');
    });

    it('should return all prompts when no filters are applied', () => {
      const results = searchManager.filterPrompts(mockPrompts, {});
      expect(results).toHaveLength(3);
    });
  });
});