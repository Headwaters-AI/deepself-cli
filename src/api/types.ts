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
  basic_facts?: Record<string, string>;
  default_tools?: string[];
}

export interface UpdateModelRequest {
  name?: string;
  basic_facts?: Record<string, string>;
  default_tools?: string[];
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
  status: string;
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
// Billing
// ============================================================================

export interface BalanceResponse {
  iam_id: string;
  balance_usd: number;
  frozen: boolean;
}

export interface UsageEntry {
  id: string;
  request_id: string;
  model_username: string;
  provider: string;
  llm_model: string;
  input_tokens: number;
  output_tokens: number;
  provider_cost_usd: number;
  markup_usd: number;
  total_deducted_usd: number;
  created_at: string;
}

export interface UsageHistoryResponse {
  entries: UsageEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface SubscriptionResponse {
  plan: string;
  status: string;
  iam_count: number;
  iam_limit: number;
  current_period_end: string | null;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface CancelSubscriptionResponse {
  canceled_at_period_end: boolean;
  current_period_end: string | null;
}

// ============================================================================
// Supported Models
// ============================================================================

export interface SupportedModel {
  model: string;
  provider: string;
}

export interface SupportedModelsResponse {
  models: SupportedModel[];
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
