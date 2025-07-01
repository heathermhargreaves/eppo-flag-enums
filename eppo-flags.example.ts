/**
 * Generated Eppo flag enums
 * Generated on: 2025-07-01T23:02:03.213Z
 * Source: sample-eppo-config.json
 */

export const EppoFlags = {
  WELCOME_MESSAGE: { key: "welcome-message" as const, type: "STRING" as const },
  DARK_MODE: { key: "dark-mode" as const, type: "BOOLEAN" as const },
  API_CONFIG: { key: "api-config" as const, type: "JSON" as const },
  MAX_UPLOAD_SIZE: { key: "max-upload-size" as const, type: "NUMBER" as const }
} as const;

// Type for all flag keys
export type EppoFlagKey = keyof typeof EppoFlags;

// Type for all flag values  
export type EppoFlagValue = typeof EppoFlags[EppoFlagKey];
