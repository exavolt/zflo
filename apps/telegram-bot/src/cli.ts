import { Command } from 'commander';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { FlowBot } from './flow-bot.js';
import { FlowLoader } from './flow-loader.js';
import { BotConfig } from './types.js';

// Load environment variables
config();

const program = new Command();

program
  .name('zflo-telegram-bot')
  .description('Run ZFlo flows as Telegram bots')
  .version('0.1.0');

program
  .command('start')
  .description('Start a Telegram bot with the specified flow')
  .argument(
    '<flow-file>',
    'Path to the flow file (JSON, Mermaid, DOT, or PlantUML)'
  )
  .option(
    '-t, --token <token>',
    'Telegram bot token (or set TELEGRAM_BOT_TOKEN env var)'
  )
  .option('-n, --name <name>', 'Bot name')
  .option('-d, --description <description>', 'Bot description')
  .option('-w, --webhook <url>', 'Webhook URL for production deployment')
  .option('-p, --port <port>', 'Webhook port (default: 3000)', '3000')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .action(async (flowFile: string, options) => {
    try {
      const config = await buildBotConfig(flowFile, options);
      const bot = new FlowBot({ config });
      await bot.start();
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to start bot:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a flow file without starting the bot')
  .argument('<flow-file>', 'Path to the flow file to validate')
  .action(async (flowFile: string) => {
    try {
      const flowLoader = new FlowLoader();
      const absolutePath = resolve(flowFile);

      if (!existsSync(absolutePath)) {
        console.error(chalk.red('❌ Flow file not found:'), absolutePath);
        process.exit(1);
      }

      console.log(chalk.blue('🔍 Validating flow file...'));
      const validation = await flowLoader.validateFlow(absolutePath);

      if (validation.isValid) {
        console.log(chalk.green('✅ Flow file is valid'));

        if (validation.warnings.length > 0) {
          console.log(chalk.yellow('\n⚠️  Warnings:'));
          validation.warnings.forEach((warning) => {
            console.log(chalk.yellow(`   ${warning}`));
          });
        }
      } else {
        console.log(chalk.red('❌ Flow file is invalid'));
        console.log(chalk.red('\nErrors:'));
        validation.errors.forEach((error) => {
          console.log(chalk.red(`   ${error}`));
        });
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red('❌ Validation failed:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show information about supported formats and configuration')
  .action(() => {
    const flowLoader = new FlowLoader();
    const formats = flowLoader.getSupportedFormats();

    console.log(chalk.blue('📋 ZFlo Telegram Bot Information\n'));

    console.log(chalk.green('Supported Flow Formats:'));
    formats.forEach((format) => {
      console.log(chalk.gray(`   • ${format}`));
    });

    console.log(chalk.green('\nEnvironment Variables:'));
    console.log(
      chalk.gray('   TELEGRAM_BOT_TOKEN    - Your Telegram bot token')
    );
    console.log(
      chalk.gray('   WEBHOOK_URL           - Webhook URL for production')
    );
    console.log(
      chalk.gray('   WEBHOOK_PORT          - Webhook port (default: 3000)')
    );
    console.log(
      chalk.gray('   FLOW_FILE_PATH        - Default flow file path')
    );
    console.log(chalk.gray('   BOT_NAME              - Default bot name'));
    console.log(
      chalk.gray('   BOT_DESCRIPTION       - Default bot description')
    );
    console.log(
      chalk.gray(
        '   LOG_LEVEL             - Log level (debug, info, warn, error)'
      )
    );

    console.log(chalk.green('\nExample Usage:'));
    console.log(
      chalk.gray('   zflo-telegram-bot start my-flow.json --token YOUR_TOKEN')
    );
    console.log(chalk.gray('   zflo-telegram-bot validate my-flow.mermaid'));
    console.log(
      chalk.gray(
        '   zflo-telegram-bot start flow.puml --webhook https://mybot.com/webhook'
      )
    );
  });

async function buildBotConfig(
  flowFile: string,
  options: any
): Promise<BotConfig> {
  const absolutePath = resolve(flowFile);

  // Check if flow file exists
  if (!existsSync(absolutePath)) {
    throw new Error(`Flow file not found: ${absolutePath}`);
  }

  // Get token from options or environment
  const token = options.token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      'Telegram bot token is required. Use --token option or set TELEGRAM_BOT_TOKEN environment variable.'
    );
  }

  const config: BotConfig = {
    token,
    flowFilePath: absolutePath,
    name: options.name || process.env.BOT_NAME,
    description: options.description || process.env.BOT_DESCRIPTION,
    webhookUrl: options.webhook || process.env.WEBHOOK_URL,
    webhookPort: options.port
      ? parseInt(options.port)
      : process.env.WEBHOOK_PORT
        ? parseInt(process.env.WEBHOOK_PORT)
        : undefined,
    logLevel: options.logLevel || process.env.LOG_LEVEL || 'info',
  };

  return config;
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(
    chalk.red('🚨 Unhandled Rejection at:'),
    promise,
    chalk.red('reason:'),
    reason
  );
  process.exit(1);
});

program.parse();
