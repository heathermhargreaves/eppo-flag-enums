# Eppo Flag Enum Generator

A Node.js tool that generates TypeScript enums from Eppo feature flags, providing type-safe access to your feature flags with full IDE autocomplete support.

## 🚀 Features

- **TypeScript Support**: Generate strongly-typed enums with proper type inference
- **API Integration**: Fetch flags directly from your Eppo account
- **IDE Autocomplete**: Full IntelliSense for flag names and types
- **Type Safety**: Avoid runtime errors with compile-time type checking
- **Auto-Generated**: Keep enums synchronized with your live Eppo configuration

## 📦 Quick Start

1. **Set up your API key**:
   ```bash
   cp env.example .env
   # Edit .env and add your Eppo API key
   ```

2. **Generate TypeScript enums**:
   ```bash
   node generate-eppo-enums.js --api
   ```

3. **Use in your code**:
   ```typescript
   import { EppoFlags } from './eppo-flags';

   // Type-safe with autocomplete
   const config = eppoClient.getJSONValue(EppoFlags.API_CONFIG.key, {});
   const message = eppoClient.getStringValue(EppoFlags.WELCOME_MESSAGE.key, "Hello");
   ```

## 🛠️ Usage

### From Eppo API (Recommended)

```bash
# Set your API key in .env file, then:
node generate-eppo-enums.js --api

# Or pass API key directly:
node generate-eppo-enums.js --api --api-key "your-key"

# Custom output file:
node generate-eppo-enums.js --api --output src/flags.ts
```

### From Config File

```bash
node generate-eppo-enums.js my-config.json
node generate-eppo-enums.js sample-eppo-config.json --output src/flags.ts
```

## 📋 Generated Output

The tool generates a TypeScript file with this structure:

```typescript
export const EppoFlags = {
  WELCOME_MESSAGE: { key: "welcome-message" as const, type: "STRING" as const },
  DARK_MODE: { key: "dark-mode" as const, type: "BOOLEAN" as const },
  API_CONFIG: { key: "api-config" as const, type: "JSON" as const },
  MAX_UPLOAD_SIZE: { key: "max-upload-size" as const, type: "NUMBER" as const }
} as const;

export type EppoFlagKey = keyof typeof EppoFlags;
export type EppoFlagValue = typeof EppoFlags[EppoFlagKey];
```

### Type Safety Benefits

```typescript
// ✅ Type-safe with autocomplete
EppoFlags.WELCOME_MESSAGE.key    // "welcome-message"
EppoFlags.WELCOME_MESSAGE.type   // "STRING"

// ✅ IDE shows all available flags
EppoFlags.  // <- autocomplete shows all flags

// ✅ Compile-time error prevention
EppoFlags.TYPO_FLAG  // TypeScript error: Property 'TYPO_FLAG' does not exist
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:
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

### Supported Flag Types

- `STRING` - Text values
- `BOOLEAN` - True/false values
- `JSON` - Object/array values  
- `NUMBER`/`NUMERIC` - Numeric values

## 🔄 Integration

### CI/CD Pipeline

```bash
# In your build script
export EPPO_API_KEY=$EPPO_API_KEY
node generate-eppo-enums.js --api
```

### Keep Flags Updated

```bash
# Regenerate from latest Eppo config
node generate-eppo-enums.js --api
git add eppo-flags.ts
git commit -m "Update feature flags"
```

## 📁 Project Structure

```
eppo-extension/
├── generate-eppo-enums.js      # Main generator script
├── eppo-flags.ts               # Generated TypeScript enums
├── sample-eppo-config.json     # Example configuration
├── env.example                 # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔒 Security

- **API keys**: Store in `.env` file (excluded from git)
- **Generated files**: Safe to commit `eppo-flags.ts`
- **Config files**: Never commit actual Eppo configs (may contain sensitive data)

## 📄 License

MIT License 