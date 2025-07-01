#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Converts flag names to valid SCREAMING_SNAKE_CASE enum keys
 */
function toEnumKey(flagName) {
  return flagName
    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace any non-alphanumeric/underscore with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toUpperCase();
}

/**
 * Fetches Eppo configuration from API
 */
async function fetchEppoConfig(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
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
            const config = JSON.parse(data);
            console.log(`✅ Successfully fetched config from API`);
            resolve(config);
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
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
function generateEnumsFromConfig(config, sourceName, outputPath = 'eppo-flags.ts') {
  try {
    // Handle both API response (array) and file config (object with flags property)
    let flagsData;
    if (Array.isArray(config)) {
      // API response format
      flagsData = config;
    } else if (config.flags) {
      // File config format - convert to array
      flagsData = Object.entries(config.flags).map(([flagKey, flagData]) => ({
        key: flagKey,
        variation_type: flagData.variationType || 'UNKNOWN'
      }));
    } else {
      throw new Error('No flags found in config');
    }
    
    if (flagsData.length === 0) {
      throw new Error('No flags found in config');
    }
    
    // Extract flags and their types, handling duplicate enum keys
    const usedEnumKeys = new Set();
    const flags = flagsData.map((flagData) => {
      let enumKey = toEnumKey(flagData.key);
      let counter = 1;
      
      // Handle duplicate enum keys by adding a suffix
      while (usedEnumKeys.has(enumKey)) {
        enumKey = `${toEnumKey(flagData.key)}_${counter}`;
        counter++;
      }
      usedEnumKeys.add(enumKey);
      
      return {
        key: flagData.key,
        enumKey: enumKey,
        type: flagData.variation_type || 'UNKNOWN'
      };
    });
    
    // Create the main enum entries with key and type
    const enumEntries = flags.map(flag => 
      `  ${flag.enumKey}: { key: "${flag.key}" as const, type: "${flag.type}" as const }`
    ).join(',\n');
    
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
      console.log(`  - ${flag.enumKey}: "${flag.key}" (${flag.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error generating enums:', error.message);
    process.exit(1);
  }
}

/**
 * Generates TypeScript enums from Eppo config file
 */
function generateEppoEnums(configPath, outputPath = 'eppo-flags.ts') {
  try {
    // Read and parse the config file
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    generateEnumsFromConfig(config, path.basename(configPath), outputPath);
    
  } catch (error) {
    console.error('❌ Error generating enums:', error.message);
    process.exit(1);
  }
}

/**
 * Generates TypeScript enums from Eppo API
 */
async function generateEppoEnumsFromAPI(apiKey, outputPath = 'eppo-flags.ts') {
  try {
    const config = await fetchEppoConfig(apiKey);
    generateEnumsFromConfig(config, `Eppo API`, outputPath);
  } catch (error) {
    console.error('❌ Error fetching from API:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const parsedArgs = {
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
  node generate-eppo-enums.js <config-file>           # Generate from file
  node generate-eppo-enums.js --api                   # Generate from API

Options:
  --api                    Fetch config from Eppo API instead of file
  --api-key <key>          API key (or set EPPO_API_KEY env var)
  --output, -o <path>      Output file path (default: eppo-flags.ts)
  --help, -h               Show this help

Examples:
  # From file
  node generate-eppo-enums.js ./eppo-config.json
  node generate-eppo-enums.js ./config.json --output ./src/flags.ts
  
  # From API
  export EPPO_API_KEY="your-api-key"
  node generate-eppo-enums.js --api
  node generate-eppo-enums.js --api --api-key your-key

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

module.exports = { generateEppoEnums, generateEppoEnumsFromAPI }; 

