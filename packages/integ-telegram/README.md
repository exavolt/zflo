# @zflo/integ-telegram

Telegram bot integration for ZFlo flows. This package allows you to run ZFlo flows as interactive Telegram bots with inline keyboard support.

Due to Telegram's API server is not supporting cross-origin requests, this package is not compatible with web clients.

## Features

- Interactive Telegram bot integration
- Inline keyboard support for flow choices
- State management integration
- Flow execution tracking

## Installation

```bash
npm install @zflo/integ-telegram
```

## Usage

### Basic Bot Setup

```typescript
import { TelegramFlowBot } from '@zflo/integ-telegram';
import { FlowDefinition } from '@zflo/core';

const flow: FlowDefinition = {
  // Your flow definition
};

const bot = new TelegramFlowBot({
  token: 'YOUR_BOT_TOKEN',
  flow: flow,
});

bot.start();
```

## API Reference

See the TypeScript definitions for detailed API documentation.
