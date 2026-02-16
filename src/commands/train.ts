/**
 * Training commands: document, room (interactive and agent)
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { stdin as processStdin } from 'process';
import * as readline from 'readline';
import chalk from 'chalk';
import { BaseCommand, addGlobalOptions, GlobalOptions } from './base.js';
import { API_ENDPOINTS } from '../api/endpoints.js';
import {
  TrainDocumentRequest,
  TrainDocumentResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  FinalizeRoomResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
} from '../api/types.js';
import { success, info, labeled } from '../utils/output.js';
import { UsageError } from '../utils/errors.js';

/**
 * Read text from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';

    processStdin.setEncoding('utf-8');

    processStdin.on('data', (chunk) => {
      data += chunk;
    });

    processStdin.on('end', () => {
      resolve(data);
    });

    processStdin.on('error', (error) => {
      reject(error);
    });

    // Start reading
    processStdin.resume();
  });
}

/**
 * Train with document command
 */
class TrainDocumentCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('train.document', options);
  }

  async execute(
    modelId: string,
    cmdOptions: {
      file?: string;
      label: string;
      perspective: 'first-person' | 'third-person';
    }
  ): Promise<void> {
    // Validate required options
    if (!cmdOptions.label) {
      throw new UsageError('--label is required');
    }

    if (!cmdOptions.perspective) {
      throw new UsageError(
        '--perspective is required (first-person or third-person)'
      );
    }

    if (!['first-person', 'third-person'].includes(cmdOptions.perspective)) {
      throw new UsageError(
        '--perspective must be either "first-person" or "third-person"'
      );
    }

    // Get text from file or stdin
    let text: string;
    if (cmdOptions.file) {
      try {
        text = readFileSync(cmdOptions.file, 'utf-8');
      } catch (error) {
        throw new UsageError(`Could not read file: ${cmdOptions.file}`);
      }
    } else {
      // Read from stdin
      if (!this.options.quiet) {
        info('Reading from stdin... (Press Ctrl+D when done)');
      }
      text = await readStdin();
    }

    if (!text || text.trim() === '') {
      throw new UsageError('No text provided for training');
    }

    const client = this.requireAuth();

    const request: TrainDocumentRequest = {
      content: text.trim(),
      label: cmdOptions.label,
      perspective: cmdOptions.perspective,
    };

    const response = await client.post<TrainDocumentResponse>(
      API_ENDPOINTS.TRAINING_DOCUMENT(modelId),
      request
    );

    this.output(response);
  }

  protected humanOutput(response: TrainDocumentResponse): void {
    success('Document training completed!');
    console.log();

    labeled('Document ID', response.document_id);
    labeled('Status', response.status);
    console.log();

    console.log(chalk.cyan('Extraction Stats:'));
    labeled('  Epsilons', response.stats.epsilons_processed.toString());
    labeled('  Betas', response.stats.betas_processed.toString());
    labeled('  Deltas', response.stats.deltas_processed.toString());
    labeled('  Alphas', response.stats.alphas_processed.toString());
  }
}

/**
 * Interactive training room command
 */
class TrainRoomInteractiveCommand extends BaseCommand {
  private conversationHistory: ChatMessage[] = [];

  constructor(options: GlobalOptions) {
    super('train.room', options);
  }

  async execute(
    modelId: string,
    cmdOptions: { label: string }
  ): Promise<void> {
    if (!cmdOptions.label) {
      throw new UsageError('--label is required');
    }

    const client = this.requireAuth();

    // Create training room
    const createRequest: CreateRoomRequest = {
      label: cmdOptions.label,
      user_model: modelId,
    };

    const roomResponse = await client.post<CreateRoomResponse>(
      API_ENDPOINTS.TRAINING_ROOMS_CREATE(modelId),
      createRequest
    );

    const roomId = roomResponse.room_id;

    if (!this.options.quiet) {
      success(`Training room created: ${roomId}`);
      console.log();
      info('Type your messages below. Type "done" to finish training.');
      console.log();
    }

    // Start with a greeting from assistant
    console.log(chalk.green('Assistant:'), 'Hello! I\'m ready to learn. Tell me about yourself.');
    this.conversationHistory.push({
      role: 'assistant',
      content: 'Hello! I\'m ready to learn. Tell me about yourself.',
    });

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

      if (userInput.toLowerCase() === 'done') {
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
          room_id: roomId,
        };

        const chatResponse = await client.post<ChatCompletionResponse>(
          API_ENDPOINTS.CHAT_COMPLETIONS,
          chatRequest
        );

        const assistantMessage = chatResponse.choices[0].message;
        this.conversationHistory.push(assistantMessage);

        console.log(chalk.green('Assistant:'), assistantMessage.content);
        rl.prompt();
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        rl.prompt();
      }
    };

    rl.on('line', handleLine);

    // Handle close (done or Ctrl+D)
    rl.on('close', async () => {
      console.log();
      if (!this.options.quiet) {
        info('Finalizing training room...');
      }

      // Finalize the room
      try {
        const finalizeResponse = await client.post<FinalizeRoomResponse>(
          API_ENDPOINTS.TRAINING_ROOMS_FINALIZE(roomId)
        );

        this.output(finalizeResponse);
      } catch (error) {
        console.error(chalk.red('Error finalizing room:'), (error as Error).message);
        process.exit(1);
      }
    });
  }

  protected humanOutput(response: FinalizeRoomResponse): void {
    console.log();
    success('Training room finalized!');
    console.log();

    console.log(chalk.cyan('Extraction Stats:'));
    labeled('  Epsilons', response.stats.epsilons_processed.toString());
    labeled('  Betas', response.stats.betas_processed.toString());
    labeled('  Deltas', response.stats.deltas_processed.toString());
    labeled('  Alphas', response.stats.alphas_processed.toString());
  }
}

