/**
 * API endpoint constants for the Deepself API
 */

export const API_ENDPOINTS = {
  // Models
  MODELS_LIST: '/v1/models',
  MODELS_GET: (modelId: string) => `/v1/models/${modelId}`,
  MODELS_CREATE: '/v1/models',
  MODELS_UPDATE: (modelId: string) => `/v1/models/${modelId}`,
  MODELS_DELETE: (modelId: string) => `/v1/models/${modelId}`,

  // Training - Documents
  TRAINING_DOCUMENT: (modelId: string) => `/v1/models/${modelId}/training/documents`,

  // Training - Rooms
  TRAINING_ROOMS_CREATE: (modelId: string) => `/v1/models/${modelId}/training/rooms`,
  TRAINING_ROOMS_FINALIZE: (roomId: string) => `/v1/training/rooms/${roomId}/finalize`,

  // Chat
  CHAT_COMPLETIONS: '/v1/chat/completions',

  // API Keys (JWT required)
  API_KEYS_LIST: '/v1/auth/api-keys',
  API_KEYS_CREATE: '/v1/auth/api-keys',
  API_KEYS_REVOKE: (keyId: string) => `/v1/auth/api-keys/${keyId}`,
} as const;

export const DEFAULT_API_BASE_URL = 'https://api.deepself.me';
