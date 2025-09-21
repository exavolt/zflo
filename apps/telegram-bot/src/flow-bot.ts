import { ZFFlow } from '@zflo/core';
import { TelegramFlowBot } from '@zflo/integ-telegram';
import { FlowLoader } from './flow-loader.js';
import { BotConfig, FlowBotOptions } from './types.js';
import chalk from 'chalk';

export class FlowBot {
  private bot?: TelegramFlowBot;
  private flowLoader = new FlowLoader();
  private config: BotConfig;

  constructor(options: FlowBotOptions) {
    this.config = options.config;
  }

  /**
   * Initialize and start the bot
   */
  async start(): Promise<void> {
    try {
      // Load and validate the flow
      console.log(chalk.blue('📄 Loading flow file...'));
      const flow = await this.loadFlow();

      console.log(chalk.green(`✅ Flow loaded: ${flow.title || flow.id}`));
      console.log(chalk.gray(`   Nodes: ${flow.nodes.length}`));
      console.log(chalk.gray(`   Start node: ${flow.startNodeId}`));

      // Create and configure the bot
      console.log(chalk.blue('🤖 Initializing Telegram bot...'));
      this.bot = new TelegramFlowBot({
        token: this.config.token,
        flow,
        enableLogging: true,
        welcomeMessage: `Welcome to ${this.config.name || flow.title || 'Flow Bot'}! Type /start to begin.`,
        completionMessage:
          'Flow completed successfully! Type /start to run again.',
        errorMessage:
          'Sorry, something went wrong. Please try /start to restart.',
      });

      // Set up error handling
      this.setupErrorHandling();

      // Start the bot
      if (this.config.webhookUrl) {
        console.log(chalk.blue('🌐 Starting bot with webhook...'));
        await this.bot.startWebhook({
          url: this.config.webhookUrl,
          port: this.config.webhookPort || 3000,
        });
        console.log(
          chalk.green(`✅ Bot started with webhook: ${this.config.webhookUrl}`)
        );
      } else {
        console.log(chalk.blue('🔄 Starting bot with polling...'));
        await this.bot.startPolling();
        console.log(chalk.green('✅ Bot started with polling'));
      }

      console.log(chalk.yellow('🚀 Bot is running! Press Ctrl+C to stop.'));
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to start bot:'),
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  /**
   * Stop the bot gracefully
   */
  async stop(): Promise<void> {
    if (this.bot) {
      console.log(chalk.blue('🛑 Stopping bot...'));
      await this.bot.stop();
      console.log(chalk.green('✅ Bot stopped'));
    }
  }

  /**
   * Reload the flow file and restart the bot
   */
  async reload(): Promise<void> {
    console.log(chalk.blue('🔄 Reloading flow...'));
    await this.stop();
    await this.start();
  }

  /**
   * Get bot information
   */
  getBotInfo() {
    return {
      config: this.config,
      isRunning: !!this.bot,
      supportedFormats: this.flowLoader.getSupportedFormats(),
    };
  }

  private async loadFlow(): Promise<ZFFlow> {
    // Validate the flow file first
    const validation = await this.flowLoader.validateFlow(
      this.config.flowFilePath
    );

    if (!validation.isValid) {
      throw new Error(`Invalid flow file: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Flow warnings:'));
      validation.warnings.forEach((warning) => {
        console.log(chalk.yellow(`   ${warning}`));
      });
    }

    // Load the flow
    return await this.flowLoader.loadFlow(this.config.flowFilePath);
  }

  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('error', (error: unknown) => {
      console.error(chalk.red('🚨 Bot error:'), error);
    });

    this.bot.on('polling_error', (error: unknown) => {
      console.error(chalk.red('🚨 Polling error:'), error);
    });

    // Handle process signals for graceful shutdown
    process.on('SIGINT', async () => {
      console.log(
        chalk.yellow('\n📡 Received SIGINT, shutting down gracefully...')
      );
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log(
        chalk.yellow('\n📡 Received SIGTERM, shutting down gracefully...')
      );
      await this.stop();
      process.exit(0);
    });
  }
}
