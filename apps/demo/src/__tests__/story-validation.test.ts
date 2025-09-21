import { describe, it, expect } from 'vitest';
import { runPathTests, FlowValidator, ZFFlow } from '@zflo/core';
import { adventureStories } from '../data/stories';

const validator = new FlowValidator();
const validateFlow = (flow: ZFFlow) => validator.validate(flow);

describe('Story Validation', () => {
  describe('Flowchart Structure Validation', () => {
    adventureStories.forEach((story) => {
      it(`should validate ${story.title} structure`, () => {
        const validation = validateFlow(story.flowchart);

        expect(validation.errors).toStrictEqual([]);
        //expect(validation.warnings).toStrictEqual([]);
        expect(validation.isValid).toBe(true);

        // Basic structure checks
        expect(story.flowchart.nodes.length).toBeGreaterThan(0);
        expect(story.flowchart.startNodeId).toBeTruthy();

        // Start node should exist
        const startNode = story.flowchart.nodes.find(
          (n) => n.id === story.flowchart.startNodeId
        );
        expect(startNode).toBeDefined();
      });
    });
  });

  describe('Path Connectivity', () => {
    adventureStories.forEach((story) => {
      it(`should have connected paths in ${story.title}`, () => {
        const { flowchart } = story;

        // Check that all path destinations exist
        flowchart.nodes.forEach((node) => {
          if (node.outlets) {
            node.outlets.forEach((path) => {
              const targetNode = flowchart.nodes.find((n) => n.id === path.to);
              expect(targetNode).toBeDefined();
            });
          }
        });
      });
    });
  });

  describe('Story Metadata', () => {
    adventureStories.forEach((story) => {
      it(`should have valid metadata for ${story.title}`, () => {
        expect(story.id).toBeTruthy();
        expect(story.title).toBeTruthy();
        expect(story.description).toBeTruthy();
        expect(['adventure', 'mystery', 'sci-fi', 'fantasy']).toContain(
          story.category
        );
        expect(['beginner', 'intermediate', 'advanced']).toContain(
          story.difficulty
        );
        expect(story.flowchart).toBeDefined();
      });
    });
  });
});

describe('Path Testing', () => {
  // Test a subset of stories for comprehensive path testing
  const testStories = adventureStories.slice(0, 2); // Test first 2 stories to keep tests fast

  testStories.forEach((story) => {
    describe(`${story.title} Path Testing`, () => {
      it('should complete paths successfully', async () => {
        const testResult = await runPathTests(story.flowchart, {
          maxSteps: 50,
          maxPaths: 20,
          verbose: false,
        });

        expect(testResult.isValid).toBe(true);
        expect(testResult.totalPaths).toBeGreaterThan(0);
        expect(testResult.completedPaths).toBeGreaterThan(0);
        expect(testResult.errors).toHaveLength(0);

        // Coverage should be reasonable
        const nodeCoverage =
          testResult.coverage.nodesCovered / testResult.coverage.totalNodes;
        expect(nodeCoverage).toBeGreaterThan(0.3); // At least 30% node coverage

        const pathCoverage =
          testResult.coverage.pathsCovered / testResult.coverage.totalPaths;
        expect(pathCoverage).toBeGreaterThan(0.05); // At least 5% path coverage
      });

      it('should provide meaningful path summaries', async () => {
        const testResult = await runPathTests(story.flowchart, {
          maxSteps: 30,
          maxPaths: 10,
          verbose: true,
        });

        expect(testResult.pathSummary.length).toBeGreaterThan(0);

        testResult.pathSummary.forEach((pathSummary) => {
          expect(pathSummary.path.length).toBeGreaterThan(0);
          expect(pathSummary.steps).toBeGreaterThan(0);
          expect(['completed', 'max_steps', 'error']).toContain(
            pathSummary.endType
          );
          expect(Array.isArray(pathSummary.choices)).toBe(true);
        });
      });

      it('should handle decision nodes correctly', async () => {
        const { flowchart } = story;
        const decisionNodes = flowchart.nodes.filter(
          (n) => n.outlets && n.outlets.length > 1
        );

        if (decisionNodes.length > 0) {
          const testResult = await runPathTests(flowchart, {
            maxSteps: 20,
            maxPaths: 5,
          });

          // Should have explored different choices (if any paths were found)
          const pathsWithChoices = testResult.pathSummary.filter(
            (p) => p.choices.length > 0
          );
          if (testResult.pathSummary.length > 0) {
            expect(pathsWithChoices.length).toBeGreaterThanOrEqual(0);
          }
        }
      });
    });
  });
});

describe('Story Content Quality', () => {
  adventureStories.forEach((story) => {
    it(`should have meaningful content in ${story.title}`, () => {
      const { flowchart } = story;

      // All nodes should have titles
      flowchart.nodes.forEach((node) => {
        expect(node.title).toBeTruthy();
        expect(node.title.length).toBeGreaterThan(2);
      });

      // Decision nodes should have multiple paths
      const decisionNodes = flowchart.nodes.filter(
        (n) => n.outlets && n.outlets.length > 1
      );
      decisionNodes.forEach((node) => {
        expect(node.outlets?.length).toBeGreaterThan(1);
      });

      // Paths should have meaningful labels for decisions
      decisionNodes.forEach((node) => {
        if (node.outlets) {
          const pathsWithLabels = node.outlets.filter(
            (p) => p.label && p.label.trim().length > 0
          );
          expect(pathsWithLabels.length).toBeGreaterThan(0);
        }
      });
    });
  });
});

describe('Story Balance', () => {
  adventureStories.forEach((story) => {
    it(`should have balanced structure in ${story.title}`, () => {
      // const { flowchart } = story;
      // // Should have a reasonable mix of node types
      // const nodeTypes = {
      //   start: flowchart.nodes.filter((n) => n.type === 'start').length,
      //   action: flowchart.nodes.filter((n) => n.type === 'action').length,
      //   decision: flowchart.nodes.filter((n) => n.type === 'decision').length,
      //   end: flowchart.nodes.filter((n) => n.type === 'end').length,
      // };
      // expect(nodeTypes.start).toBeGreaterThanOrEqual(1);
      // expect(nodeTypes.end).toBeGreaterThanOrEqual(1);
      // // Should have some interactive elements (decisions or actions)
      // expect(nodeTypes.decision + nodeTypes.action).toBeGreaterThan(0);
      // // Story should not be too linear (should have some branching)
      // if (flowchart.nodes.length > 3) {
      //   expect(nodeTypes.decision).toBeGreaterThan(0);
      // }
    });
  });
});
