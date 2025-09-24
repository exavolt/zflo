//

import {
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from '../types/analysis-types';
import { NodeType, FlowDefinition } from '../types/flow-types';
import { FlowGraphUtils } from '../utils/graph-utils';
import { inferNodeTypes } from '../utils/infer-node-types';
import { FlowValidator } from './flow-validator';
import {
  PathSummary,
  PathTester,
  PathTestPointOfInterest,
  PathTestResult,
} from './path-tester';

export interface AnalysisInsight {
  type: 'info' | 'warning' | 'error' | 'suggestion';
  category: 'structure' | 'paths' | 'content' | 'performance' | 'usability';
  title: string;
  description: string;
  nodeId?: string;
  pathExample?: string[];
  actionable?: boolean;
  suggestion?: string;
}

export interface FlowAnalysis {
  isValid: boolean;
  score: number; // 0-100 quality score
  insights: AnalysisInsight[];

  // Structure metrics
  structure: {
    totalNodes: number;
    decisionNodes: number;
    endNodes: number;
    startNodes: number;
    averageChoicesPerDecision: number;
    maxDepth: number;
    branchingFactor: number;
  };

  // Path metrics
  paths: {
    totalPaths: number;
    completedPaths: number;
    averagePathLength: number;
    shortestPath: number;
    longestPath: number;
    unreachableNodes: number;
    loops: number;
  };

  // Content quality
  content: {
    averageNodeTextLength: number;
    emptyNodes: number;
    duplicateContent: number;
    clarityScore: number; // 0-100
  };

  // User experience
  userExperience: {
    replayability: number; // 0-100
    engagement: number; // 0-100
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedPlayTime: string;
  };
}

interface AnalysisContext {
  flow: FlowDefinition;
  nodeTypes: Record<string, NodeType>;
  insights: AnalysisInsight[];
  graphUtils: FlowGraphUtils;
}

export class FlowAnalyzer {
  private validator: FlowValidator;
  private pathTester?: PathTester;

  constructor() {
    this.validator = new FlowValidator();
  }

  async analyze(flow: FlowDefinition): Promise<FlowAnalysis> {
    const insights: AnalysisInsight[] = [];
    const nodeTypes = inferNodeTypes(flow.nodes);
    const graphUtils = new FlowGraphUtils(flow);
    const context: AnalysisContext = {
      flow,
      nodeTypes,
      insights,
      graphUtils,
    };

    // Basic validation
    const validationResult = this.validator.validate(flow);

    // Path testing
    this.pathTester = new PathTester(flow, 1000, 100);
    const pathResult = await this.pathTester.testAllPaths();

    // Detailed node analysis first
    this.analyzeNodesInDetail(context);

    // Structure analysis
    const structure = this.analyzeStructure(context);

    // Path analysis
    const paths = this.analyzePaths(pathResult, context.insights);

    // Content analysis
    const content = this.analyzeContent(context.flow, context.insights);

    // User experience analysis
    const userExperience = this.analyzeUserExperience(
      structure,
      paths,
      context.insights
    );

    // Add validation insights
    this.addValidationInsights(validationResult, context.insights);

    // Calculate overall score
    const score = this.calculateScore(
      structure,
      paths,
      content,
      userExperience,
      context.insights
    );

    return {
      isValid: validationResult.isValid,
      score,
      insights: context.insights.sort(
        (a, b) => this.getInsightPriority(a) - this.getInsightPriority(b)
      ),
      structure,
      paths,
      content,
      userExperience,
    };
  }

  private analyzeNodesInDetail(context: AnalysisContext) {
    const nodes = context.flow.nodes;

    nodes.forEach((node) => {
      // Check for empty or very short content
      const content = node.content || node.title || '';
      if (content.trim().length === 0) {
        context.insights.push({
          type: 'error',
          category: 'content',
          title: 'Empty Node Content',
          description: `Node "${node.id}" has no content. Users won't know what this step represents.`,
          nodeId: node.id,
          actionable: true,
          suggestion: `Add descriptive text like: "${this.generateSampleContent(context.nodeTypes[node.id] || 'activity')}"`,
        });
      } else if (content.trim().length < 10) {
        context.insights.push({
          type: 'warning',
          category: 'content',
          title: 'Very Brief Content',
          description: `Node "${node.id}" has only ${content.trim().length} characters: "${content.trim()}"`,
          nodeId: node.id,
          actionable: true,
          suggestion: `Expand to something like: "${this.expandContent(content.trim(), context.nodeTypes[node.id] || 'activity')}"`,
        });
      }

      // Check decision nodes without proper choices
      if (context.nodeTypes[node.id] === 'decision') {
        if (!node.outlets || node.outlets.length < 2) {
          context.insights.push({
            type: 'error',
            category: 'structure',
            title: 'Decision Node Needs Choices',
            description: `Decision node "${node.id}" should have at least 2 choice paths.`,
            nodeId: node.id,
            actionable: true,
            suggestion:
              'Add more paths with labels like "Yes" and "No" or "Option A" and "Option B"',
          });
        } else if (
          node.outlets.some(
            (path) => !path.label || path.label.trim().length === 0
          )
        ) {
          const unlabeledPaths = node.outlets.filter(
            (path) => !path.label || path.label.trim().length === 0
          );
          context.insights.push({
            type: 'warning',
            category: 'usability',
            title: 'Unlabeled Choice Paths',
            description: `Decision node "${node.id}" has ${unlabeledPaths.length} paths without clear labels.`,
            nodeId: node.id,
            actionable: true,
            suggestion:
              'Add descriptive labels like "Accept the offer", "Decline politely", "Ask for more time"',
          });
        }
      }

      // Check for nodes that might be unreachable using shared graph utilities
      const isReachable = context.graphUtils.isNodeReachable(node.id);
      if (!isReachable && node.id !== context.flow.startNodeId) {
        context.insights.push({
          type: 'error',
          category: 'structure',
          title: 'Unreachable Node',
          description: `Node "${node.id}" cannot be reached from the start node.`,
          nodeId: node.id,
          actionable: true,
          suggestion:
            'Connect this node to the flow by adding a path from another node, or remove it if not needed.',
        });
      }

      // Check for dead-end nodes (except end nodes)
      if (
        context.nodeTypes[node.id] !== 'end' &&
        (!node.outlets || node.outlets.length === 0)
      ) {
        context.insights.push({
          type: 'warning',
          category: 'structure',
          title: 'Dead-End Node',
          description: `Node "${node.id}" doesn't lead anywhere. Users will get stuck here.`,
          nodeId: node.id,
          actionable: true,
          suggestion:
            'Add a path to continue the story, or change this to an end node if it should conclude the flow.',
        });
      }
    });

    // Check for duplicate content across nodes
    const contentMap = new Map<string, string[]>();
    nodes.forEach((node) => {
      const content = (node.content || node.title || '').trim().toLowerCase();
      if (content && content.length > 5) {
        if (!contentMap.has(content)) {
          contentMap.set(content, []);
        }
        contentMap.get(content)?.push(node.id);
      }
    });

    contentMap.forEach((nodeIds, content) => {
      if (nodeIds.length > 1) {
        context.insights.push({
          type: 'info',
          category: 'content',
          title: 'Duplicate Content Found',
          description: `Nodes ${nodeIds.join(', ')} have identical content: "${content.substring(0, 50)}..."`,
          actionable: true,
          suggestion:
            'Make each node unique by adding different details, context, or outcomes.',
        });
      }
    });
  }

  private generateSampleContent(nodeType: string): string {
    switch (nodeType) {
      case 'start':
        return 'Welcome! Your adventure begins here...';
      case 'decision':
        return 'You face a choice. What do you decide?';
      case 'action':
        return 'Something important happens in your story...';
      case 'end':
        return 'Your journey concludes. Well done!';
      default:
        return 'Describe what happens at this point in your story...';
    }
  }

  private expandContent(content: string, nodeType: string): string {
    const expanded = {
      start: `${content} - Begin your journey and discover what awaits you.`,
      decision: `${content} - Consider your options carefully. Each choice leads to a different outcome.`,
      action: `${content} - This moment shapes your path forward. What happens next depends on your previous choices.`,
      end: `${content} - Your adventure concludes here. Reflect on the journey you've taken.`,
    };
    return (
      expanded[nodeType as keyof typeof expanded] ||
      `${content} - Add more detail about what happens, how it feels, or what the user should consider.`
    );
  }

  private analyzeStructure(context: AnalysisContext): StructureAnalysis {
    const nodes = context.flow.nodes;
    const nodeTypes = context.nodeTypes;
    const decisionNodes = nodes.filter((n) => nodeTypes[n.id] === 'decision');
    const endNodes = nodes.filter((n) => nodeTypes[n.id] === 'end');
    const startNodes = nodes.filter((n) => n.id === context.flow.startNodeId);

    const totalChoices = decisionNodes.reduce(
      (sum, node) => sum + (node.outlets?.length || 0),
      0
    );
    const averageChoicesPerDecision =
      decisionNodes.length > 0 ? totalChoices / decisionNodes.length : 0;

    const maxDepth = context.graphUtils.calculateMaxDepth();
    const branchingFactor = this.calculateBranchingFactor(context);

    // Add structure insights with specific examples
    if (decisionNodes.length === 0) {
      context.insights.push({
        type: 'suggestion',
        category: 'structure',
        title: 'Add Interactive Choices',
        description:
          'Your flow is currently linear. Adding decision points makes it interactive.',
        actionable: true,
        suggestion:
          'Convert some action nodes to decision nodes. Example: Change "You find a door" to "You find a door {Open it|Walk away|Look for a key}"',
      });
    }

    if (endNodes.length === 1 && nodes.length > 3) {
      context.insights.push({
        type: 'suggestion',
        category: 'structure',
        title: 'Create Multiple Endings',
        description: `You have ${nodes.length} nodes but only 1 ending. Multiple endings encourage replay.`,
        actionable: true,
        suggestion:
          'Add 2-3 different ending nodes like "Victory!", "Defeat...", "Mysterious ending..." based on different paths.',
      });
    }

    if (decisionNodes.length > 0 && averageChoicesPerDecision < 2.5) {
      const poorDecisions = decisionNodes.filter(
        (n) => (n.outlets?.length || 0) < 3
      );
      if (poorDecisions.length > 0) {
        context.insights.push({
          type: 'suggestion',
          category: 'structure',
          title: 'Expand Decision Options',
          description: `${poorDecisions.length} decision nodes have limited choices. More options create richer experiences.`,
          actionable: true,
          suggestion: `Add a third option to decisions. Example: Instead of just "Yes|No", try "Yes|No|Ask for more information"`,
        });
      }
    }

    if (maxDepth > 12) {
      context.insights.push({
        type: 'info',
        category: 'usability',
        title: 'Long Story Paths',
        description: `Your longest path has ${maxDepth} steps. Consider if this feels too long for users.`,
        actionable: true,
        suggestion:
          'Add shortcuts or early endings for users who want quicker resolution, or break into chapters.',
      });
    }

    return {
      totalNodes: nodes.length,
      decisionNodes: decisionNodes.length,
      endNodes: endNodes.length,
      startNodes: startNodes.length,
      averageChoicesPerDecision:
        Math.round(averageChoicesPerDecision * 10) / 10,
      maxDepth,
      branchingFactor: Math.round(branchingFactor * 10) / 10,
    };
  }

  private analyzePaths(
    pathResult: PathTestResult,
    insights: AnalysisInsight[]
  ): PathAnalysis {
    const pathLengths = pathResult.pathSummary.map((p: PathSummary) => p.steps);
    const averagePathLength =
      pathLengths.length > 0
        ? pathLengths.reduce((sum: number, len: number) => sum + len, 0) /
          pathLengths.length
        : 0;

    const shortestPath = pathLengths.length > 0 ? Math.min(...pathLengths) : 0;
    const longestPath = pathLengths.length > 0 ? Math.max(...pathLengths) : 0;

    // Add specific path insights with examples
    pathResult.errors.forEach((error: PathTestPointOfInterest) => {
      if (error.path && error.path.length > 0) {
        insights.push({
          type: 'error',
          category: 'paths',
          title: `Broken Path: ${error.type}`,
          description: `Path breaks at: ${error.path.join(' → ')}`,
          pathExample: error.path,
          actionable: true,
          suggestion:
            error.type === 'missing_node'
              ? 'Add the missing node or fix the connection.'
              : 'Check that this path leads to a valid destination.',
        });
      }
    });

    if (pathResult.totalPaths < 3 && pathResult.totalPaths > 0) {
      insights.push({
        type: 'suggestion',
        category: 'paths',
        title: 'Add More Story Branches',
        description: `Only ${pathResult.totalPaths} possible paths through your story.`,
        actionable: true,
        suggestion:
          'Add decision nodes with 3+ choices each. Example: "What do you do? {Fight|Flee|Hide|Negotiate}"',
      });
    }

    if (shortestPath > 0 && longestPath > 0) {
      if (shortestPath < 3) {
        insights.push({
          type: 'warning',
          category: 'paths',
          title: 'Very Short Path Found',
          description: `Shortest path is only ${shortestPath} steps. Users might feel unsatisfied.`,
          actionable: true,
          suggestion:
            'Add more content or merge this with another path to create a richer experience.',
        });
      }

      if (longestPath - shortestPath > 8) {
        insights.push({
          type: 'info',
          category: 'paths',
          title: 'Unbalanced Path Lengths',
          description: `Path lengths vary from ${shortestPath} to ${longestPath} steps.`,
          actionable: true,
          suggestion:
            'Consider balancing by adding content to shorter paths or providing early exits for longer ones.',
        });
      }
    }

    return {
      totalPaths: pathResult.totalPaths,
      completedPaths: pathResult.completedPaths,
      averagePathLength: Math.round(averagePathLength * 10) / 10,
      shortestPath,
      longestPath,
      unreachableNodes: pathResult.errors.filter(
        (e: PathTestPointOfInterest) => e.type === 'unreachable_node'
      ).length,
      loops: pathResult.warnings.filter(
        (w: PathTestPointOfInterest) => w.type === 'infinite_loop'
      ).length,
    };
  }

  private analyzeContent(
    flow: FlowDefinition,
    insights: AnalysisInsight[]
  ): ContentAnalysis {
    const nodes = flow.nodes;
    const textLengths = nodes.map((n) => (n.content || n.title || '').length);
    const averageNodeTextLength =
      textLengths.reduce((sum, len) => sum + len, 0) / textLengths.length;

    const emptyNodes = nodes.filter(
      (n) => !(n.content || n.title || '').trim()
    ).length;

    // Check for duplicate content
    const contentMap = new Map<string, number>();
    nodes.forEach((node) => {
      const content = (node.content || node.title || '').trim().toLowerCase();
      if (content) {
        contentMap.set(content, (contentMap.get(content) || 0) + 1);
      }
    });
    const duplicateContent = Array.from(contentMap.values()).filter(
      (count) => count > 1
    ).length;

    // Calculate clarity score based on text length and readability
    const clarityScore = this.calculateClarityScore(textLengths);

    // Add content insights
    if (emptyNodes > 0) {
      insights.push({
        type: 'warning',
        category: 'content',
        title: 'Empty Nodes',
        description: `${emptyNodes} nodes have no content text.`,
        actionable: true,
        suggestion:
          'Add descriptive text to all nodes to improve user experience.',
      });
    }

    if (averageNodeTextLength < 10) {
      insights.push({
        type: 'suggestion',
        category: 'content',
        title: 'Brief Content',
        description: 'Consider adding more descriptive text to engage users.',
        actionable: true,
        suggestion: 'Expand node content with more detail and context.',
      });
    }

    if (duplicateContent > 0) {
      insights.push({
        type: 'info',
        category: 'content',
        title: 'Duplicate Content',
        description: `${duplicateContent} pieces of content are repeated.`,
        actionable: true,
        suggestion: 'Consider varying the text to avoid repetition.',
      });
    }

    return {
      averageNodeTextLength: Math.round(averageNodeTextLength * 10) / 10,
      emptyNodes,
      duplicateContent,
      clarityScore,
    };
  }

  private analyzeUserExperience(
    structure: StructureAnalysis,
    paths: PathAnalysis,
    insights: AnalysisInsight[]
  ): UserExperienceAnalysis {
    // Calculate replayability based on paths and endings
    const replayability = Math.min(
      100,
      structure.endNodes * 20 +
        paths.totalPaths * 5 +
        structure.decisionNodes * 10
    );

    // Calculate engagement based on choices and content
    const engagement = Math.min(
      100,
      structure.averageChoicesPerDecision * 25 +
        Math.min(paths.averagePathLength, 10) * 5 +
        structure.decisionNodes * 8
    );

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (structure.totalNodes > 15 || paths.totalPaths > 8) {
      complexity = 'complex';
    } else if (structure.totalNodes > 8 || paths.totalPaths > 4) {
      complexity = 'moderate';
    }

    // Estimate play time
    const estimatedMinutes = Math.ceil(paths.averagePathLength * 0.5); // ~30 seconds per node
    const estimatedPlayTime =
      estimatedMinutes < 2
        ? '1-2 minutes'
        : estimatedMinutes < 5
          ? '2-5 minutes'
          : estimatedMinutes < 10
            ? '5-10 minutes'
            : '10+ minutes';

    // Add UX insights
    if (replayability < 30) {
      insights.push({
        type: 'suggestion',
        category: 'usability',
        title: 'Low Replayability',
        description: 'Users might not want to replay this flow multiple times.',
        actionable: true,
        suggestion:
          'Add more decision points and multiple endings to encourage replay.',
      });
    }

    if (engagement < 40) {
      insights.push({
        type: 'suggestion',
        category: 'usability',
        title: 'Could Be More Engaging',
        description:
          'Consider adding more interactive elements and meaningful choices.',
        actionable: true,
        suggestion:
          'Increase the number of decision points and choice variety.',
      });
    }

    return {
      replayability: Math.round(replayability),
      engagement: Math.round(engagement),
      complexity,
      estimatedPlayTime,
    };
  }

  private addValidationInsights(
    validationResult: ValidationResult,
    insights: AnalysisInsight[]
  ) {
    validationResult.errors.forEach((error: ValidationError) => {
      insights.push({
        type: 'error',
        category: 'structure',
        title: error.type,
        description: error.message,
        nodeId: error.nodeId,
        actionable: true,
        suggestion:
          'Fix this structural issue to ensure proper flow operation.',
      });
    });

    validationResult.warnings.forEach((warning: ValidationWarning) => {
      insights.push({
        type: 'warning',
        category: 'structure',
        title: warning.type,
        description: warning.message,
        nodeId: warning.nodeId,
        actionable: true,
      });
    });
  }

  private calculateScore(
    structure: StructureAnalysis,
    paths: PathAnalysis,
    content: ContentAnalysis,
    ux: UserExperienceAnalysis,
    insights: AnalysisInsight[]
  ): number {
    let score = 100;

    // Deduct for errors and warnings
    const errors = insights.filter((i) => i.type === 'error').length;
    const warnings = insights.filter((i) => i.type === 'warning').length;

    score -= errors * 20;
    score -= warnings * 10;

    // Bonus for good structure
    if (structure.decisionNodes > 0) score += 10;
    if (structure.endNodes > 1) score += 10;
    if (structure.averageChoicesPerDecision >= 2) score += 5;

    // Bonus for good paths
    if (paths.totalPaths > 3) score += 10;
    if (paths.completedPaths === paths.totalPaths) score += 15;

    // Bonus for good content
    if (content.emptyNodes === 0) score += 10;
    if (content.clarityScore > 70) score += 5;

    // Bonus for good UX
    if (ux.replayability > 60) score += 10;
    if (ux.engagement > 60) score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateBranchingFactor(context: AnalysisContext): number {
    const nodeTypes = context.nodeTypes;
    const decisionNodes = context.flow.nodes.filter(
      (n) => nodeTypes[n.id] === 'decision'
    );
    if (decisionNodes.length === 0) return 1;

    const totalBranches = decisionNodes.reduce(
      (sum, node) => sum + (node.outlets?.length || 0),
      0
    );
    return totalBranches / decisionNodes.length;
  }

  private calculateClarityScore(textLengths: number[]): number {
    const avgLength =
      textLengths.reduce((sum, len) => sum + len, 0) / textLengths.length;

    // Ideal length is around 50-150 characters
    if (avgLength >= 50 && avgLength <= 150) return 100;
    if (avgLength >= 20 && avgLength <= 200) return 80;
    if (avgLength >= 10 && avgLength <= 300) return 60;
    return 40;
  }

  private getInsightPriority(insight: AnalysisInsight): number {
    const typePriority = { error: 1, warning: 2, suggestion: 3, info: 4 };
    const categoryPriority = {
      structure: 1,
      paths: 2,
      content: 3,
      usability: 4,
      performance: 5,
    };

    return typePriority[insight.type] * 10 + categoryPriority[insight.category];
  }
}

interface StructureAnalysis {
  totalNodes: number;
  decisionNodes: number;
  endNodes: number;
  startNodes: number;
  averageChoicesPerDecision: number;
  maxDepth: number;
  branchingFactor: number;
}

interface PathAnalysis {
  totalPaths: number;
  completedPaths: number;
  averagePathLength: number;
  shortestPath: number;
  longestPath: number;
  unreachableNodes: number;
  loops: number;
}

interface ContentAnalysis {
  averageNodeTextLength: number;
  emptyNodes: number;
  duplicateContent: number;
  clarityScore: number;
}

interface UserExperienceAnalysis {
  replayability: number;
  engagement: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedPlayTime: string;
}
