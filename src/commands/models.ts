/**
 * Model management commands: list, create, get, update, delete
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { BaseCommand, addGlobalOptions, GlobalOptions } from './base.js';
import { API_ENDPOINTS } from '../api/endpoints.js';
import { Model, ModelsListResponse, CreateModelRequest, UpdateModelRequest, SupportedModelsResponse } from '../api/types.js';
import { createTable, createKeyValueTable } from '../utils/table.js';
import { formatDate, formatFacts, formatTools, parseFact } from '../utils/formatting.js';
import { success, info } from '../utils/output.js';
import { promptConfirm } from '../utils/prompts.js';
import { UsageError } from '../utils/errors.js';

/**
 * List models command
 */
class ListModelsCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('models.list', options);
  }

  async execute(): Promise<void> {
    const client = this.requireAuth();
    const response = await client.get<ModelsListResponse>(API_ENDPOINTS.MODELS_LIST);
    this.output(response.data);
  }

  protected humanOutput(models: Model[]): void {
    if (models.length === 0) {
      info('No models found. Create one with: deepself models create <username>');
      return;
    }

    const table = createTable(['Model ID', 'Owner', 'Name', 'Created', 'Epsilons']);

    models.forEach((model) => {
      table.push([
        model.id,
        model.owned_by,
        model.name || '<none>',
        formatDate(model.created),
        Object.keys(model.basic_facts || {}).length.toString(),
      ]);
    });

    console.log(table.toString());
    console.log();
    info(`Total: ${models.length} model(s)`);
  }
}

/**
 * Get model details command
 */
class GetModelCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('models.get', options);
  }

  async execute(modelId: string): Promise<void> {
    const client = this.requireAuth();
    const model = await client.get<Model>(API_ENDPOINTS.MODELS_GET(modelId));
    this.output(model);
  }

  protected humanOutput(model: Model): void {
    const table = createKeyValueTable();

    table.push(
      [chalk.cyan('Model ID'), model.id],
      [chalk.cyan('Owner'), model.owned_by],
      [chalk.cyan('Name'), model.name || '<none>'],
      [chalk.cyan('Created'), formatDate(model.created)],
      [chalk.cyan('Tools'), formatTools(model.default_tools)],
      [chalk.cyan('Epsilons'), formatFacts(model.basic_facts || {})]
    );

    console.log(table.toString());
  }
}

/**
 * Create model command
 */
class CreateModelCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('models.create', options);
  }

  async execute(
    username: string,
    cmdOptions: { name?: string; tools?: string[] }
  ): Promise<void> {
    // Validate username format (lowercase letters, dashes, numbers, max 32 chars)
    if (!/^[a-z0-9-]+$/.test(username)) {
      throw new UsageError(
        'Username must contain only lowercase letters, dashes, and numbers'
      );
    }

    if (username.length > 32) {
      throw new UsageError(
        'Username must be 32 characters or fewer'
      );
    }

    const client = this.requireAuth();

    const request: CreateModelRequest = {
      username,
      name: cmdOptions.name,
      default_tools: cmdOptions.tools,
    };

    const model = await client.post<Model>(
      API_ENDPOINTS.MODELS_CREATE,
      request
    );

    this.output(model);
  }

  protected humanOutput(model: Model): void {
    success(`Model created: ${model.id}`);
    console.log();

    const table = createKeyValueTable();
    table.push(
      [chalk.cyan('Model ID'), model.id],
      [chalk.cyan('Owner'), model.owned_by],
      [chalk.cyan('Name'), model.name || '<none>']
    );

    console.log(table.toString());
  }
}

/**
 * Update model command
 */
class UpdateModelCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('models.update', options);
  }

  async execute(
    modelId: string,
    cmdOptions: {
      name?: string;
      addFact?: string[];
      tools?: string[];
    }
  ): Promise<void> {
    const client = this.requireAuth();

    // Build update request
    const request: UpdateModelRequest = {};

    if (cmdOptions.name) {
      request.name = cmdOptions.name;
    }

    if (cmdOptions.addFact && cmdOptions.addFact.length > 0) {
      request.basic_facts = {};
      cmdOptions.addFact.forEach((factString) => {
        const { key, value } = parseFact(factString);
        request.basic_facts![key] = value;
      });
    }

    if (cmdOptions.tools) {
      request.default_tools = cmdOptions.tools;
    }

    // Check if there are any updates
    if (Object.keys(request).length === 0) {
      throw new UsageError(
        'No updates specified. Use --name, --add-fact, or --tools'
      );
    }

    const model = await client.patch<Model>(
      API_ENDPOINTS.MODELS_UPDATE(modelId),
      request
    );

    this.output(model);
  }

  protected humanOutput(model: Model): void {
    success(`Model updated: ${model.id}`);
    console.log();

    const table = createKeyValueTable();
    table.push(
      [chalk.cyan('Model ID'), model.id],
      [chalk.cyan('Owner'), model.owned_by],
      [chalk.cyan('Name'), model.name || '<none>'],
      [chalk.cyan('Tools'), formatTools(model.default_tools)],
      [chalk.cyan('Epsilons'), formatFacts(model.basic_facts || {})]
    );

    console.log(table.toString());
  }
}

