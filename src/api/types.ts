/**
 * TypeScript type definitions for Deepself API
 */

// ============================================================================
// Models
// ============================================================================

export interface FactValue {
  value: string;
  status: string;
  identification: string;
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  name: string | null;
  basic_facts: Record<string, FactValue> | null;
  default_tools: string[];
}

export interface ModelsListResponse {
  object: 'list';
  data: Model[];
}

export interface CreateModelRequest {
  username: string;
  name?: string;
  tools?: string[];
}

export interface UpdateModelRequest {
  name?: string;
  facts?: Record<string, string>;
  tools?: string[];
}

// ============================================================================
// Training - Documents
// ============================================================================

export interface TrainDocumentRequest {
  content: string;
  label: string;
  perspective: 'first-person' | 'third-person';
}

export interface ExtractionStats {
  epsilons_processed: number;
  betas_processed: number;
  deltas_processed: number;
  alphas_processed: number;
}

export interface TrainDocumentResponse {
  document_id: string;
  status: string;
  stats: ExtractionStats;
}

// ============================================================================
// Training - Rooms
// ============================================================================

export interface CreateRoomRequest {
  label: string;
  user_model: string;
}

export interface CreateRoomResponse {
  room_id: string;
  status: string;
}

export interface FinalizeRoomResponse {
  success: boolean;
  stats: ExtractionStats;
}

// ============================================================================
// Chat
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  room_id?: string;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// API Keys
// ============================================================================

export interface ApiKey {
  key_id: string;
  name: string;
  key_prefix: string;
  created_at: number;
  last_used_at?: number;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  key_id: string;
  name: string;
  api_key: string;
}

// ============================================================================
// Generic API Response Wrappers
// ============================================================================

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
