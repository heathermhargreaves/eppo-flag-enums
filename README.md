# Eppo Flag TypeScript Enum Generator

A TypeScript-first tool that generates strongly-typed enums from Eppo feature flags, providing type-safe access to your feature flags with full IDE autocomplete support and proper variation typing.

## 🚀 Features

- **Full TypeScript Support**: Written in TypeScript, generates TypeScript enums with proper type inference
- **API Integration**: Fetch flags directly from your Eppo account with automatic .env loading
- **Variation Typing**: Proper TypeScript types for all variation values (strings, booleans, numbers, JSON objects)
- **IDE Autocomplete**: Full IntelliSense for flag names, types, and variations
- **Type Safety**: Avoid runtime errors with compile-time type checking
- **Auto-Generated**: Keep enums synchronized with your live Eppo configuration
- **No Dependencies**: Built-in .env file loading without requiring external packages

## 📦 Installation & Quick Start

1. **Install TypeScript dependencies**:
   ```bash
   npm install
   ```

2. **Set up your API key**:
   ```bash
   cp env.example .env
   # Edit .env and add your Eppo API key
   ```

3. **Generate TypeScript enums**:
   ```bash
   npm run fetch
   # or
   npx tsx generate-eppo-enums.ts --api
   ```

4. **Use in your code**:
   ```typescript
   import { EppoFlags } from './eppo-flags';

   // Type-safe with autocomplete and proper variation types
   const config = eppoClient.getJSONAssignment(EppoFlags.API_CONFIG.key, subjectKey, subjectAttributes, defaultValue);
   const message = eppoClient.getStringAssignment(EppoFlags.WELCOME_MESSAGE.key, subjectKey, subjectAttributes, defaultValue);
   
   // Access typed variations
   const controlVariation = EppoFlags.HOMEPAGE_CONFIG.variations[0]; // Fully typed JSON object
   ```

## 🛠️ Usage

### NPM Scripts (Recommended)

```bash
npm run fetch      # Generate from Eppo API
npm run test       # Generate from sample config
npm run help       # Show help
npm run generate   # Generic generate command
```

### Direct Commands

#### From Eppo API (Recommended)

```bash
# Uses .env file automatically:
npx tsx generate-eppo-enums.ts --api

# Or pass API key directly:
npx tsx generate-eppo-enums.ts --api --api-key "your-key"

# Custom output file:
npx tsx generate-eppo-enums.ts --api --output src/flags.ts
```

#### From Config File

```bash
npx tsx generate-eppo-enums.ts sample-eppo-config.json
npx tsx generate-eppo-enums.ts my-config.json --output src/flags.ts
```

## 📋 Generated Output

The tool generates a TypeScript file with properly typed variations:

```typescript
export const EppoFlags = {
  WELCOME_MESSAGE: { 
    key: "welcome-message" as const, 
    type: "STRING" as const, 
    variations: ["default", "personalized"] as const 
  },
  DARK_MODE: { 
    key: "dark-mode" as const, 
    type: "BOOLEAN" as const, 
    variations: [true, false] as const 
  },
  API_CONFIG: { 
    key: "api-config" as const, 
    type: "JSON" as const, 
    variations: [
      {"endpoint": "v1", "timeout": 5000}, 
      {"endpoint": "v2", "timeout": 3000}
    ] as const 
  },
  MAX_UPLOAD_SIZE: { 
    key: "max-upload-size" as const, 
    type: "NUMBER" as const, 
    variations: [10, 25] as const 
  }
} as const;

export type EppoFlagKey = keyof typeof EppoFlags;
export type EppoFlagValue = typeof EppoFlags[EppoFlagKey];
```

### Type Safety Benefits

```typescript
// ✅ Type-safe with autocomplete
EppoFlags.WELCOME_MESSAGE.key           // "welcome-message"
EppoFlags.WELCOME_MESSAGE.type          // "STRING"
EppoFlags.WELCOME_MESSAGE.variations    // ["default", "personalized"]

// ✅ Properly typed variations
EppoFlags.API_CONFIG.variations[0]      // { endpoint: "v1", timeout: 5000 }
EppoFlags.DARK_MODE.variations[0]       // true (boolean, not string)
EppoFlags.MAX_UPLOAD_SIZE.variations[1] // 25 (number, not string)

// ✅ IDE shows all available flags
EppoFlags.  // <- autocomplete shows all flags

// ✅ Compile-time error prevention
EppoFlags.TYPO_FLAG  // TypeScript error: Property 'TYPO_FLAG' does not exist
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file (automatically loaded):
```bash
EPPO_API_KEY=your-eppo-api-key-here
```

### Command Line Options

```bash
--api                    # Fetch from Eppo API
--api-key <key>         # API key (or use .env)
--output, -o <path>     # Output file (default: eppo-flags.ts)
--help, -h              # Show help
```

### Supported Flag Types with Proper Typing

- `STRING` - Text values → `string` variations
- `BOOLEAN` - True/false values → `boolean` variations  
- `JSON` - Object/array values → Proper object type variations
- `NUMBER`/`NUMERIC` - Numeric values → `number` variations

## 🔄 Integration

### CI/CD Pipeline

```bash
# In your build script
npm install
export EPPO_API_KEY=$EPPO_API_KEY
npm run fetch
```

### Keep Flags Updated

```bash
# Regenerate from latest Eppo config
npm run fetch
git add eppo-flags.ts
git commit -m "Update feature flags"
```

### Development Workflow

```bash
# Test with sample config
npm run test

# Generate from API
npm run fetch

# Build TypeScript (optional)
npm run build
```

## 📁 Project Structure

```
eppo-extension/
├── generate-eppo-enums.ts      # Main TypeScript generator script
├── eppo-flags.ts               # Generated TypeScript enums
├── eppo-flags.example.ts       # Example enum structure
├── sample-eppo-config.json     # Sample configuration file
├── env.example                 # Environment template
├── package.json               # Dependencies & scripts
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

## 🔧 Development

### Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

### TypeScript Features

- **Strict typing** for all API responses and configuration files
- **Interface definitions** for Eppo API structure
- **Type-safe CLI** argument parsing
- **Proper error handling** with typed error messages

## 🔒 Security

- **API keys**: Store in `.env` file (automatically excluded from git)
- **Generated files**: Safe to commit `eppo-flags.ts` 
- **Config files**: Sample files included, real configs excluded via `.gitignore`
- **Type safety**: Prevents runtime errors through compile-time checks

## 📄 License

MIT License 