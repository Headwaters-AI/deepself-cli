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
} from '../api/types.js';
import { info } from '../utils/output.js';

/**
 * Chat command (interactive and single-shot)
 */
class ChatCommand extends BaseCommand {
  private conversationHistory: ChatMessage[] = [];

  constructor(options: GlobalOptions) {
    super('chat', options);
  }

  async execute(
    modelId: string,
    cmdOptions: { message?: string }
  ): Promise<void> {
    const client = this.requireAuth();

    // Single-shot mode (with --message)
    if (cmdOptions.message) {
      const chatRequest: ChatCompletionRequest = {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: cmdOptions.message,
          },
        ],
      };

      const response = await client.post<ChatCompletionResponse>(
        API_ENDPOINTS.CHAT_COMPLETIONS,
        chatRequest
      );

      const assistantMessage = response.choices[0].message;

      this.output({
        model: response.model,
        message: assistantMessage.content,
        finish_reason: response.choices[0].finish_reason,
        usage: response.usage,
      });

      return;
    }

    // Interactive mode
    if (!this.options.quiet) {
      info(`Chat with ${modelId}`);
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
        const chatRequest: ChatCompletionRequest = {
          model: modelId,
          messages: this.conversationHistory,
        };

        const chatResponse = await client.post<ChatCompletionResponse>(
          API_ENDPOINTS.CHAT_COMPLETIONS,
          chatRequest
        );

        const assistantMessage = chatResponse.choices[0].message;
        this.conversationHistory.push(assistantMessage);

        console.log(chalk.green('Assistant:'), assistantMessage.content);
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
    .argument('<model-id>', 'Model ID to chat with')
    .option('--message <text>', 'Single message to send (non-interactive)')
    .action(async (modelId, options) => {
      const cmd = new ChatCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(chatCmd);
}