/**
 * Delete model command
 */
class DeleteModelCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('models.delete', options);
  }

  async execute(modelId: string, cmdOptions: { force?: boolean }): Promise<void> {
    // Confirm deletion unless --force flag is used
    if (!cmdOptions.force) {
      const confirmed = await promptConfirm(
        `Are you sure you want to delete model "${modelId}"? This cannot be undone.`,
        false
      );

      if (!confirmed) {
        info('Deletion cancelled');
        return;
      }
    }

    const client = this.requireAuth();
    await client.delete(API_ENDPOINTS.MODELS_DELETE(modelId));

    this.output({ deleted: true, model_id: modelId });
  }

  protected humanOutput(data: any): void {
    success(`Model deleted: ${data.model_id}`);
  }
}

/**
 * List supported LLM models command
 */
class SupportedModelsCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('models.supported', options);
  }

  async execute(): Promise<void> {
    const client = this.getClient(); // Public endpoint - no auth required
    const response = await client.get<SupportedModelsResponse>(API_ENDPOINTS.MODELS_SUPPORTED);
    this.output(response.models);
  }

  protected humanOutput(models: any[]): void {
    if (models.length === 0) {
      info('No supported models found');
      return;
    }

    const table = createTable(['Model ID', 'Provider']);

    models.forEach((model) => {
      table.push([model.model, model.provider]);
    });

    console.log(table.toString());
    console.log();
    info(`Total: ${models.length} supported model(s)`);
    console.log();
    console.log(chalk.gray('Use these model IDs with the username@model format:'));
    console.log(chalk.gray('  Example: deepself chat yoda@gpt-4o-mini'));
  }
}

/**
 * Register model commands
 */
export function registerModelsCommands(program: Command): void {
  const models = program.command('models').description('Manage AI models');

  // List models
  const listCmd = models
    .command('list')
    .description('List all your models')
    .action(async (options) => {
      const cmd = new ListModelsCommand(options);
      await cmd.execute();
    });
  addGlobalOptions(listCmd);

  // Get model
  const getCmd = models
    .command('get')
    .description('Get details of a specific model')
    .argument('<model-id>', 'Model ID to retrieve')
    .action(async (modelId, options) => {
      const cmd = new GetModelCommand(options);
      await cmd.execute(modelId);
    });
  addGlobalOptions(getCmd);

  // Create model
  const createCmd = models
    .command('create')
    .description('Create a new model')
    .argument('<username>', 'Username for the model (lowercase letters, dashes, numbers, max 32 chars)')
    .option('--name <name>', 'Display name for the model')
    .option('--tools <tools...>', 'Tools to enable for the model')
    .action(async (username, options) => {
      const cmd = new CreateModelCommand(options);
      await cmd.execute(username, options);
    });
  addGlobalOptions(createCmd);

  // Update model
  const updateCmd = models
    .command('update')
    .description('Update a model')
    .argument('<model-id>', 'Model ID to update')
    .option('--name <name>', 'New display name')
    .option('--add-fact <fact...>', 'Add epsilons in format "key:value"')
    .option('--tools <tools...>', 'Update tools list')
    .action(async (modelId, options) => {
      const cmd = new UpdateModelCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(updateCmd);

  // Delete model
  const deleteCmd = models
    .command('delete')
    .description('Delete a model')
    .argument('<model-id>', 'Model ID to delete')
    .option('--force', 'Skip confirmation prompt')
    .action(async (modelId, options) => {
      const cmd = new DeleteModelCommand(options);
      await cmd.execute(modelId, options);
    });
  addGlobalOptions(deleteCmd);

  // Supported models
  const supportedCmd = models
    .command('supported')
    .description('List available LLM models for username@model syntax')
    .action(async (options) => {
      const cmd = new SupportedModelsCommand(options);
      await cmd.execute();
    });
  addGlobalOptions(supportedCmd);
}
