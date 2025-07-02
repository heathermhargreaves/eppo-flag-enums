#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Type declarations for Node.js modules
declare const require: any;
declare const process: any;
declare const module: any;

// Load .env file if it exists (without requiring dotenv package)
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.trim().split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        process.env[key] = value;
      }
    });
  }
} catch (error) {
  // Silently fail if .env can't be loaded
}

// Type definitions for Eppo API responses
interface EppoVariation {
  id: number;
  name: string;
  variant_key: string;
  value?: any;
}

interface EppoFlag {
  key: string;
  variation_type: 'STRING' | 'BOOLEAN' | 'NUMBER' | 'NUMERIC' | 'JSON' | 'UNKNOWN';
  variations: EppoVariation[];
}

type EppoApiResponse = EppoFlag[];

// Type definitions for config file format
interface ConfigVariation {
  key: string;
  value: any;
}

interface ConfigFlag {
  variationType: string;
  variations: Record<string, ConfigVariation>;
}

interface ConfigFile {
  flags: Record<string, ConfigFlag>;
}

// Type for processed flag data
interface ProcessedFlag {
  key: string;
  enumKey: string;
  type: string;
  variations: Array<{
    key: string;
    value: any;
  }>;
}

// CLI arguments interface
interface ParsedArgs {
  file: string | null;
  api: boolean;
  apiKey: string | undefined;
  output: string;
}

/**
 * Converts flag names to valid SCREAMING_SNAKE_CASE enum keys
 */
function toEnumKey(flagName: string): string {
  return flagName
    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace any non-alphanumeric/underscore with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toUpperCase();
}

/**
 * Converts variation values to proper TypeScript types based on variation_type
 */
function convertVariationValue(value: any, variationType: string): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  switch (variationType) {
    case 'BOOLEAN':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
      
    case 'NUMBER':
    case 'NUMERIC':
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      return value;
      
    case 'JSON':
      if (typeof value === 'object') return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          // If parsing fails, return as string
          return value;
        }
      }
      return value;
      
    case 'STRING':
    default:
      return String(value);
  }
}

/**
 * Formats a value for TypeScript code generation
 */
function formatValueForTypeScript(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'object') {
    // For objects, output as actual TypeScript object literal (no quotes)
    // This allows proper type inference and IntelliSense
    return JSON.stringify(value, null, 0);
  }
  
  // String - escape quotes and backslashes, handle newlines
  const escaped = String(value)
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
  
  return `"${escaped}"`;
}

/**
 * Fetches Eppo configuration from API
 */
