import { ZFFlow, ZFNode } from '@zflo/core';
import { FormatParser } from '@zflo/api-format';

interface PlantUMLNode {
  id: string;
  text: string;
  content?: string;
  type: 'start' | 'activity' | 'decision' | 'end';
}

interface PlantUMLEdge {
  from: string;
  to: string;
  label?: string;
  condition?: string;
}

interface PlantUMLAST {
  nodes: PlantUMLNode[];
  edges: PlantUMLEdge[];
  title?: string;
}

interface IfContext {
  conditionNode: string;
  thenBranch?: string;
  elseBranch?: string;
  thenNode?: string;
  elseNode?: string;
}

interface ParsingContext {
  currentNode: string | null;
  lastNode: string | null;
  ifStack: IfContext[];
  labels: Map<string, string>;
  gotoTargets: Array<{ from: string; target: string; label?: string }>;
  pendingLabels: string[];
  mergePoints: string[];
  finalEndNode: string | null;
  multilineActivity?: {
    nodeId: string;
    content: string;
    lines: string[];
  };
}

/**
 * PlantUML Activity diagram parser that converts PlantUML syntax to ZFlo format.
 * Supports standard PlantUML Activity diagram elements including start/stop,
 * activities, decision points, and conditional flows.
 */
export class PlantUMLParser implements FormatParser<Record<string, unknown>> {
  private nodeCounter = 0;

