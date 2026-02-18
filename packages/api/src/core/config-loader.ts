import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * OWCS configuration structure
 */
export interface OWCSConfig {
  /**
   * Custom extensions to add to the OWCS specification.
   * All keys must start with 'x-' to follow the extension pattern.
   */
  extensions?: Record<string, string | number | boolean>;
}

/**
 * Supported config file names in order of precedence
 */
const CONFIG_FILE_NAMES = ['owcs.config.js', 'owcs.config.mjs', 'owcs.config.cjs', 'owcs.config.json'];

/**
 * Validates that all extension keys start with 'x-'
 * @param extensions - The extensions object to validate
 * @throws Error if any key doesn't start with 'x-'
 */
function validateExtensions(extensions: Record<string, unknown>): void {
  const invalidKeys = Object.keys(extensions).filter((key) => !key.startsWith('x-'));

  if (invalidKeys.length > 0) {
    throw new Error(`Invalid extension keys: ${invalidKeys.join(', ')}. All extension keys must start with 'x-'`);
  }
}

/**
 * Loads and validates an OWCS config file from the given project path
 * @param projectPath - The root directory to search for config file
 * @returns The loaded config object, or null if no config file found
 * @throws Error if config file is invalid or extensions don't follow the 'x-' pattern
 */
export async function loadConfig(projectPath: string): Promise<OWCSConfig | null> {
  // Try each config file name
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = path.resolve(projectPath, fileName);

    if (!fs.existsSync(configPath)) {
      continue;
    }

    try {
      let config: unknown;

      if (fileName.endsWith('.json')) {
        // Load JSON config
        const content = fs.readFileSync(configPath, 'utf-8');
        config = JSON.parse(content);
      } else {
        // Load JS/MJS/CJS config using dynamic import
        const fileUrl = pathToFileURL(configPath).href;
        const module = await import(fileUrl);
        config = module.default || module;
      }

      // Validate config structure
      if (!config || typeof config !== 'object') {
        throw new Error(`Config file must export an object`);
      }

      const owcsConfig = config as OWCSConfig;

      // Validate extensions if present
      if (owcsConfig.extensions) {
        if (typeof owcsConfig.extensions !== 'object') {
          throw new Error(`'extensions' must be an object`);
        }
        validateExtensions(owcsConfig.extensions);
      }

      return owcsConfig;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
      }
      throw error;
    }
  }

  // No config file found
  return null;
}
