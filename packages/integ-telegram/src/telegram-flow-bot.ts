import {
  FlowEngine,
  FlowDefinition,
  RuntimeNode,
  RuntimeChoice,
} from '@zflo/core';
import { TelegramBot } from 'typescript-telegram-bot-api';
import {
  TelegramBotOptions,
  TelegramBotSession,
  TelegramMessage,
  TelegramCallbackQuery,
  InlineKeyboardMarkup,
  SendMessageOptions,
  EditMessageOptions,
} from './types';

export class TelegramFlowBot {
  private bot: TelegramBot;
  private flow: FlowDefinition;
  private sessions: Map<number, TelegramBotSession> = new Map();
  private options: TelegramBotOptions & {
    welcomeMessage: string;
    errorMessage: string;
    completionMessage: string;
    maxSessionDuration: number;
    enableLogging: boolean;
  };
  private isRunning = false;

  constructor(options: TelegramBotOptions) {
    this.options = {
      welcomeMessage: "Welcome! Let's start your flow.",
      errorMessage: 'Sorry, something went wrong. Please try again.',
      completionMessage: 'Flow completed successfully!',
      maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      enableLogging: false,
      ...options,
    };

    this.bot = new TelegramBot({
      botToken: this.options.token,
      autoRetryLimit: 5,
    });
    this.flow = this.options.flow;
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    this.isRunning = true;
    this.log('Starting Telegram Flow Bot...');

    // Set up webhook or polling
    await this.setupBot();

    // Clean up expired sessions periodically
    setInterval(() => this.cleanupExpiredSessions(), 60000); // Every minute

    this.log('Bot started successfully');
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.bot.stopPolling();
    this.sessions.clear();
    this.log('Bot stopped');
  }

  public async startPolling(): Promise<void> {
    await this.start();
  }

  public async startWebhook(_options: {
    url: string;
    port: number;
  }): Promise<void> {
    // For now, just start with polling - webhook support can be added later
    await this.start();
  }

  public on(event: string, handler: (error: any) => void): void {
    // Delegate to the internal bot instance
    this.bot.on(event as any, handler);
  }

  private async setupBot(): Promise<void> {
    // Set up message handlers
    this.bot.on('message', (message: any) => {
      this.handleMessage(this.parseMessage(message));
    });

    this.bot.on('callback_query', (callbackQuery: any) => {
      this.handleCallbackQuery(this.parseCallbackQuery(callbackQuery));
    });

    // Start polling
    this.bot.startPolling();
  }

  private parseMessage(message: any): TelegramMessage {
    return {
      messageId: message.message_id,
      chatId: message.chat.id,
      userId: message.from.id,
      text: message.text || '',
      username: message.from.username,
      firstName: message.from.first_name,
      lastName: message.from.last_name,
      timestamp: new Date(message.date * 1000),
    };
  }

  private parseCallbackQuery(callbackQuery: any): TelegramCallbackQuery {
    return {
      id: callbackQuery.id,
      chatId: callbackQuery.message.chat.id,
      userId: callbackQuery.from.id,
      messageId: callbackQuery.message.message_id,
      data: callbackQuery.data,
      username: callbackQuery.from.username,
      firstName: callbackQuery.from.first_name,
      lastName: callbackQuery.from.last_name,
    };
  }

  private async handleMessage(message: TelegramMessage): Promise<void> {
    try {
      const session = this.getOrCreateSession(
        message.chatId,
        message.userId,
        message.username
      );

      if (message.text === '/start' || message.text === '/restart') {
        await this.startFlow(session);
      } else if (message.text === '/back' && session.canGoBack) {
        await this.goBack(session);
      } else if (message.text === '/status') {
        await this.sendStatus(session);
      } else {
        // For text messages, we'll just show the current state
        await this.sendCurrentState(session);
      }
    } catch (error) {
      this.log('Error handling message:', error);
      await this.sendError(message.chatId);
    }
  }

  private async handleCallbackQuery(
    callbackQuery: TelegramCallbackQuery
  ): Promise<void> {
    try {
      // Answer the callback query to remove loading state
      await this.bot.answerCallbackQuery({
        callback_query_id: callbackQuery.id,
      });

      const session = this.getOrCreateSession(
        callbackQuery.chatId,
        callbackQuery.userId,
        callbackQuery.username
      );

      if (callbackQuery.data === 'back' && session.canGoBack) {
        await this.goBack(session);
      } else if (callbackQuery.data === 'restart') {
        await this.startFlow(session);
      } else {
        // Handle choice selection
        await this.makeChoice(
          session,
          callbackQuery.data,
          callbackQuery.messageId
        );
      }
    } catch (error) {
      this.log('Error handling callback query:', error);
      await this.sendError(callbackQuery.chatId);
    }
  }

  private getOrCreateSession(
    chatId: number,
    userId: number,
    username?: string
  ): TelegramBotSession {
    let session = this.sessions.get(chatId);

    if (!session) {
      const engine = new FlowEngine(this.flow, this.options.engineOptions);
      session = {
        chatId,
        userId,
        username,
        engine,
        currentNode: null,
        choices: [],
        isComplete: false,
        canGoBack: false,
        state: {},
        history: [],
        lastActivity: new Date(),
      };
      this.sessions.set(chatId, session);
    }

    session.lastActivity = new Date();
    return session;
  }

  private async startFlow(session: TelegramBotSession): Promise<void> {
    const result = await session.engine.start();

    session.currentNode = result.currentNode;
    session.choices = result.availableChoices;
    session.isComplete = result.isComplete;
    session.canGoBack = result.canGoBack;
    session.state = session.engine.getState();
    session.history = session.engine.getHistory();

    await this.sendWelcomeMessage(session);
    await this.sendCurrentState(session);
  }