  parse(plantUMLCode: string, _options?: Record<string, unknown>): ZFFlow {
    try {
      // Validate basic PlantUML structure
      if (
        !plantUMLCode.trim().includes('@startuml') &&
        !plantUMLCode.trim().includes('start')
      ) {
        throw new Error(
          'Invalid PlantUML syntax: Missing @startuml or start directive'
        );
      }

      // Parse title and clean input
      const { title, cleanCode } = this.parseTitle(plantUMLCode);

      // Clean and prepare the input
      const lines = this.preprocessInput(cleanCode);

      // Parse to intermediate AST
      const ast = this.parseToAST(lines);

      // Convert AST to ZFlo format
      return this.convertToZFlo(ast, title);
    } catch (error) {
      throw new Error(
        `Failed to parse PlantUML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private parseTitle(plantUMLCode: string): {
    title?: string;
    cleanCode: string;
  } {
    const titleMatch = plantUMLCode.match(/title\s+(.+)/);
    const title =
      titleMatch && titleMatch[1] ? titleMatch[1].trim() : undefined;

    // Remove title line from code
    const cleanCode = plantUMLCode.replace(/title\s+.+\n?/g, '');

    return { title, cleanCode };
  }

  private preprocessInput(plantUMLCode: string): string[] {
    const lines = plantUMLCode
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('@') && !line.startsWith("'"));

    // Handle multiline activities
    const processedLines: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line) {
        i++;
        continue;
      }

      // Check if this is the start of a multiline activity
      if (line.startsWith(':') && !line.endsWith(';')) {
        let multilineActivity = line;
        i++;

        // Continue collecting lines until we find the closing semicolon
        while (i < lines.length && lines[i] && !lines[i]!.endsWith(';')) {
          multilineActivity += ' ' + lines[i];
          i++;
        }

        // Add the final line with semicolon
        if (i < lines.length && lines[i]) {
          multilineActivity += ' ' + lines[i];
        }

        processedLines.push(multilineActivity);
      } else {
        processedLines.push(line);
      }
      i++;
    }

    return processedLines;
  }

  private parseToAST(lines: string[]): PlantUMLAST {
    const nodes = new Map<string, PlantUMLNode>();
    const edges: PlantUMLEdge[] = [];
    const labels = new Map<string, string>();
    const gotoTargets: Array<{
      from: string;
      labelName: string;
      label?: string;
    }> = [];
    const pendingLabels: string[] = [];

    const context: ParsingContext = {
      currentNode: null,
      lastNode: null,
      ifStack: [],
      labels,
      gotoTargets: [],
      pendingLabels,
      mergePoints: [],
      finalEndNode: null,
    };

    for (const line of lines) {
      this.parseLine(
        line,
        nodes,
        edges,
        context,
        labels,
        gotoTargets,
        pendingLabels
      );
    }

    // Process goto statements after all labels are collected
    for (const gotoTarget of gotoTargets) {
      const targetNodeId = labels.get(gotoTarget.labelName);
      if (targetNodeId) {
        edges.push({
          from: gotoTarget.from,
          to: targetNodeId,
          label: gotoTarget.label,
        });
      }
    }

    return { nodes: Array.from(nodes.values()), edges };
  }

  private parseLine(
    line: string,
    nodes: Map<string, PlantUMLNode>,
    edges: PlantUMLEdge[],
    context: ParsingContext,
    labels: Map<string, string>,
    _gotoTargets: Array<{ from: string; labelName: string; label?: string }>,
    pendingLabels: string[]
  ): void {
    // Handle start
    const startMatch = line.match(/^start$/);
    if (startMatch) {
      const startNodeId = this.generateNodeId('start');
      nodes.set(startNodeId, {
        id: startNodeId,
        text: 'Start',
        type: 'start',
      });
      context.currentNode = startNodeId;
      context.lastNode = startNodeId;
      return;
    }

    // Handle stop/end
    const stopMatch = line.match(/^(stop|end)$/);
    if (stopMatch) {
      const endNodeId = this.generateNodeId('end');
      nodes.set(endNodeId, {
        id: endNodeId,
        text: 'End',
        type: 'end',
      });

      if (context.currentNode) {
        edges.push({
          from: context.currentNode,
          to: endNodeId,
        });
      }

      // Connect any pending merge points to this end node
      if (context.mergePoints.length > 0) {
        const uniqueMergePoints = [...new Set(context.mergePoints)];
        for (const mergePoint of uniqueMergePoints) {
          // Check if edge already exists to avoid duplicates
          const edgeExists = edges.some(
            (edge) => edge.from === mergePoint && edge.to === endNodeId
          );
          if (!edgeExists) {
            edges.push({
              from: mergePoint,
              to: endNodeId,
            });
          }
        }
        context.mergePoints.length = 0; // Clear merge points
      }

      context.currentNode = endNodeId;
      context.lastNode = endNodeId;
      return;
    }

    // Handle activity: :text;
    const activityMatch = line.match(/^:(.+);$/);
    if (activityMatch) {
      const text = activityMatch[1]?.trim();
      if (!text) return;
      const nodeId = this.generateNodeId('activity');

      nodes.set(nodeId, {
        id: nodeId,
        text,
        content: text,
        type: 'activity',
      });

      // Assign any pending labels to this node
      for (const labelName of pendingLabels) {
        labels.set(labelName, nodeId);
      }
      pendingLabels.length = 0; // Clear pending labels

      // Connect from previous node
      if (context.currentNode) {
        let edgeLabel = '';

        // Check if we're in an if context and need to add branch labels
        if (context.ifStack.length > 0) {
          const currentIf = context.ifStack[context.ifStack.length - 1];
          if (currentIf && context.currentNode === currentIf.conditionNode) {
            // First activity after if statement gets the "then" label
            if (!currentIf.thenNode) {
              edgeLabel = currentIf.thenBranch || '';
              currentIf.thenNode = nodeId;
            }
            // Activity after else statement gets the "else" label
            else if (currentIf.elseBranch && !currentIf.elseNode) {
              edgeLabel = currentIf.elseBranch;
              currentIf.elseNode = nodeId;
            }
          }
        } else {
          // If we're outside if contexts and current node is a decision node, don't connect
          const isDecisionNode = Array.from(nodes.values()).some(
            (n: PlantUMLNode) =>
              n.id === context.currentNode && n.text.endsWith('?')
          );
          if (isDecisionNode) {
            context.currentNode = null; // Clear decision node when outside if contexts
          }
        }

        if (context.currentNode) {
          edges.push({
            from: context.currentNode,
            to: nodeId,
            label: edgeLabel,
          });
        }
      }

      // Connect any pending merge points to this activity (only if not in an if context)
      if (context.mergePoints.length > 0 && context.ifStack.length === 0) {
        const uniqueMergePoints = [...new Set(context.mergePoints)];
        for (const mergePoint of uniqueMergePoints) {
          // Skip decision nodes as merge points
          const isDecisionNode = Array.from(nodes.values()).some(
            (n: PlantUMLNode) => n.id === mergePoint && n.text.endsWith('?')
          );
          if (!isDecisionNode) {
            // Check if edge already exists to avoid duplicates
            const edgeExists = edges.some(
              (edge) => edge.from === mergePoint && edge.to === nodeId
            );
            if (!edgeExists) {
              edges.push({
                from: mergePoint,
                to: nodeId,
              });
            }
          }
        }
        context.mergePoints.length = 0; // Clear merge points
      }

      context.currentNode = nodeId;
      context.lastNode = nodeId;
      return;
    }

    // Handle if statement: if (condition) then (label)
    const ifMatch = line.match(/^if\s*\((.+?)\)\s*then\s*\((.+?)\)$/);
    if (ifMatch) {
      const condition = ifMatch[1]?.trim();
      const thenLabel = ifMatch[2]?.trim();
      if (!condition || !thenLabel) return;

      const decisionNodeId = this.generateNodeId('decision');
      const questionText = condition;
      nodes.set(decisionNodeId, {
        id: decisionNodeId,
        text: questionText,
        content: questionText,
        type: 'decision',
      });

      if (context.currentNode) {
        let edgeLabel = '';

        // Check if we're in an else branch and need to add the else label
        if (context.ifStack.length > 0) {
          const currentIf = context.ifStack[context.ifStack.length - 1];
          if (
            currentIf &&
            context.currentNode === currentIf.conditionNode &&
            currentIf.elseBranch &&
            !currentIf.elseNode
          ) {
            edgeLabel = currentIf.elseBranch;
            currentIf.elseNode = decisionNodeId;
          }
        }

        edges.push({
          from: context.currentNode,
          to: decisionNodeId,
          label: edgeLabel,
        });
      }

      context.ifStack.push({
        conditionNode: decisionNodeId,
        thenBranch: thenLabel,
        elseBranch: undefined,
        thenNode: undefined,
        elseNode: undefined,
      });

      context.currentNode = decisionNodeId;
      return;
    }

    // Handle elseif statement: elseif (condition) then (label) or (no) elseif (condition) then (label)
    const elseifMatch = line.match(
      /^(?:\((.+?)\)\s+)?elseif\s*\((.+?)\)\s*then\s*\((.+?)\)$/
    );
    if (elseifMatch && context.ifStack.length > 0) {
      const noLabel = elseifMatch[1]?.trim();
      const condition = elseifMatch[2]?.trim();
      const thenLabel = elseifMatch[3]?.trim();
      if (!condition || !thenLabel) return;

      const currentIf = context.ifStack[context.ifStack.length - 1];
      if (currentIf) {
        // Mark that we've processed the then branch
        if (
          context.currentNode &&
          context.currentNode !== currentIf.conditionNode
        ) {
          currentIf.thenNode = context.currentNode;
        }

        // Set the else branch label for the current decision
        if (noLabel) {
          currentIf.elseBranch = noLabel;
        }
      }

      // Create new decision node for elseif condition
      const elseifNodeId = this.generateNodeId('decision');
      const questionText = condition;
      nodes.set(elseifNodeId, {
        id: elseifNodeId,
        text: questionText,
        content: questionText,
        type: 'decision',
      });

      // Connect from previous decision's "no" path
      if (currentIf) {
        edges.push({
          from: currentIf.conditionNode,
          to: elseifNodeId,
          label: currentIf.elseBranch || noLabel || 'no',
        });
      }

      // Push new if context for elseif
      context.ifStack.push({
        conditionNode: elseifNodeId,
        thenBranch: thenLabel,
        elseBranch: undefined,
        thenNode: undefined,
        elseNode: undefined,
      });

      context.currentNode = elseifNodeId;
      return;
    }

    // Handle else statement: else (label) or just else
    const elseMatch = line.match(/^else(?:\s*\((.+?)\))?$/);
    if (elseMatch && context.ifStack.length > 0) {
      const elseLabel = elseMatch[1]?.trim(); // No default label if none provided

      const currentIf = context.ifStack[context.ifStack.length - 1];
      if (currentIf) {
        currentIf.elseBranch = elseLabel;
        // Mark that we've processed the then branch
        if (
          context.currentNode &&
          context.currentNode !== currentIf.conditionNode
        ) {
          currentIf.thenNode = context.currentNode;
        }
        // Set current node back to decision for else branch
        context.currentNode = currentIf.conditionNode;
      }
      return;
    }

    // Handle endif statement
    const endifMatch = line.match(/^endif$/);
    if (endifMatch && context.ifStack.length > 0) {
      // Collect all merge points from all if/elseif branches
      const allMergePoints: string[] = [];

      // Pop all if contexts and collect their endpoints
      while (context.ifStack.length > 0) {
        const poppedIf = context.ifStack.pop();
        if (poppedIf) {
          // Mark that we've processed the current branch
          if (
            context.currentNode &&
            context.currentNode !== poppedIf.conditionNode
          ) {
            if (!poppedIf.thenNode) {
              poppedIf.thenNode = context.currentNode;
            } else if (!poppedIf.elseNode) {
              poppedIf.elseNode = context.currentNode;
            }
          }

          // Collect merge points from this if context (exclude decision nodes and 'PROCESSED' markers)
          if (poppedIf.thenNode && poppedIf.thenNode !== 'PROCESSED') {
            // Only add non-decision nodes as merge points
            const isDecisionNode = Array.from(nodes.values()).some(
              (n: PlantUMLNode) =>
                n.id === poppedIf.thenNode && n.text.endsWith('?')
            );
            if (!isDecisionNode) {
              allMergePoints.push(poppedIf.thenNode);
            }
          }
          if (poppedIf.elseNode && poppedIf.elseNode !== 'PROCESSED') {
            // Only add non-decision nodes as merge points
            const isDecisionNode = Array.from(nodes.values()).some(
              (n: PlantUMLNode) =>
                n.id === poppedIf.elseNode && n.text.endsWith('?')
            );
            if (!isDecisionNode) {
              allMergePoints.push(poppedIf.elseNode);
            }
          }
        }
      }

      context.mergePoints.push(...allMergePoints);
      context.currentNode = null; // Reset current node so next statement connects merge points
      return;
    }

    // Handle label statement: label labelName
    const labelMatch = line.match(/^label\s+(.+)$/);
    if (labelMatch) {
      const labelName = labelMatch[1]?.trim();
      if (labelName) {
        pendingLabels.push(labelName);
      }
      return;
    }

    // Handle goto statement: goto labelName
    const gotoMatch = line.match(/^goto\s+(.+)$/);
    if (gotoMatch) {
      const labelName = gotoMatch[1]?.trim();
      if (!labelName) return;

      // Check if we're in an if context and need to connect from the decision node
      if (context.ifStack.length > 0) {
        const currentIf = context.ifStack[context.ifStack.length - 1];
        if (currentIf) {
          // This goto is the "then" branch of the current if
          _gotoTargets.push({
            from: currentIf.conditionNode,
            labelName: labelName,
            label: currentIf.thenBranch || 'yes',
          });
          currentIf.thenNode = 'PROCESSED'; // Mark as processed
          return;
        }
      }

      // Fallback: connect from current node
      if (context.currentNode) {
        _gotoTargets.push({
          from: context.currentNode,
          labelName: labelName,
          label: undefined,
        });
      }
      return;
    }

    // Handle note or other directives (ignore for now)
    if (line.startsWith('note') || line.startsWith('floating')) {
      return;
    }
  }

  private generateNodeId(type: string): string {
    return `${type}_${++this.nodeCounter}`;
  }

  private convertToZFlo(ast: PlantUMLAST, title?: string): ZFFlow {
    const nodes: ZFNode[] = ast.nodes.map((node): ZFNode => {
      return {
        id: node.id,
        title: node.text,
        content: node.content || node.text,
        isAutoAdvance: false,
        outlets: ast.edges
          .filter((edge) => edge.from === node.id)
          .map((edge, index) => ({
            id: `${edge.from}-${edge.to}-${Date.now()}-${index}`,
            to: edge.to,
            label: edge.label || edge.condition,
          })),
      };
    });

    // Find start node
    const startNode = ast.nodes.find((node) => node.type === 'start');
    const startNodeId = startNode?.id || nodes[0]?.id || '';

    return {
      id: 'plantuml-activity',
      title: title || 'PlantUML Activity Diagram',
      nodes,
      startNodeId,
      globalState: {},
      metadata: {
        originalTitle: title,
        format: 'plantuml',
      },
    };
  }
}
