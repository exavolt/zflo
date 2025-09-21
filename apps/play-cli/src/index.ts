#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import chalk from 'chalk';
import { FlowPlayer } from './flow-player.js';
import type { ZFFlow } from '@zflo/core';

const program = new Command();

program
  .name('zflo-play')
  .description('Play ZFlo flows in the terminal')
  .version('0.1.0')
  .argument('<flow-file>', 'Path to the ZFlo flow JSON file')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output')
  .action(async (flowFile: string, options) => {
    try {
      // Resolve and read the flow file
      const filePath = resolve(flowFile);
      const fileContent = readFileSync(filePath, 'utf-8');
      const flow: ZFFlow = JSON.parse(fileContent);

      // Validate basic flow structure
      if (
        !flow.nodes ||
        !Array.isArray(flow.nodes) ||
        flow.nodes.length === 0
      ) {
        console.error(chalk.red('Error: Invalid flow file - no nodes found'));
        process.exit(1);
      }

      // Create and start the flow player
      const player = new FlowPlayer(flow, {
        verbose: options.verbose,
        useColor: options.color !== false,
      });

      await player.start();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          console.error(chalk.red(`Error: Flow file not found: ${flowFile}`));
        } else if (error.message.includes('JSON')) {
          console.error(
            chalk.red(`Error: Invalid JSON in flow file: ${flowFile}`)
          );
        } else {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      } else {
        console.error(chalk.red('An unexpected error occurred'));
      }
      process.exit(1);
    }
  });

program.parse();
