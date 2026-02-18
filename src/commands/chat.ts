/**
 * Chat commands: interactive and single-shot
 */

import { Command } from 'commander';
import * as readline from 'readline';
import chalk from 'chalk';
import { BaseCommand, addGlobalOptions, GlobalOptions } from './base.js';
import { API_ENDPOINTS } from '../api/endpoints.js';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  SupportedModelsResponse,
} from '../api/types.js';
import { info } from '../utils/output.js';

/**
 * Chat command (interactive and single-shot)
 * Supports username@model format for specifying LLM provider
 */
class ChatCommand extends BaseCommand {
  private conversationHistory: ChatMessage[] = [];

  constructor(options: GlobalOptions) {
    super('chat', options);
  }

  /**
   * Parse model format and determine provider
   * Returns { modelFormat, provider } where:
   * - modelFormat is the full "username@model" or just "username"
   * - provider is "anthropic", "openai", or undefined (for default)
   */
  private async parseModelFormat(modelInput: string): Promise<{ modelFormat: string; provider?: string }> {
    // Check if model includes @ symbol
    if (!modelInput.includes('@')) {
      // No @ means use default /v1/chat/completions endpoint
      return { modelFormat: modelInput, provider: undefined };
    }

    // Split username@model
    const [, modelId] = modelInput.split('@');

    // Fetch supported models to determine provider
    const client = this.getClient(); // Public endpoint
    const supportedModels = await client.get<SupportedModelsResponse>(API_ENDPOINTS.MODELS_SUPPORTED);

    // Find the model
    const model = supportedModels.models.find((m) => m.model === modelId);

    if (!model) {
      throw new Error(
        `Unsupported model: ${modelId}. Run "deepself models supported" to see available models.`
      );
    }

    return {
      modelFormat: modelInput,
      provider: model.provider,
    };
  }

  /**
   * Send a chat message using the appropriate endpoint based on provider
   */
  private async sendMessage(
    client: any,
    messages: ChatMessage[],
    modelFormat: string,
    provider?: string
  ): Promise<any> {
    // Route to appropriate endpoint based on provider
    if (provider === 'anthropic') {
      // Use /v1/messages (Anthropic proxy)
      const response = await client.post(API_ENDPOINTS.MESSAGES, {
        model: modelFormat,
        max_tokens: 4096,
        messages: messages,
      });
      return response;
    } else {
      // Use /v1/chat/completions (default, works for OpenAI and xAI)
      const chatRequest: ChatCompletionRequest = {
        model: modelFormat,
        messages: messages,
      };

      const response = await client.post(
        API_ENDPOINTS.CHAT_COMPLETIONS,
        chatRequest
      );

      return response as ChatCompletionResponse;
    }
  }

  async execute(
    modelId: string,
    cmdOptions: { message?: string }
  ): Promise<void> {
    const client = this.requireAuth();

    // Parse model format and determine provider
    const { modelFormat, provider } = await this.parseModelFormat(modelId);

    // Single-shot mode (with --message)
    if (cmdOptions.message) {
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: cmdOptions.message,
        },
      ];

      const response = await this.sendMessage(client, messages, modelFormat, provider);

      // Handle response based on provider
      if (provider === 'anthropic') {
        // Anthropic Messages API response format
        const content = response.content[0]?.text || '';
        this.output({
          model: response.model,
          message: content,
          finish_reason: response.stop_reason,
          usage: response.usage,
        });
      } else {
        // OpenAI format
        const assistantMessage = response.choices[0].message;
        this.output({
          model: response.model,
          message: assistantMessage.content,
          finish_reason: response.choices[0].finish_reason,
          usage: response.usage,
        });
      }

      return;
    }

    // Interactive mode
    if (!this.options.quiet) {
      info(`Chat with ${modelFormat}${provider ? ` (${provider})` : ''}`);
      info('Type your messages below. Type "exit" or "quit" to end the chat.');
      console.log();
    }

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('You: '),
    });

    rl.prompt();

    // Handle user input
    const handleLine = async (line: string) => {
      const userInput = line.trim();

      // Check for exit commands
      if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
        rl.close();
        return;
      }

      if (userInput === '') {
        rl.prompt();
        return;
      }

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userInput,
      });

      // Send message to API
      try {
        const response = await this.sendMessage(
          client,
          this.conversationHistory,
          modelFormat,
          provider
        );

        // Handle response based on provider
        let assistantContent: string;
        if (provider === 'anthropic') {
          // Anthropic Messages API response format
          assistantContent = response.content[0]?.text || '';
          this.conversationHistory.push({
            role: 'assistant',
            content: assistantContent,
          });
        } else {
          // OpenAI format
          const assistantMessage = response.choices[0].message;
          this.conversationHistory.push(assistantMessage);
          assistantContent = assistantMessage.content;
        }

        console.log(chalk.green('Assistant:'), assistantContent);
        console.log();
        rl.prompt();
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        console.log();
        rl.prompt();
      }
    };

    rl.on('line', handleLine);

    // Handle close
    rl.on('close', () => {
      console.log();
      if (!this.options.quiet) {
        info('Chat ended');
      }
      process.exit(0);
    });
  }

  protected humanOutput(data: any): void {
    // Single-shot mode output
    console.log(data.message);

    if (!this.options.quiet && data.usage) {
      console.log();
      console.log(chalk.gray(`Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`));
    }
  }
}

/**
 * Register chat commands
 */
export function registerChatCommands(program: Command): void {
  const chatCmd = program
    .command('chat')
    .description('Chat with an AI model')
    .argument('<model>', 'Model to chat with (username or username@model-id, e.g., yoda@gpt-4o-mini)')
    .option('--message <text>', 'Single message to send (non-interactive)')
    .action(async (modelId, options) => {
      const cmd = new ChatCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(chatCmd);
}