async function fetchEppoConfig(apiKey: string): Promise<EppoApiResponse> {
  return new Promise((resolve, reject) => {
    const options: any = {
      hostname: 'eppo.cloud',
      path: `/api/v1/feature-flags`,
      method: 'GET',
      headers: {
        'X-Eppo-Token': `${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'eppo-enum-generator/1.0'
      }
    };

    console.log(`🔄 Fetching config from Eppo API...`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const config: EppoApiResponse = JSON.parse(data);
            console.log(`✅ Successfully fetched config from API`);
            resolve(config);
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`API request failed: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Generates TypeScript enums from Eppo config data
 */
function generateEnumsFromConfig(config: EppoApiResponse | ConfigFile, sourceName: string, outputPath: string = 'eppo-flags.ts'): void {
  try {
    // Handle both API response (array) and file config (object with flags property)
    let flagsData: EppoFlag[];
    if (Array.isArray(config)) {
      // API response format
      flagsData = config;
    } else if (config.flags) {
      // File config format - convert to array
      flagsData = Object.entries(config.flags).map(([flagKey, flagData]): EppoFlag => ({
        key: flagKey,
        variation_type: (flagData.variationType as any) || 'UNKNOWN',
                 variations: Object.values(flagData.variations).map((v: ConfigVariation, index) => ({
           id: index,
           name: v.key,
           variant_key: v.key,
           value: v.value
         }))
      }));
    } else {
      throw new Error('No flags found in config');
    }
    
    if (flagsData.length === 0) {
      throw new Error('No flags found in config');
    }
    
    // Extract flags and their types, handling duplicate enum keys
    const usedEnumKeys = new Set<string>();
    const flags: ProcessedFlag[] = flagsData.map((flagData) => {
      let enumKey = toEnumKey(flagData.key);
      let counter = 1;
      
      // Handle duplicate enum keys by adding a suffix
      while (usedEnumKeys.has(enumKey)) {
        enumKey = `${toEnumKey(flagData.key)}_${counter}`;
        counter++;
      }
      usedEnumKeys.add(enumKey);
      
      // Extract variations with proper typing based on variation_type
      let variations: Array<{ key: string; value: any }> = [];
      if (flagData.variations) {
        if (Array.isArray(flagData.variations)) {
          // API format: array of objects with variant_key and value
          variations = flagData.variations.map(v => {
            // For API format, the value IS the variant_key
            return {
              key: v.variant_key,
              value: v.variant_key
            };
          }).filter(v => v.key);
        } else {
          // File format: object with variation objects that have key and value properties
          variations = Object.values(flagData.variations).map(v => ({
            key: v.variant_key,
            value: v.value
          })).filter(v => v.key);
        }
      }
      
      // Convert variations to proper types
      const typedVariations = variations.map(v => ({
        key: v.key,
        value: convertVariationValue(v.value, flagData.variation_type || 'STRING')
      }));
      
      return {
        key: flagData.key,
        enumKey: enumKey,
        type: flagData.variation_type || 'UNKNOWN',
        variations: typedVariations
      };
    });
    
    // Create the main enum entries with key, type, and variations
    const enumEntries = flags.map(flag => {
      const variationsArray = flag.variations.length > 0 
        ? `[${flag.variations.map(v => {
            // For JSON types, output object literals without quotes for proper TypeScript typing
            if (flag.type === 'JSON') {
              // If it's already an object, stringify it directly
              if (typeof v.value === 'object') {
                return JSON.stringify(v.value, null, 0);
              }
              // If it's a string that looks like JSON, parse and stringify it
              if (typeof v.value === 'string') {
                try {
                  const parsed = JSON.parse(v.value);
                  return JSON.stringify(parsed, null, 0);
                } catch (e) {
                  // If parsing fails, treat as regular string
                  return formatValueForTypeScript(v.value);
                }
              }
            }
            return formatValueForTypeScript(v.value);
          }).join(', ')}]`
        : '[]';
      
      return `  ${flag.enumKey}: { key: "${flag.key}" as const, type: "${flag.type}" as const, variations: ${variationsArray} as const }`;
    }).join(',\n');
    
    const enumCode = `/**
 * Generated Eppo flag enums
 * Generated on: ${new Date().toISOString()}
 * Source: ${sourceName}
 */

export const EppoFlags = {
${enumEntries}
} as const;

// Type for all flag keys
export type EppoFlagKey = keyof typeof EppoFlags;

// Type for all flag values  
export type EppoFlagValue = typeof EppoFlags[EppoFlagKey];
`;
    
    // Write the output file
    fs.writeFileSync(outputPath, enumCode);
    
    console.log(`✅ Generated enums for ${flags.length} flags`);
    console.log(`📄 Output written to: ${outputPath}`);
    console.log('\nGenerated flags:');
    flags.forEach(flag => {
      const variationsText = flag.variations.length > 0 
        ? ` [${flag.variations.map(v => v.key).join(', ')}]`
        : ' [no variations]';
      console.log(`  - ${flag.enumKey}: "${flag.key}" (${flag.type})${variationsText}`);
    });
    
  } catch (error) {
    console.error('❌ Error generating enums:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Generates TypeScript enums from Eppo config file
 */
function generateEppoEnums(configPath: string, outputPath: string = 'eppo-flags.ts'): void {
  try {
    // Read and parse the config file
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config: ConfigFile = JSON.parse(configContent);
    
    generateEnumsFromConfig(config, path.basename(configPath), outputPath);
    
  } catch (error) {
    console.error('❌ Error generating enums:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

/**
 * Generates TypeScript enums from Eppo API
 */
async function generateEppoEnumsFromAPI(apiKey: string, outputPath: string = 'eppo-flags.ts'): Promise<void> {
  try {
    const config = await fetchEppoConfig(apiKey);
    generateEnumsFromConfig(config, `Eppo API`, outputPath);
  } catch (error) {
    console.error('❌ Error fetching from API:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const parsedArgs: ParsedArgs = {
    file: null,
    api: false,
    apiKey: process.env.EPPO_API_KEY,
    output: 'eppo-flags.ts'
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--api':
        parsedArgs.api = true;
        break;
      case '--api-key':
        parsedArgs.apiKey = args[++i];
        break;
      case '--output':
      case '-o':
        parsedArgs.output = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Eppo Flag TypeScript Enum Generator

Usage: 
  npx tsx generate-eppo-enums.ts <config-file>           # Generate from file
  npx tsx generate-eppo-enums.ts --api                   # Generate from API

Options:
  --api                    Fetch config from Eppo API instead of file
  --api-key <key>          API key (or set EPPO_API_KEY env var)
  --output, -o <path>      Output file path (default: eppo-flags.ts)
  --help, -h               Show this help

Examples:
  # From file
  npx tsx generate-eppo-enums.ts ./eppo-config.json
  npx tsx generate-eppo-enums.ts ./config.json --output ./src/flags.ts
  
  # From API
  export EPPO_API_KEY="your-api-key"
  npx tsx generate-eppo-enums.ts --api
  npx tsx generate-eppo-enums.ts --api --api-key your-key

Environment Variables:
  EPPO_API_KEY             Your Eppo API key
`);
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('--') && !parsedArgs.file) {
          parsedArgs.file = arg;
        }
        break;
    }
  }
  
  // Validate arguments
  if (parsedArgs.api) {
    if (!parsedArgs.apiKey) {
      console.error('❌ API key required. Set EPPO_API_KEY environment variable or use --api-key option');
      process.exit(1);
    }
    generateEppoEnumsFromAPI(parsedArgs.apiKey, parsedArgs.output);
  } else if (parsedArgs.file) {
    if (!fs.existsSync(parsedArgs.file)) {
      console.error(`❌ Config file not found: ${parsedArgs.file}`);
      process.exit(1);
    }
    generateEppoEnums(parsedArgs.file, parsedArgs.output);
  } else {
    console.error('❌ Either provide a config file or use --api flag');
    console.log('Run with --help for usage information');
    process.exit(1);
  }
}

export { generateEppoEnums, generateEppoEnumsFromAPI }; 