import {
  EngineOptions,
  ExecutionStep,
  FlowEngine,
  RuntimeNode,
  RuntimeChoice,
  FlowDefinition,
} from '@zflo/core';

export interface TelegramBotOptions {
  token: string;
  flow: FlowDefinition;
  engineOptions?: EngineOptions;
  welcomeMessage?: string;
  errorMessage?: string;
  completionMessage?: string;
  maxSessionDuration?: number; // in milliseconds
  enableLogging?: boolean;
}

export interface TelegramBotSession {
  chatId: number;
  userId: number;
  username?: string;
  engine: FlowEngine; // Each session has its own engine instance
  currentNode: RuntimeNode | null;
  choices: RuntimeChoice[];
  isComplete: boolean;
  canGoBack: boolean;
  state: Record<string, unknown>;
  history: ExecutionStep[];
  lastActivity: Date;
  messageId?: number; // For editing messages
}

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  userId: number;
  text: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  timestamp: Date;
}

export interface TelegramCallbackQuery {
  id: string;
  chatId: number;
  userId: number;
  messageId: number;
  data: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  reply_markup?: InlineKeyboardMarkup;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
}

export interface EditMessageOptions {
  reply_markup?: InlineKeyboardMarkup;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}
