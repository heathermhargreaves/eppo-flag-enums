/**
 * Example Eppo flag enums
 * This is a sample file showing the structure for different flag types
 */

export const EppoFlags = {
  ADD_PROFILE_PICTURE_NUDGE: { key: "add-profile-picture-nudge" as const, type: "STRING" as const, variations: ["control", "personalized"] as const },
  SHOW_WELCOME_BANNER: { key: "show-welcome-banner" as const, type: "BOOLEAN" as const, variations: [true, false] as const },
  MAX_UPLOAD_SIZE: { key: "max-upload-size" as const, type: "NUMBER" as const, variations: [10, 25] as const },
  HOMEPAGE_CONFIG: { key: "homepage-config" as const, type: "JSON" as const, variations: [{"title":"Welcome!","theme":"light","showBanner":true}, {"title":"Welcome back!","theme":"dark","showBanner":false}] as const },
  FEATURE_ENABLED: { key: "feature-enabled" as const, type: "BOOLEAN" as const, variations: [true, false] as const }
} as const;

// Type for all flag keys
export type EppoFlagKey = keyof typeof EppoFlags;

// Type for all flag values  
export type EppoFlagValue = typeof EppoFlags[EppoFlagKey]; 

