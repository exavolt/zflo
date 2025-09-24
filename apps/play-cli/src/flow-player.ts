import {
  FlowEngine,
  type FlowDefinition,
  type RuntimeNode,
  type RuntimeChoice,
} from '@zflo/core';
import chalk from 'chalk';
import inquirer from 'inquirer';

export interface FlowPlayerOptions {
  verbose?: boolean;
  useColor?: boolean;
}

export class FlowPlayer {
  private engine: FlowEngine;
  private options: FlowPlayerOptions;

  constructor(flow: FlowDefinition, options: FlowPlayerOptions = {}) {
    this.engine = new FlowEngine(flow);
    this.options = {
      verbose: false,
      useColor: true,
      ...options,
    };
  }

  async start(): Promise<void> {
    this.printHeader();

    try {
      await this.engine.start();
      await this.gameLoop();
    } catch (error) {
      this.printError(
        `Failed to start flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      process.exit(1);
    }
  }

  private async gameLoop(): Promise<void> {
    while (true) {
      const currentContext = this.engine.getCurrentContext();
      const currentNode = currentContext?.currentNode;
      const choices = currentContext?.availableChoices || [];

      if (!currentNode) {
        this.printError('No current node found');
        break;
      }

      // Display current node content
      this.displayNode(currentNode);

      if (this.engine.isComplete()) {
        break;
      }

      // Handle choices or auto-advance
      if (choices.length === 0) {
        // No choices available - try to advance automatically
        try {
          await this.engine.next();
          await this.sleep(1000); // Brief pause for readability
        } catch (error) {
          this.printInfo('Flow completed - no more choices available.');
          break;
        }
      } else if (choices.length === 1) {
        // Single choice - auto-select or prompt based on node type
        // For decision nodes, always prompt
        const selectedChoice = await this.promptForChoice(choices);
        if (selectedChoice) {
          await this.engine.next(selectedChoice.outletId);
        } else {
          this.printInfo('Exiting...');
          break;
        }
      } else {
        // Multiple choices - let user select
        const selectedChoice = await this.promptForChoice(choices);
        if (selectedChoice) {
          await this.engine.next(selectedChoice.outletId);
        } else {
          this.printInfo('Exiting...');
          break;
        }
      }

      // Add spacing between nodes
      console.log();
    }

    this.printCompletion();
  }

  private displayNode(node: RuntimeNode): void {
    const { useColor } = this.options;

    // Node title
    if (node.definition.title) {
      const title = useColor
        ? chalk.bold.cyan(node.definition.title)
        : node.definition.title;
      console.log(`\n${title}`);
      console.log(
        useColor
          ? chalk.gray('─'.repeat(node.definition.title.length))
          : '─'.repeat(node.definition.title.length)
      );
    }

    // Node content
    if (node.definition.content) {
      const content = this.processContent(node.definition.content);
      console.log(`\n${content}`);
    }

    // Show current state if verbose
    if (this.options.verbose) {
      const currentState = this.engine.getState();
      if (Object.keys(currentState).length > 0) {
        console.log();
        this.printCurrentState(currentState);
      }
    }
  }

  private async promptForChoice(
    choices: RuntimeChoice[]
  ): Promise<RuntimeChoice | null> {
    const { useColor } = this.options;

    // Format choices for inquirer
    const choiceOptions: Array<{
      name: string;
      value: RuntimeChoice | null;
      short: string;
    }> = choices.map((choice, index) => ({
      name: `${index + 1}. ${choice.label}`,
      value: choice,
      short: choice.label,
    }));

    // Add exit option
    choiceOptions.push({
      name: useColor ? chalk.red('Exit') : 'Exit',
      value: null,
      short: 'Exit',
    });

    try {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: useColor
            ? chalk.yellow('Choose an option:')
            : 'Choose an option:',
          choices: choiceOptions,
          pageSize: 10,
        },
      ]);

      return answer.choice;
    } catch (error) {
      // Handle Ctrl+C gracefully
      console.log('\n');
      this.printInfo('Goodbye!');
      return null;
    }
  }

  private processContent(content: string): string {
    // TODO: interpolation/templating
    // Process any content interpolation or formatting
    // For now, just return as-is, but could add markdown rendering, etc.
    return content;
  }

  private printHeader(): void {
    const { useColor } = this.options;
    const title = 'ZFlo Flow Player';
    const subtitle =
      'Use arrow keys to navigate, Enter to select, Ctrl+C to exit';

    console.log();
    if (useColor) {
      console.log(chalk.bold.blue(title));
      console.log(chalk.gray(subtitle));
    } else {
      console.log(title);
      console.log(subtitle);
    }
    console.log();
  }

  private printCompletion(): void {
    const { useColor } = this.options;
    const message = 'Flow completed!';

    console.log();
    if (useColor) {
      console.log(chalk.bold.green(message));
    } else {
      console.log(message);
    }

    // Show final state if verbose
    if (this.options.verbose) {
      const finalState = this.engine.getState();
      if (Object.keys(finalState).length > 0) {
        console.log();
        this.printFinalState(finalState);
      }
    }
  }

  private printCurrentState(state: Record<string, any>): void {
    const { useColor } = this.options;

    if (useColor) {
      console.log(chalk.dim('Current state:'));
    } else {
      console.log('Current state:');
    }

    for (const [key, value] of Object.entries(state)) {
      const formattedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (useColor) {
        console.log(chalk.dim(`  ${key}: ${formattedValue}`));
      } else {
        console.log(`  ${key}: ${formattedValue}`);
      }
    }
  }

  private printFinalState(state: Record<string, any>): void {
    const { useColor } = this.options;

    if (useColor) {
      console.log(chalk.bold('Final State:'));
    } else {
      console.log('Final State:');
    }

    for (const [key, value] of Object.entries(state)) {
      const formattedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (useColor) {
        console.log(chalk.cyan(`  ${key}: ${formattedValue}`));
      } else {
        console.log(`  ${key}: ${formattedValue}`);
      }
    }
  }

  private printInfo(message: string): void {
    const { useColor } = this.options;
    if (useColor) {
      console.log(chalk.blue(`ℹ ${message}`));
    } else {
      console.log(`Info: ${message}`);
    }
  }

  private printError(message: string): void {
    const { useColor } = this.options;
    if (useColor) {
      console.error(chalk.red(`✗ ${message}`));
    } else {
      console.error(`Error: ${message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
