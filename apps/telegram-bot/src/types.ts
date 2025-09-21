export interface BotConfig {
  /** Telegram bot token */
  token: string;
  /** Path to the flow file */
  flowFilePath: string;
  /** Bot name (optional) */
  name?: string;
  /** Bot description (optional) */
  description?: string;
  /** Webhook URL for production (optional) */
  webhookUrl?: string;
  /** Webhook port (optional) */
  webhookPort?: number;
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface FlowBotOptions {
  /** Bot configuration */
  config: BotConfig;
  /** Whether to use polling or webhooks */
  useWebhook?: boolean;
}
