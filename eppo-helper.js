import { EppoFlags } from './eppo-flags.js';

/**
 * Helper function that automatically calls the correct Eppo method based on flag type
 */
export function getEppoValue(flagEnum, defaultValue, eppoClient) {
  const { key, type } = flagEnum;
  
  switch (type) {
    case 'STRING':
      return eppoClient.getStringValue(key, defaultValue);
    case 'BOOLEAN':
      return eppoClient.getBooleanValue(key, defaultValue);
    case 'JSON':
      return eppoClient.getJSONValue(key, defaultValue);
    case 'NUMBER':
      return eppoClient.getNumericValue(key, defaultValue);
    default:
      throw new Error(`Unknown flag type: ${type} for flag: ${key}`);
  }
}

/**
 * Manual approach - check the type yourself
 */
export function getEppoValueManual(flagEnum, defaultValue, eppoClient) {
  // Check the type and call the appropriate method
  if (flagEnum.type === 'JSON') {
    return eppoClient.getJSONValue(flagEnum.key, defaultValue);
  } else if (flagEnum.type === 'STRING') {
    return eppoClient.getStringValue(flagEnum.key, defaultValue);
  } else if (flagEnum.type === 'BOOLEAN') {
    return eppoClient.getBooleanValue(flagEnum.key, defaultValue);
  } else if (flagEnum.type === 'NUMBER') {
    return eppoClient.getNumericValue(flagEnum.key, defaultValue);
  } else {
    throw new Error(`Unknown flag type: ${flagEnum.type}`);
  }
}

// Example usage:
/*
import { EppoFlags } from './eppo-flags.js';

// Option 1: Use helper function (automatic)
const config = getEppoValue(EppoFlags.API_CONFIG, {}, eppoClient);
const message = getEppoValue(EppoFlags.WELCOME_MESSAGE, "Hello", eppoClient);

// Option 2: Check type manually
if (EppoFlags.API_CONFIG.type === 'JSON') {
  const config = eppoClient.getJSONValue(EppoFlags.API_CONFIG.key, {});
}

// Option 3: Switch statement
switch (EppoFlags.API_CONFIG.type) {
  case 'JSON':
    const config = eppoClient.getJSONValue(EppoFlags.API_CONFIG.key, {});
    break;
  case 'STRING':
    const value = eppoClient.getStringValue(EppoFlags.API_CONFIG.key, "");
    break;
  // etc...
}
*/ 