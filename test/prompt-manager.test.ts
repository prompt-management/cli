import { PromptManager } from '../src/prompt-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PromptManager', () => {
  let tempDir: string;
  let promptsPath: string;
  let systemMetaPath: string;
  let promptManager: PromptManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-test-'));
    promptsPath = path.join(tempDir, 'prompts.md');
    systemMetaPath = path.join(tempDir, 'meta.jsonl');
    promptManager = new PromptManager(promptsPath, systemMetaPath);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('loadPrompts', () => {
    it('should parse markdown prompts correctly', async () => {
      const markdown = `# Test Prompt 1

This is test content 1.

<!--
[meta]
tags = ["test", "example"]
description = "Test prompt"
-->

# Test Prompt 2

This is test content 2.

<!--
[meta]
category = "example"
-->
`;

      await fs.writeFile(promptsPath, markdown, 'utf-8');
      const prompts = await promptManager.loadPrompts();

      expect(prompts).toHaveLength(2);
      expect(prompts[0].title).toBe('Test Prompt 1');
      expect(prompts[0].content).toBe('This is test content 1.');
      expect(prompts[0].userMeta.tags).toEqual(['test', 'example']);
      expect(prompts[0].userMeta.description).toBe('Test prompt');

      expect(prompts[1].title).toBe('Test Prompt 2');
      expect(prompts[1].content).toBe('This is test content 2.');
      expect(prompts[1].userMeta.category).toBe('example');
    });

    it('should handle prompts without metadata', async () => {
      const markdown = `# Simple Prompt

Just content without metadata.
`;

      await fs.writeFile(promptsPath, markdown, 'utf-8');
      const prompts = await promptManager.loadPrompts();

      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe('Simple Prompt');
      expect(prompts[0].content).toBe('Just content without metadata.');
      expect(prompts[0].userMeta).toEqual({});
    });

    it('should return empty array for non-existent file', async () => {
      const prompts = await promptManager.loadPrompts();
      expect(prompts).toEqual([]);
    });
  });

  describe('loadSystemMeta', () => {
    it('should load system metadata from JSONL', async () => {
      const jsonl = `{"title":"Prompt 1","created":"2024-01-01T00:00:00.000Z","updated":"2024-01-02T00:00:00.000Z","cwd":"/test"}
{"title":"Prompt 2","created":"2024-01-03T00:00:00.000Z","updated":"2024-01-04T00:00:00.000Z","cwd":"/test2"}`;

      await fs.writeFile(systemMetaPath, jsonl, 'utf-8');
      const meta = await promptManager.loadSystemMeta();

      expect(meta.size).toBe(2);
      expect(meta.get('Prompt 1')).toEqual({
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-02T00:00:00.000Z',
        cwd: '/test'
      });
    });

    it('should handle empty metadata file', async () => {
      const meta = await promptManager.loadSystemMeta();
      expect(meta.size).toBe(0);
    });
  });

  describe('updateSystemMetadata', () => {
    it('should detect new prompts', async () => {
      const oldPrompts: any[] = [];
      const newPrompts = [
        {
          title: 'New Prompt',
          content: 'Content',
          userMeta: {},
          systemMeta: { created: '', updated: '', cwd: '' }
        }
      ];

      const changedTitles = await promptManager.updateSystemMetadata(oldPrompts, newPrompts);
      expect(changedTitles).toContain('New Prompt');

      const meta = await promptManager.loadSystemMeta();
      expect(meta.has('New Prompt')).toBe(true);
    });

    it('should detect modified prompts', async () => {
      // First, create a prompt
      await promptManager.saveSystemMeta([{
        title: 'Test Prompt',
        content: 'Original content',
        userMeta: {},
        systemMeta: { created: '2024-01-01T00:00:00.000Z', updated: '2024-01-01T00:00:00.000Z', cwd: '/test' }
      }]);

      const oldPrompts = [
        {
          title: 'Test Prompt',
          content: 'Original content',
          userMeta: {},
          systemMeta: { created: '2024-01-01T00:00:00.000Z', updated: '2024-01-01T00:00:00.000Z', cwd: '/test' }
        }
      ];

      const newPrompts = [
        {
          title: 'Test Prompt',
          content: 'Modified content',
          userMeta: {},
          systemMeta: { created: '2024-01-01T00:00:00.000Z', updated: '2024-01-01T00:00:00.000Z', cwd: '/test' }
        }
      ];

      const changedTitles = await promptManager.updateSystemMetadata(oldPrompts, newPrompts);
      expect(changedTitles).toContain('Test Prompt');
    });
  });
});