/**
 * Begin training room (agent-friendly)
 */
class TrainRoomBeginCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('train.room.begin', options);
  }

  async execute(
    modelId: string,
    cmdOptions: { label: string }
  ): Promise<void> {
    if (!cmdOptions.label) {
      throw new UsageError('--label is required');
    }

    const client = this.requireAuth();

    const createRequest: CreateRoomRequest = {
      label: cmdOptions.label,
      user_model: modelId,
    };

    const response = await client.post<CreateRoomResponse>(
      API_ENDPOINTS.TRAINING_ROOMS_CREATE(modelId),
      createRequest
    );

    this.output(response);
  }

  protected humanOutput(response: CreateRoomResponse): void {
    success(`Training room created: ${response.room_id}`);
    console.log();
    labeled('Room ID', response.room_id);
    labeled('Status', response.status);
    info('Use this room_id with "train room respond" to continue training');
  }
}

/**
 * Respond to training room (agent-friendly)
 */
class TrainRoomRespondCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('train.room.respond', options);
  }

  async execute(
    roomId: string,
    cmdOptions: { answer: string; model: string }
  ): Promise<void> {
    if (!cmdOptions.answer) {
      throw new UsageError('--answer is required');
    }

    if (!cmdOptions.model) {
      throw new UsageError('--model is required (model ID)');
    }

    const client = this.requireAuth();

    // Build conversation with the answer
    const chatRequest: ChatCompletionRequest = {
      model: cmdOptions.model,
      messages: [
        {
          role: 'user',
          content: cmdOptions.answer,
        },
      ],
      room_id: roomId,
    };

    const chatResponse = await client.post<ChatCompletionResponse>(
      API_ENDPOINTS.CHAT_COMPLETIONS,
      chatRequest
    );

    const nextQuestion = chatResponse.choices[0].message.content;

    this.output({
      room_id: roomId,
      next_question: nextQuestion,
      finish_reason: chatResponse.choices[0].finish_reason,
    });
  }

  protected humanOutput(data: any): void {
    labeled('Room ID', data.room_id);
    labeled('Next Question', data.next_question);
    labeled('Finish Reason', data.finish_reason);
  }
}

/**
 * End training room (agent-friendly)
 */
class TrainRoomEndCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('train.room.end', options);
  }

  async execute(roomId: string): Promise<void> {
    const client = this.requireAuth();

    const response = await client.post<FinalizeRoomResponse>(
      API_ENDPOINTS.TRAINING_ROOMS_FINALIZE(roomId)
    );

    this.output(response);
  }

  protected humanOutput(response: FinalizeRoomResponse): void {
    success('Training room finalized!');
    console.log();

    console.log(chalk.cyan('Extraction Stats:'));
    labeled('  Epsilons', response.stats.epsilons_processed.toString());
    labeled('  Betas', response.stats.betas_processed.toString());
    labeled('  Deltas', response.stats.deltas_processed.toString());
    labeled('  Alphas', response.stats.alphas_processed.toString());
  }
}

/**
 * Register training commands
 */
export function registerTrainCommands(program: Command): void {
  const train = program.command('train').description('Train AI models');

  // Train with document
  const documentCmd = train
    .command('document')
    .description('Train model with a document')
    .argument('<model-id>', 'Model ID to train')
    .requiredOption('--label <label>', 'Label for the training document')
    .requiredOption(
      '--perspective <perspective>',
      'Perspective: first-person or third-person'
    )
    .option('--file <path>', 'Path to file (otherwise reads from stdin)')
    .action(async (modelId, options) => {
      const cmd = new TrainDocumentCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(documentCmd);

  // Interactive training room (human-friendly)
  const interactiveCmd = train
    .command('interactive')
    .description('Interactive training room (human-friendly)')
    .argument('<model-id>', 'Model ID to train')
    .requiredOption('--label <label>', 'Label for the training session')
    .action(async (modelId, options) => {
      const cmd = new TrainRoomInteractiveCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(interactiveCmd);

  // Agent training room commands
  const roomGroup = train.command('room').description('Stateful training room commands (agent-friendly)');

  // Begin room (agent)
  const beginCmd = roomGroup
    .command('begin')
    .description('Begin training room')
    .argument('<model-id>', 'Model ID to train')
    .requiredOption('--label <label>', 'Label for the training session')
    .action(async (modelId, options) => {
      const cmd = new TrainRoomBeginCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(beginCmd);

  // Respond to room (agent)
  const respondCmd = roomGroup
    .command('respond')
    .description('Respond in training room')
    .argument('<room-id>', 'Training room ID')
    .requiredOption('--answer <text>', 'Your answer to the question')
    .requiredOption('--model <model-id>', 'Model ID')
    .action(async (roomId, options) => {
      const cmd = new TrainRoomRespondCommand(options);
      await cmd.execute(roomId, options);
    });
  addGlobalOptions(respondCmd);

  // End room (agent)
  const endCmd = roomGroup
    .command('end')
    .description('End training room')
    .argument('<room-id>', 'Training room ID')
    .action(async (roomId, options) => {
      const cmd = new TrainRoomEndCommand(options);
      await cmd.execute(roomId);
    });
  addGlobalOptions(endCmd);
}
