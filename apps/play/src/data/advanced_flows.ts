import { ZFFlow } from '@zflo/core';

export const coffeeBrewingTemperature: ZFFlow = {
  id: 'coffee-brewing-temperature',
  title: 'Coffee Brewing: Finding the Right Temperature',
  description:
    'Find the perfect temperature for your coffee through guided tasting and adjustment using binary search algorithm.',
  startNodeId: 'welcome',
  globalState: {
    highTemp: 100.0,
    lowTemp: 80.0,
    midTemp: 90.0,
    iteration: 1,
  },
  nodes: [
    {
      id: 'welcome',
      title: 'Welcome',
      content:
        'Welcome to the Coffee Brewing Temperature Finder! This interactive guide uses a binary search algorithm to help you discover your perfect brewing temperature.\n\n' +
        "We'll start with a temperature range from ${lowTemp}°C to ${highTemp}°C (a ${highTemp - lowTemp}°C range). Each iteration, you'll taste three cups and tell us which tastes best, allowing us to narrow down to your ideal temperature.\n\n" +
        "The process is systematic and efficient - let's find your perfect brew!",
      outlets: [{ id: 'welcome-to-brewing', to: 'brewing' }],
      isAutoAdvance: false,
    },
    {
      id: 'close-enough',
      title: 'Range found!',
      content:
        'Perfect! After ${iteration} iteration${iteration == 1 ? "" : "s"}, we\'ve found your ideal brewing temperature: **${bestTemp}°C** (or somewhere around it).\n\nThis temperature should give you consistently excellent coffee. The final range was only ${highTemp - lowTemp}°C wide, ensuring precision in your brewing.',
      isAutoAdvance: false,
    },
    {
      id: 'brewing',
      title: 'Brew',
      content:
        '**Iteration ${iteration}**: Brew three cups at different temperatures:\n\n' +
        '🔥 **Hot**: ${highTemp}°C\n' +
        '🌡️ **Medium**: ${midTemp}°C\n' +
        '❄️ **Cool**: ${lowTemp}°C\n\n' +
        'Current range: ${highTemp - lowTemp}°C wide. Use the same coffee, grind size, and brewing method for all three cups.',
      outlets: [
        { id: 'brewing-to-tasting', to: 'tasting', label: 'Move to tasting' },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'tasting',
      title: 'Tasting',
      content:
        'Now for the tasting! Let all cups cool to the same drinking temperature (around 60-65°C).\n\n' +
        '**Tasting Tips:**\n' +
        '• Rinse your palate with water between tastings\n' +
        '• Taste in the same order each time\n' +
        '• Focus on overall flavor balance and preference\n\n' +
        'Which cup tastes the best to you?',
      outlets: [
        {
          id: 'tasting-to-upper-range-check',
          to: 'upper-range-check',
          label: 'Cup with higher temperature',
          actions: [
            {
              type: 'set',
              target: 'bestTemp',
              expression: 'highTemp',
            },
          ],
        },
        {
          id: 'tasting-to-middle-range-check',
          to: 'middle-range-check',
          label: 'Cup with middle temperature',
          actions: [
            {
              type: 'set',
              target: 'bestTemp',
              expression: 'midTemp',
            },
          ],
        },
        {
          id: 'tasting-to-lower-range-check',
          to: 'lower-range-check',
          label: 'Cup with lower temperature',
          actions: [
            {
              type: 'set',
              target: 'bestTemp',
              expression: 'lowTemp',
            },
          ],
        },
        {
          id: 'tasting-to-all-good',
          to: 'all-good',
          label: 'All cups tasted good',
          condition: 'iteration == 1',
        },
        {
          id: 'tasting-to-all-bad',
          to: 'all-bad',
          label: 'All cups tasted bad',
          condition: 'iteration == 1',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'all-good',
      title: 'All cups tasted good',
      content:
        'All cups tasted good. Great for you as you enjoy your coffee at wide range of brewing temperature.',
      isAutoAdvance: false,
    },
    {
      id: 'all-bad',
      title: 'All cups tasted bad',
      content:
        'All cups tasted bad. Sorry to hear that. You might try different brewing method or coffee. Or maybe coffee is not for you.',
      isAutoAdvance: false,
    },
    {
      id: 'middle-range-check',
      title: 'Middle Range Check',
      content: 'Is the temperature range too narrow?',
      isAutoAdvance: true,
      outlets: [
        {
          id: 'middle-range-check-to-close-enough',
          to: 'close-enough',
          condition: '(highTemp - lowTemp) * 0.5 <= 3',
        },
        { id: 'middle-range-check-to-middle', to: 'middle' },
      ],
    },
    {
      id: 'middle',
      title: 'Middle',
      content:
        'Great choice! You preferred the **${midTemp}°C** cup.\n\n' +
        'Current range: ${lowTemp}°C to ${highTemp}°C (${highTemp - lowTemp}°C wide)\n\n' +
        'Since you chose the middle temperature, we can narrow the range around this sweet spot. Would you like to continue refining?',
      isAutoAdvance: false,
      outlets: [
        {
          id: 'middle-to-narrow-down',
          to: 'middle-narrow-down',
          label: "Yes. Let's narrow down",
          condition: '(highTemp - lowTemp) * 0.5 > 3',
        },
        {
          id: 'middle-to-satisfied',
          to: 'satisfied',
          label: 'No. I already satisfied',
        },
      ],
    },
    {
      id: 'middle-narrow-down',
      title: 'Narrow down',
      content:
        'Narrowing the range around your preferred ${midTemp}°C...\n\n' +
        'New range will be: ${lowTemp}°C to ${highTemp}°C',
      actions: [
        {
          type: 'set',
          target: 'highTemp',
          expression: '(midTemp + highTemp) * 0.5',
        },
        {
          type: 'set',
          target: 'lowTemp',
          expression: '(midTemp + lowTemp) * 0.5',
        },
        {
          type: 'set',
          target: 'midTemp',
          expression: '(highTemp + lowTemp) * 0.5',
        },
        {
          type: 'set',
          target: 'iteration',
          expression: 'iteration + 1',
        },
      ],
      outlets: [{ id: 'middle-narrow-down-to-brewing', to: 'brewing' }],
      isAutoAdvance: false,
    },
    {
      id: 'satisfied',
      title: 'Satisfied',
      content:
        "Excellent! You've found your perfect brewing temperature: **${bestTemp}°C**.\n\n" +
        'This temperature represents your personal preference after ${iteration} iteration${iteration == 1 ? "" : "s"} of systematic tasting. Enjoy your perfectly brewed coffee!',
      isAutoAdvance: false,
    },
    {
      id: 'upper-range-check',
      title: 'Upper Range Check',
      content:
        "Checking if we've narrowed down enough... Current range: ${highTemp - lowTemp}°C",
      isAutoAdvance: true,
      outlets: [
        {
          id: 'upper-range-check-to-close-enough',
          to: 'close-enough',
          condition: '(highTemp - lowTemp) * 0.5 <= 3',
        },
        { id: 'upper-range-check-to-upper', to: 'upper' },
      ],
    },
    {
      id: 'upper',
      title: 'Upper',
      content:
        'Excellent! You preferred the **${highTemp}°C** cup - you like it hot!\n\n' +
        'Current range: ${lowTemp}°C to ${highTemp}°C (${highTemp - lowTemp}°C wide)\n\n' +
        "We'll focus on the upper half of this range. Ready to narrow it down further?",
      isAutoAdvance: false,
      outlets: [
        {
          id: 'upper-to-upper-narrow-down',
          to: 'upper-narrow-down',
          condition: '(highTemp - lowTemp) * 0.5 > 3',
          label: "Let's narrow down the range",
        },
        {
          id: 'upper-to-satisfied',
          to: 'satisfied',
          label: 'I already satisfied',
        },
      ],
    },
    {
      id: 'upper-narrow-down',
      title: 'Upper Narrow Down',
      content:
        'Adjusting range to focus on higher temperatures...\n\n' +
        'New range: ${lowTemp}°C to ${highTemp}°C\n' +
        'New middle point: ${midTemp}°C',
      actions: [
        { type: 'set', target: 'lowTemp', expression: 'midTemp' },
        {
          type: 'set',
          target: 'midTemp',
          expression: '(highTemp + lowTemp) * 0.5',
        },
        {
          type: 'set',
          target: 'iteration',
          expression: 'iteration + 1',
        },
      ],
      outlets: [{ id: 'upper-narrow-down-to-brewing', to: 'brewing' }],
      isAutoAdvance: false,
    },
    {
      id: 'lower-range-check',
      title: 'Lower Range Check',
      content:
        "Checking if we've narrowed down enough... Current range: ${highTemp - lowTemp}°C",
      isAutoAdvance: true,
      outlets: [
        {
          id: 'lower-range-check-to-close-enough',
          to: 'close-enough',
          condition: '(highTemp - lowTemp) * 0.5 <= 3',
        },
        { id: 'lower-range-check-to-lower', to: 'lower' },
      ],
    },
    {
      id: 'lower',
      title: 'Lower',
      content:
        'Interesting! You preferred the **${lowTemp}°C** cup - you enjoy cooler brewing temperatures.\n\n' +
        'Current range: ${lowTemp}°C to ${highTemp}°C (${highTemp - lowTemp}°C wide)\n\n' +
        "We'll focus on the lower half of this range. Shall we continue narrowing it down?",
      isAutoAdvance: false,
      outlets: [
        {
          id: 'lower-to-lower-narrow-down',
          to: 'lower-narrow-down',
          label: "Let's narrow down",
          condition: '(highTemp - lowTemp) * 0.5 > 3',
        },
        {
          id: 'lower-to-satisfied',
          to: 'satisfied',
          label: 'I already satisfied',
        },
      ],
    },
    {
      id: 'lower-narrow-down',
      title: 'Lower Narrow Down',
      content:
        'Adjusting range to focus on lower temperatures...\n\n' +
        'New range: ${lowTemp}°C to ${highTemp}°C\n' +
        'New middle point: ${midTemp}°C',
      actions: [
        { type: 'set', target: 'highTemp', expression: 'midTemp' },
        {
          type: 'set',
          target: 'midTemp',
          expression: '(highTemp + lowTemp) * 0.5',
        },
        {
          type: 'set',
          target: 'iteration',
          expression: 'iteration + 1',
        },
      ],
      outlets: [{ id: 'lower-narrow-down-to-brewing', to: 'brewing' }],
      isAutoAdvance: false,
    },
  ],
};
