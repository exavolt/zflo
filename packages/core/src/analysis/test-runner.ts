#!/usr/bin/env node

import { PathTester, PathTestResult } from './path-tester';
import { FlowValidator } from './flow-validator';
import { ZFFlow } from '../types/flow-types';
import { ValidationResult } from '../types/analysis-types';

/**
 * Simple test runner utility for ZFlo flows
 */
export async function runPathTests(
  flow: ZFFlow,
  options: {
    maxSteps?: number;
    maxPaths?: number;
    verbose?: boolean;
  } = {}
): Promise<PathTestResult> {
  const pathTester = new PathTester(
    flow,
    options.maxPaths || 1000,
    options.maxSteps || 100
  );

  console.log(`🧪 Testing flow: ${flow.title}`);
  console.log('━'.repeat(50));

  const startTime = Date.now();
  const result = await pathTester.testAllPaths();
  const duration = Date.now() - startTime;

  // Print summary
  console.log(`\n📊 Test Results (${duration}ms)`);
  console.log(`Status: ${result.isValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Total paths: ${result.totalPaths}`);
  console.log(`Completed paths: ${result.completedPaths}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  // Coverage
  const nodesCoverage = Math.round(
    (result.coverage.nodesCovered / result.coverage.totalNodes) * 100
  );
  const pathsCoverage = Math.round(
    (result.coverage.pathsCovered / result.coverage.totalPaths) * 100
  );
  console.log(`\n📈 Coverage`);
  console.log(
    `Nodes: ${result.coverage.nodesCovered}/${result.coverage.totalNodes} (${nodesCoverage}%)`
  );
  console.log(
    `Paths: ${result.coverage.pathsCovered}/${result.coverage.totalPaths} (${pathsCoverage}%)`
  );

  // Show errors
  if (result.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    for (const error of result.errors) {
      console.log(`  • ${error.type}: ${error.message}`);
      if (error.path && options.verbose) {
        console.log(`    Path: ${error.path.join(' → ')}`);
      }
    }
  }

  // Show warnings
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    for (const warning of result.warnings) {
      console.log(`  • ${warning.type}: ${warning.message}`);
      if (warning.path && options.verbose) {
        console.log(`    Path: ${warning.path.join(' → ')}`);
      }
    }
  }

  // Show uncovered nodes
  if (result.coverage.uncoveredNodes.length > 0) {
    console.log(`\n🔍 Uncovered Nodes:`);
    for (const nodeId of result.coverage.uncoveredNodes) {
      console.log(`  • ${nodeId}`);
    }
  }

  // Show sample paths if verbose
  if (options.verbose && result.pathSummary.length > 0) {
    console.log(`\n🛤️  Sample Paths:`);
    const samplePaths = result.pathSummary.slice(0, 5);
    for (const path of samplePaths) {
      console.log(
        `  • ${path.path.join(' → ')} (${path.steps} steps, ${path.endType})`
      );
    }
    if (result.pathSummary.length > 5) {
      console.log(`  ... and ${result.pathSummary.length - 5} more paths`);
    }
  }

  console.log('\n' + '━'.repeat(50));

  return result;
}

/**
 * Quick validation function for a single flow
 */
export function validateFlow(flow: ZFFlow): ValidationResult {
  const validator = new FlowValidator();
  return validator.validate(flow);
}
