/**
 * Billing commands: balance, usage, subscription, checkout, cancel
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { BaseCommand, addGlobalOptions, GlobalOptions } from './base.js';
import { API_ENDPOINTS } from '../api/endpoints.js';
import {
  BalanceResponse,
  UsageHistoryResponse,
  SubscriptionResponse,
  CheckoutResponse,
  CancelSubscriptionResponse,
} from '../api/types.js';
import { createTable, createKeyValueTable } from '../utils/table.js';
import { success, info } from '../utils/output.js';
import { promptConfirm } from '../utils/prompts.js';

/**
 * Get balance command
 */
class GetBalanceCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('billing.balance', options);
  }

  async execute(): Promise<void> {
    const client = this.requireAuth();
    const response = await client.get<BalanceResponse>(API_ENDPOINTS.BILLING_BALANCE);
    this.output(response);
  }

  protected humanOutput(data: BalanceResponse): void {
    const table = createKeyValueTable();

    table.push(
      [chalk.cyan('Balance'), `$${data.balance_usd.toFixed(4)}`],
      [chalk.cyan('Status'), data.frozen ? chalk.red('Frozen') : chalk.green('Active')],
      [chalk.cyan('IAM ID'), data.iam_id]
    );

    console.log(table.toString());

    if (data.frozen) {
      console.log();
      console.log(chalk.yellow('⚠️  Your account is frozen. Please top up to continue using the API.'));
    }
  }
}

/**
 * Get usage history command
 */
class GetUsageCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('billing.usage', options);
  }

  async execute(cmdOptions: { page?: number; limit?: number }): Promise<void> {
    const client = this.requireAuth();

    const page = cmdOptions.page || 1;
    const limit = cmdOptions.limit || 20;

    const response = await client.get<UsageHistoryResponse>(
      `${API_ENDPOINTS.BILLING_USAGE}?page=${page}&limit=${limit}`
    );

    this.output(response);
  }

  protected humanOutput(data: UsageHistoryResponse): void {
    if (data.entries.length === 0) {
      info('No usage history found');
      return;
    }

    const table = createTable([
      'Date',
      'Model',
      'LLM',
      'In Tokens',
      'Out Tokens',
      'Cost (USD)',
    ]);

    data.entries.forEach((entry) => {
      const date = new Date(entry.created_at).toLocaleString();
      table.push([
        date,
        entry.model_username,
        entry.llm_model,
        entry.input_tokens.toString(),
        entry.output_tokens.toString(),
        `$${entry.total_deducted_usd.toFixed(6)}`,
      ]);
    });

    console.log(table.toString());
    console.log();
    info(`Page ${data.page} of ${Math.ceil(data.total / data.limit)} (Total: ${data.total} entries)`);
  }
}

/**
 * Get subscription command
 */
class GetSubscriptionCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('billing.subscription', options);
  }

  async execute(): Promise<void> {
    const client = this.requireAuth();
    const response = await client.get<SubscriptionResponse>(API_ENDPOINTS.BILLING_SUBSCRIPTION);
    this.output(response);
  }

  protected humanOutput(data: SubscriptionResponse): void {
    const table = createKeyValueTable();

    table.push(
      [chalk.cyan('Plan'), chalk.bold(data.plan.toUpperCase())],
      [chalk.cyan('Status'), data.status === 'active' ? chalk.green('Active') : chalk.yellow(data.status)],
      [chalk.cyan('Models'), `${data.iam_count} / ${data.iam_limit}`],
      [
        chalk.cyan('Renewal'),
        data.current_period_end
          ? new Date(data.current_period_end).toLocaleDateString()
          : 'N/A',
      ]
    );

    console.log(table.toString());

    if (data.iam_count >= data.iam_limit) {
      console.log();
      console.log(chalk.yellow(`⚠️  You've reached your model limit. Upgrade to create more models.`));
    }
  }
}

/**
 * Create checkout session command
 */
class CheckoutCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('billing.checkout', options);
  }

  async execute(plan: string): Promise<void> {
    if (!['standard', 'pro'].includes(plan.toLowerCase())) {
      throw new Error('Plan must be either "standard" or "pro"');
    }

    const client = this.requireAuth();
    const response = await client.post<CheckoutResponse>(
      `${API_ENDPOINTS.BILLING_CHECKOUT}?plan=${plan.toLowerCase()}`
    );

    this.output(response);
  }

  protected humanOutput(data: CheckoutResponse): void {
    success('Checkout session created!');
    console.log();
    console.log(chalk.cyan('Visit this URL to complete your upgrade:'));
    console.log(chalk.underline(data.checkout_url));
  }
}

/**
 * Cancel subscription command
 */
class CancelSubscriptionCommand extends BaseCommand {
  constructor(options: GlobalOptions) {
    super('billing.cancel', options);
  }

  async execute(cmdOptions: { force?: boolean }): Promise<void> {
    // Confirm cancellation unless --force flag is used
    if (!cmdOptions.force) {
      const confirmed = await promptConfirm(
        'Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.',
        false
      );

      if (!confirmed) {
        info('Cancellation aborted');
        return;
      }
    }

    const client = this.requireAuth();
    const response = await client.post<CancelSubscriptionResponse>(
      API_ENDPOINTS.BILLING_CANCEL
    );

    this.output(response);
  }

  protected humanOutput(data: CancelSubscriptionResponse): void {
    success('Subscription cancelled');
    console.log();

    if (data.current_period_end) {
      console.log(chalk.yellow('Your subscription will remain active until:'));
      console.log(chalk.bold(new Date(data.current_period_end).toLocaleDateString()));
    }
  }
}

/**
 * Register billing commands
 */
export function registerBillingCommands(program: Command): void {
  const billing = program.command('billing').description('Manage billing and subscription');

  // Get balance
  const balanceCmd = billing
    .command('balance')
    .description('Get current credit balance')
    .action(async (options) => {
      const cmd = new GetBalanceCommand(options);
      await cmd.execute();
    });
  addGlobalOptions(balanceCmd);

  // Get usage history
  const usageCmd = billing
    .command('usage')
    .description('View token usage history')
    .option('--page <number>', 'Page number (default: 1)', '1')
    .option('--limit <number>', 'Items per page (default: 20)', '20')
    .action(async (options) => {
      const cmd = new GetUsageCommand(options);
      await cmd.execute({
        page: parseInt(options.page),
        limit: parseInt(options.limit),
      });
    });
  addGlobalOptions(usageCmd);

  // Get subscription
  const subscriptionCmd = billing
    .command('subscription')
    .description('View subscription details')
    .action(async (options) => {
      const cmd = new GetSubscriptionCommand(options);
      await cmd.execute();
    });
  addGlobalOptions(subscriptionCmd);

  // Upgrade (checkout)
  const upgradeCmd = billing
    .command('upgrade')
    .description('Upgrade to standard or pro plan')
    .argument('<plan>', 'Plan to upgrade to (standard or pro)')
    .action(async (plan, options) => {
      const cmd = new CheckoutCommand(options);
      await cmd.execute(plan);
    });
  addGlobalOptions(upgradeCmd);

  // Cancel subscription
  const cancelCmd = billing
    .command('cancel')
    .description('Cancel your subscription')
    .option('--force', 'Skip confirmation prompt')
    .action(async (options) => {
      const cmd = new CancelSubscriptionCommand(options);
      await cmd.execute(options);
    });
  addGlobalOptions(cancelCmd);
}
