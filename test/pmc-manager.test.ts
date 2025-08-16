import { PMCManager } from '../src/pmc-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PMCManager', () => {
  let tempDir: string;
  let promptsPath: string;
  let pmc: PMCManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmc-test-'));
    promptsPath = path.join(tempDir, 'test-prompts.md');
    pmc = new PMCManager(promptsPath);

    // Set environment to avoid creating files in user's home directory
    process.env.HOME = tempDir;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    delete process.env.HOME;
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      await expect(pmc.initialize()).resolves.not.toThrow();
    });

    it('should create prompts file if it does not exist', async () => {
      await pmc.initialize();
      const exists = await fs.access(promptsPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('prompt operations', () => {
    beforeEach(async () => {
      const sampleMarkdown = `# Test Prompt

This is a test prompt for unit testing.

<!--
[meta]
tags = ["test", "unit"]
description = "A test prompt"
-->

# Another Prompt

Another test prompt.

<!--
[meta]
category = "test"
-->
`;
      await fs.writeFile(promptsPath, sampleMarkdown, 'utf-8');
      await pmc.initialize();
    });

    it('should list prompts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pmc.listPrompts({ onlyTitles: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 prompt(s)'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Prompt'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Another Prompt'));
      
      consoleSpy.mockRestore();
    });

    it('should show specific prompt', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pmc.showPrompt({ title: 'Test Prompt' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📄 Test Prompt'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('This is a test prompt for unit testing.'));
      
      consoleSpy.mockRestore();
    });

    it('should handle non-existent prompt', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pmc.showPrompt({ title: 'Non-existent Prompt' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ No prompt found'));
      
      consoleSpy.mockRestore();
    });

    it('should search prompts by text', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pmc.searchPrompts({ text: 'unit testing' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 prompt(s)'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Prompt'));
      
      consoleSpy.mockRestore();
    });

    it('should search prompts by metadata', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pmc.searchPrompts({ meta: 'tags=test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 prompt(s)'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Prompt'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('createPrompt', () => {
    it('should display creation instructions', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await pmc.createPrompt();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📝 Creating a new prompt'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('# Your Prompt Title'));
      
      consoleSpy.mockRestore();
    });
  });
});