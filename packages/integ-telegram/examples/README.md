# Telegram Integration Examples

This directory contains examples demonstrating how to use the `@zflo/integ-telegram` package.

## Examples

### 1. Simple Bot (`simple-bot.ts`)

A complete example of a Telegram bot that runs a pizza ordering flow. This example shows:

- Creating a flow with multiple nodes and choices
- Using state variables and actions
- Setting up a Telegram bot with inline keyboards
- Handling user interactions and navigation

**Usage:**

```bash
# Set your bot token
export TELEGRAM_BOT_TOKEN="your_bot_token_here"

# Run the example
npx ts-node examples/simple-bot.ts
```

### 2. Web Client Example (`web-client-example.ts`)

Demonstrates how to use the web client for browser-based applications:

- Connecting to Telegram bot API from a web client
- Handling token prompting
- Managing flow state in a web environment
- React-style hook example for easy integration

**Usage:**

```bash
# Set your bot token
export TELEGRAM_BOT_TOKEN="your_bot_token_here"

# Run the simulation
npx ts-node examples/web-client-example.ts
```

## Getting Started

1. **Create a Telegram Bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command to create a new bot
   - Save the bot token provided

2. **Install Dependencies:**

   ```bash
   pnpm install
   ```

3. **Set Environment Variables:**

   ```bash
   export TELEGRAM_BOT_TOKEN="your_bot_token_here"
   ```

4. **Run Examples:**

   ```bash
   # For the bot example
   npx ts-node examples/simple-bot.ts

   # For the web client example
   npx ts-node examples/web-client-example.ts
   ```

## Features Demonstrated

### Bot Features

- ✅ Inline keyboard support with reply_markup
- ✅ State management and variable interpolation
- ✅ Session management for multiple users
- ✅ Navigation (back, restart)
- ✅ Flow completion handling
- ✅ Error handling and logging

### Web Client Features

- ✅ Token prompting for secure credential handling
- ✅ Event-driven architecture
- ✅ React hook integration example
- ✅ State synchronization
- ✅ Flow simulation and testing

## Flow Structure

The example uses a pizza ordering flow with the following structure:

```
Welcome → Menu (optional)
   ↓
Choose Size → Choose Toppings → Confirm Order → Complete
   ↑              ↑                ↑
   └──────────────┴────────────────┘
```

Each step uses inline keyboards to present choices to users, and state variables track the order details throughout the flow.

## Integration with Web Applications

The web client can be easily integrated into React applications:

```typescript
import { useTelegramFlow } from '@zflo/integ-telegram/examples/web-client-example';

function MyComponent() {
  const {
    currentState,
    isConnected,
    makeChoice,
    goBack,
    restart,
    formattedMessage,
    inlineKeyboard
  } = useTelegramFlow(myFlow, botToken);

  // Render your UI based on currentState
  return (
    <div>
      <p>{formattedMessage}</p>
      {currentState?.choices.map(choice => (
        <button key={choice.id} onClick={() => makeChoice(choice.id)}>
          {choice.label}
        </button>
      ))}
    </div>
  );
}
```

## Next Steps

- Customize the flow for your use case
- Add more complex state logic and conditions
- Implement persistent storage for sessions
- Add webhook support for production deployments
- Integrate with your existing backend services
