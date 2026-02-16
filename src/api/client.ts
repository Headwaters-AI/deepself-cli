/**
 * HTTP client for the Deepself API with response normalization
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ApiError, NotFoundError, AuthenticationError } from '../utils/errors.js';
import { DEFAULT_API_BASE_URL } from './endpoints.js';

export interface ApiClientConfig {
  apiKey?: string;
  baseURL?: string;
}

/**
 * Normalized API client that handles inconsistent response formats
 */
export class ApiClient {
  private axios: AxiosInstance;

  constructor(config: ApiClientConfig) {
    const baseURL = config.baseURL || DEFAULT_API_BASE_URL;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    this.axios = axios.create({
      baseURL,
      headers,
      timeout: 30000, // 30 seconds
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;

          // Handle authentication errors
          if (status === 401 || status === 403) {
            throw new AuthenticationError(
              data?.error || 'Authentication failed. Please check your API key.'
            );
          }

          // Handle not found errors
          if (status === 404) {
            throw new NotFoundError(
              data?.error || 'Resource not found'
            );
          }

          // Handle other errors
          const message = data?.error || data?.message || error.message;
          throw new ApiError(message, status, data?.code);
        }

        // Network or other errors
        throw new ApiError(error.message);
      }
    );
  }

  /**
   * Make a request and normalize the response
   * Handles both wrapped ({success, data}) and direct responses
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.request(config);

    // Check if response is wrapped in {success, data} format
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data
    ) {
      if (!response.data.success) {
        throw new ApiError(
          response.data.error || 'API request failed',
          response.status,
          response.data.code
        );
      }
      return response.data.data as T;
    }

    // Direct response (not wrapped)
    return response.data as T;
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}
