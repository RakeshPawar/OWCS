import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, OWCSConfig } from './config-loader.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('config-loader', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owcs-config-test-'));
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return null when no config file exists', async () => {
      const config = await loadConfig(tempDir);
      expect(config).toBeNull();
    });

    it('should load a valid JSON config file', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData: OWCSConfig = {
        extensions: {
          'x-owner': 'platform-team',
          'x-version': '1.0.0',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const config = await loadConfig(tempDir);
      expect(config).toEqual(configData);
    });

    it('should load a valid JS config file (ESM)', async () => {
      const configPath = path.join(tempDir, 'owcs.config.js');
      const configContent = `
export default {
  extensions: {
    'x-owner': 'frontend-team',
    'x-repo': 'https://github.com/org/repo'
  }
};
`;

      fs.writeFileSync(configPath, configContent);

      const config = await loadConfig(tempDir);
      expect(config).toEqual({
        extensions: {
          'x-owner': 'frontend-team',
          'x-repo': 'https://github.com/org/repo',
        },
      });
    });

    it('should load extensions with different value types', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData: OWCSConfig = {
        extensions: {
          'x-owner': 'team-name',
          'x-version-number': 123,
          'x-enabled': true,
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const config = await loadConfig(tempDir);
      expect(config).toEqual(configData);
      expect(typeof config?.extensions?.['x-version-number']).toBe('number');
      expect(typeof config?.extensions?.['x-enabled']).toBe('boolean');
    });

    it('should throw error when extension keys do not start with x-', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        extensions: {
          'x-owner': 'team',
          owner: 'invalid', // Invalid: doesn't start with x-
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      await expect(loadConfig(tempDir)).rejects.toThrow(/Invalid extension keys: owner/);
    });

    it('should throw error when multiple extension keys are invalid', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        extensions: {
          'x-valid': 'ok',
          invalid1: 'bad',
          invalid2: 'bad',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      await expect(loadConfig(tempDir)).rejects.toThrow(/Invalid extension keys/);
      await expect(loadConfig(tempDir)).rejects.toThrow(/invalid1/);
      await expect(loadConfig(tempDir)).rejects.toThrow(/invalid2/);
    });

    it('should throw error when config is not an object', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      fs.writeFileSync(configPath, JSON.stringify('not an object'));

      await expect(loadConfig(tempDir)).rejects.toThrow(/Config file must export an object/);
    });

    it('should throw error when extensions is not an object', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        extensions: 'not an object',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'extensions' must be an object/);
    });

    it('should throw error when JSON is malformed', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      fs.writeFileSync(configPath, '{invalid json}');

      await expect(loadConfig(tempDir)).rejects.toThrow(/Failed to load config/);
    });

    it('should return empty config object when extensions are not provided', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {};

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const config = await loadConfig(tempDir);
      expect(config).toEqual({});
    });

    it('should prioritize owcs.config.js over owcs.config.json', async () => {
      const jsonConfigPath = path.join(tempDir, 'owcs.config.json');
      const jsConfigPath = path.join(tempDir, 'owcs.config.js');

      fs.writeFileSync(jsonConfigPath, JSON.stringify({ extensions: { 'x-source': 'json' } }));
      fs.writeFileSync(jsConfigPath, `export default { extensions: { 'x-source': 'js' } };`);

      const config = await loadConfig(tempDir);
      expect(config?.extensions?.['x-source']).toBe('js');
    });

    it('should load config with all CLI options', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData: OWCSConfig = {
        title: 'My Components',
        description: 'A collection of web components',
        version: '2.0.0',
        includeRuntimeExtension: true,
        format: 'json',
        adapter: 'react',
        outputPath: './dist/spec.json',
        projectRoot: './src',
        extensions: {
          'x-owner': 'platform-team',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const config = await loadConfig(tempDir);
      expect(config).toEqual(configData);
      expect(config?.title).toBe('My Components');
      expect(config?.version).toBe('2.0.0');
      expect(config?.format).toBe('json');
      expect(config?.adapter).toBe('react');
      expect(config?.includeRuntimeExtension).toBe(true);
      expect(config?.outputPath).toBe('./dist/spec.json');
      expect(config?.projectRoot).toBe('./src');
    });

    it('should validate format field - reject invalid format', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        format: 'xml',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'format' must be either 'yaml' or 'json'/);
    });

    it('should validate adapter field - reject invalid adapter', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        adapter: 'vue',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'adapter' must be either 'angular' or 'react'/);
    });

    it('should validate title field - reject non-string', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        title: 123,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'title' must be a string/);
    });

    it('should validate description field - reject non-string', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        description: true,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'description' must be a string/);
    });

    it('should validate version field - reject non-string', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        version: 2.0,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'version' must be a string/);
    });

    it('should validate includeRuntimeExtension field - reject non-boolean', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        includeRuntimeExtension: 'yes',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'includeRuntimeExtension' must be a boolean/);
    });

    it('should validate outputPath field - reject non-string', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        outputPath: 123,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'outputPath' must be a string/);
    });

    it('should validate projectRoot field - reject non-string', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData = {
        projectRoot: ['./src'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(loadConfig(tempDir)).rejects.toThrow(/'projectRoot' must be a string/);
    });

    it('should load config with partial options', async () => {
      const configPath = path.join(tempDir, 'owcs.config.json');
      const configData: OWCSConfig = {
        title: 'Partial Config',
        format: 'yaml',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const config = await loadConfig(tempDir);
      expect(config?.title).toBe('Partial Config');
      expect(config?.format).toBe('yaml');
      expect(config?.version).toBeUndefined();
      expect(config?.adapter).toBeUndefined();
    });
  });
});