  private async makeChoice(
    session: TelegramBotSession,
    choiceId: string,
    messageId?: number
  ): Promise<void> {
    const result = await session.engine.next(choiceId);

    session.currentNode = result.currentNode;
    session.choices = result.availableChoices;
    session.isComplete = result.isComplete;
    session.canGoBack = result.canGoBack;
    session.state = session.engine.getState();
    session.history = session.engine.getHistory();

    if (session.isComplete) {
      await this.sendCompletionMessage(session);
    } else {
      await this.updateCurrentState(session, messageId);
    }
  }

  private async goBack(session: TelegramBotSession): Promise<void> {
    const result = await session.engine.goBack();

    session.currentNode = result.currentNode;
    session.choices = result.availableChoices;
    session.isComplete = result.isComplete;
    session.canGoBack = result.canGoBack;
    session.state = session.engine.getState();
    session.history = session.engine.getHistory();

    await this.sendCurrentState(session);
  }

  private async sendWelcomeMessage(session: TelegramBotSession): Promise<void> {
    await this.bot.sendMessage({
      chat_id: session.chatId,
      text: this.options.welcomeMessage,
    });
  }

  private async sendCurrentState(session: TelegramBotSession): Promise<void> {
    if (!session.currentNode) {
      return;
    }

    const text = this.formatNodeMessage(session.currentNode, session.state);
    const replyMarkup = this.createInlineKeyboard(
      session.choices,
      session.canGoBack
    );

    const options: SendMessageOptions = {};
    if (replyMarkup.inline_keyboard.length > 0) {
      options.reply_markup = replyMarkup;
    }

    const message = await this.bot.sendMessage({
      chat_id: session.chatId,
      text,
      ...options,
    });
    session.messageId = message.message_id;
  }

  private async updateCurrentState(
    session: TelegramBotSession,
    messageId?: number
  ): Promise<void> {
    if (!session.currentNode) {
      return;
    }

    const text = this.formatNodeMessage(session.currentNode, session.state);
    const replyMarkup = this.createInlineKeyboard(
      session.choices,
      session.canGoBack
    );

    if (messageId && session.messageId === messageId) {
      // Edit the existing message
      const options: EditMessageOptions = {};
      if (replyMarkup.inline_keyboard.length > 0) {
        options.reply_markup = replyMarkup;
      }

      try {
        await this.bot.editMessageText({
          chat_id: session.chatId,
          message_id: messageId,
          text,
          ...options,
        });
      } catch (error) {
        // If editing fails, send a new message
        await this.sendCurrentState(session);
      }
    } else {
      // Send a new message
      await this.sendCurrentState(session);
    }
  }

  private async sendCompletionMessage(
    session: TelegramBotSession
  ): Promise<void> {
    const restartButton = {
      text: '🔄 Start Over',
      callback_data: 'restart',
    };

    const options: SendMessageOptions = {
      reply_markup: {
        inline_keyboard: [[restartButton]],
      },
    };

    await this.bot.sendMessage({
      chat_id: session.chatId,
      text: this.options.completionMessage,
      ...options,
    });
  }

  private async sendStatus(session: TelegramBotSession): Promise<void> {
    const status = [
      `📊 *Flow Status*`,
      `Node: ${session.currentNode?.definition.title || 'None'}`,
      `Complete: ${session.isComplete ? '✅' : '❌'}`,
      `Can go back: ${session.canGoBack ? '✅' : '❌'}`,
      `Choices available: ${session.choices.length}`,
      `History steps: ${session.history.length}`,
    ].join('\n');

    await this.bot.sendMessage({
      chat_id: session.chatId,
      text: status,
      parse_mode: 'Markdown',
    });
  }

  private async sendError(chatId: number): Promise<void> {
    await this.bot.sendMessage({
      chat_id: chatId,
      text: this.options.errorMessage,
    });
  }

  private formatNodeMessage(
    node: RuntimeNode,
    state: Record<string, unknown>
  ): string {
    let message = `*${node.definition.title}*`;

    if (node.definition.content) {
      message += `\n\n${node.definition.content}`;
    }

    // TODO: use interpolation/template setting
    // Replace state variables in the content
    message = this.replaceStateVariables(message, state);

    return message;
  }

  private replaceStateVariables(
    text: string,
    state: Record<string, unknown>
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = state[key];
      return value !== undefined ? String(value) : match;
    });
  }

  private createInlineKeyboard(
    choices: RuntimeChoice[],
    canGoBack: boolean
  ): InlineKeyboardMarkup {
    const keyboard: any[][] = [];

    // Add choice buttons
    for (const choice of choices) {
      if (choice.isEnabled) {
        keyboard.push([
          {
            text: choice.label,
            callback_data: choice.outletId,
          },
        ]);
      }
    }

    // Add navigation buttons
    const navButtons = [];
    if (canGoBack) {
      navButtons.push({
        text: '⬅️ Back',
        callback_data: 'back',
      });
    }

    navButtons.push({
      text: '🔄 Restart',
      callback_data: 'restart',
    });

    if (navButtons.length > 0) {
      keyboard.push(navButtons);
    }

    return { inline_keyboard: keyboard };
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: number[] = [];

    for (const [chatId, session] of this.sessions.entries()) {
      const timeSinceLastActivity =
        now.getTime() - session.lastActivity.getTime();
      if (timeSinceLastActivity > this.options.maxSessionDuration) {
        expiredSessions.push(chatId);
      }
    }

    for (const chatId of expiredSessions) {
      this.sessions.delete(chatId);
      this.log(`Cleaned up expired session for chat ${chatId}`);
    }
  }

  private log(...args: any[]): void {
    if (this.options.enableLogging) {
      console.log('[TelegramFlowBot]', ...args);
    }
  }
}
