const { TelegramFlowBot } = require('../dist/index.js');

// Example flow: A simple pizza ordering system
const pizzaOrderFlow = {
  id: 'pizza-order',
  title: 'Pizza Order System',
  description: 'A simple pizza ordering flow for Telegram',
  startNodeId: 'welcome',
  nodes: [
    {
      id: 'welcome',
      title: '🍕 Welcome to Pizza Bot!',
      content: 'Hi there! Ready to order some delicious pizza?',
      isAutoAdvance: false,
      outlets: [
        {
          id: 'start-order',
          to: 'choose-size',
          label: '🛒 Start Order',
        },
        {
          id: 'view-menu',
          to: 'menu',
          label: '📋 View Menu',
        },
      ],
    },
    {
      id: 'menu',
      title: '📋 Our Menu',
      content: `Our delicious pizzas:
🍕 Margherita - Classic tomato and mozzarella
🥓 Pepperoni - With spicy pepperoni
🍄 Mushroom - Fresh mushrooms and herbs
🌶️ Spicy - Hot peppers and jalapeños`,
      isAutoAdvance: false,
      outlets: [
        {
          id: 'back-to-welcome',
          to: 'welcome',
          label: '⬅️ Back to Start',
        },
      ],
    },
    {
      id: 'choose-size',
      title: '📏 Choose Pizza Size',
      content: 'What size pizza would you like?',
      isAutoAdvance: false,
      outlets: [
        {
          id: 'small',
          to: 'choose-toppings',
          label: '🍕 Small ($12)',
          actions: [
            {
              type: 'set',
              target: 'pizzaSize',
              value: 'small',
            },
            {
              type: 'set',
              target: 'price',
              value: 12,
            },
          ],
        },
        {
          id: 'medium',
          to: 'choose-toppings',
          label: '🍕 Medium ($16)',
          actions: [
            {
              type: 'set',
              target: 'pizzaSize',
              value: 'medium',
            },
            {
              type: 'set',
              target: 'price',
              value: 16,
            },
          ],
        },
        {
          id: 'large',
          to: 'choose-toppings',
          label: '🍕 Large ($20)',
          actions: [
            {
              type: 'set',
              target: 'pizzaSize',
              value: 'large',
            },
            {
              type: 'set',
              target: 'price',
              value: 20,
            },
          ],
        },
      ],
    },
    {
      id: 'choose-toppings',
      title: '🧀 Choose Toppings',
      content:
        'You selected a {{pizzaSize}} pizza (${{price}}). What toppings would you like?',
      isAutoAdvance: false,
      outlets: [
        {
          id: 'margherita',
          to: 'confirm-order',
          label: '🍅 Margherita',
          actions: [
            {
              type: 'set',
              target: 'toppings',
              value: 'Margherita',
            },
          ],
        },
        {
          id: 'pepperoni',
          to: 'confirm-order',
          label: '🥓 Pepperoni',
          actions: [
            {
              type: 'set',
              target: 'toppings',
              value: 'Pepperoni',
            },
            {
              type: 'set',
              target: 'price',
              expression: 'price + 3',
            },
          ],
        },
        {
          id: 'mushroom',
          to: 'confirm-order',
          label: '🍄 Mushroom',
          actions: [
            {
              type: 'set',
              target: 'toppings',
              value: 'Mushroom',
            },
            {
              type: 'set',
              target: 'price',
              expression: 'price + 2',
            },
          ],
        },
      ],
    },
    {
      id: 'confirm-order',
      title: '✅ Confirm Your Order',
      content:
        'Your order:\n\n🍕 {{pizzaSize}} {{toppings}} Pizza\n💰 Total: ${{price}}\n\nIs this correct?',
      isAutoAdvance: false,
      outlets: [
        {
          id: 'confirm',
          to: 'order-complete',
          label: '✅ Confirm Order',
        },
        {
          id: 'change-size',
          to: 'choose-size',
          label: '📏 Change Size',
        },
        {
          id: 'change-toppings',
          to: 'choose-toppings',
          label: '🧀 Change Toppings',
        },
      ],
    },
    {
      id: 'order-complete',
      title: '🎉 Order Confirmed!',
      content:
        "Thank you for your order!\n\n🍕 {{pizzaSize}} {{toppings}} Pizza\n💰 Total: ${{price}}\n\nYour pizza will be ready in 20-30 minutes. We'll send you updates!",
      isAutoAdvance: false,
      outlets: [],
    },
  ],
  globalState: {
    customerName: '',
    pizzaSize: '',
    toppings: '',
    price: 0,
  },
};

// Example usage
async function runPizzaBot() {
  const bot = new TelegramFlowBot({
    token: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
    flow: pizzaOrderFlow,
    welcomeMessage: '🍕 Welcome to Pizza Bot! Type /start to begin ordering.',
    completionMessage:
      '🎉 Thanks for using Pizza Bot! Type /start to order again.',
    enableLogging: true,
  });

  try {
    await bot.start();
    console.log('🤖 Pizza Bot is running! Send /start to begin.');
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runPizzaBot();
}

module.exports = { pizzaOrderFlow, runPizzaBot };
