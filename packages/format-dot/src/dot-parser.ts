import { ZFFlow, ZFNode } from '@zflo/core';
import { FormatParser } from '@zflo/api-format';
import {
  ASTBaseParentNode,
  AttributeASTNode,
  ClusterStatementASTNode,
  DotASTNode,
  EdgeASTNode,
  GraphASTNode,
  parse as parseAst,
  StatementASTNode,
  SubgraphASTNode,
} from '@ts-graphviz/ast';

/**
 * DOT (Graphviz) parser focused on loading directed graphs (digraph).
 * Uses @ts-graphviz/ast to parse DOT and traverses the AST to extract nodes and edges.
 */
export class DotParser implements FormatParser<Record<string, unknown>> {
  parse(dot: string, _options?: Record<string, unknown>): ZFFlow {
    // Parse DOT into AST (throws on invalid)
    let ast: DotASTNode;
    try {
      ast = parseAst(dot);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown parse error';
      throw new Error(`Failed to parse DOT: ${msg}`);
    }

    // Traverse AST to collect nodes, edges, and graph label
    const { nodes, edgesOrder, graphLabel } = this.collectFromAst(ast);

    // Build ZFlo nodes
    const zfloNodes: ZFNode[] = Array.from(nodes.values()).map((n) => ({
      id: n.id,
      title: n.label
        ? this.sanitizeNodeText(n.label)
        : this.formatNodeTitle(n.id),
      content: n.label
        ? this.sanitizeNodeText(n.label)
        : this.formatNodeTitle(n.id),
      isAutoAdvance: false,
    }));

    // Attach paths
    for (const e of edgesOrder) {
      const from = nodes.get(e.from);
      const to = nodes.get(e.to);
      if (!from || !to) continue;
      const node = zfloNodes.find((nn) => nn.id === from.id);
      if (!node) continue;
      if (!node.outlets) node.outlets = [];
      node.outlets.push({
        id: `${e.from}-${e.to}-${node.outlets.length}`,
        to: e.to,
        label: e.label,
      });
    }

    // Choose start node: first with no incoming else first listed
    const startNodeId = this.pickStartNode(zfloNodes);

    return {
      id: 'dot-digraph',
      title: graphLabel ? this.sanitizeNodeText(graphLabel) : 'DOT Digraph',
      nodes: zfloNodes,
      startNodeId,
      globalState: {},
      metadata: { source: 'dot' },
    };
  }

  private collectFromAst(ast: DotASTNode): {
    nodes: Map<string, { id: string; label?: string }>;
    edgesOrder: Array<{ from: string; to: string; label?: string }>;
    graphLabel?: string;
  } {
    const nodes = new Map<string, { id: string; label?: string }>();
    const edgesOrder: Array<{ from: string; to: string; label?: string }> = [];

    // Find root graph-like node
    const graph = this.findGraphNode(ast);
    if (!graph) return { nodes, edgesOrder };
    const graphLabel = this.readLabelAttribute(graph);

    // Traverse statements recursively (subgraphs included)
    const stack: ClusterStatementASTNode[] = [];
    const stmts = this.getStatements(graph);
    if (stmts) stack.push(...stmts);

    while (stack.length) {
      const stmt = stack.pop();
      if (!stmt || typeof stmt !== 'object') continue;

      if (stmt.type === 'Subgraph') {
        // Subgraph or Graph: dive into its statements
        const inner = this.getStatements(stmt);
        if (inner && Array.isArray(inner)) {
          for (const s of inner) stack.push(s);
        }
      }

      // NodeStatement
      if (stmt.type === 'Node') {
        const id = stmt.id;
        if (id) {
          const label = this.readLabelAttribute(stmt);
          const prev = nodes.get(id.value);
          if (!prev || (label && !prev.label))
            nodes.set(id.value, { id: id.value, label });
        }
        continue;
      }

      // EdgeStatement (including chains)
      if (stmt.type === 'Edge') {
        const targets = this.readEdgeTargets(stmt);
        const label = this.readLabelAttribute(stmt);
        for (let i = 0; i < targets.length - 1; i++) {
          const from = targets[i];
          const to = targets[i + 1];
          if (!from || !to) continue;
          if (!nodes.has(from)) nodes.set(from, { id: from });
          if (!nodes.has(to)) nodes.set(to, { id: to });
          edgesOrder.push({ from, to, label });
        }
        continue;
      }
    }

    return { nodes, edgesOrder, graphLabel };
  }

  private findGraphNode(ast: DotASTNode): GraphASTNode | undefined {
    if (!ast || typeof ast !== 'object') return undefined;
    // Direct graph node
    if (typeof ast.type === 'string' && /graph/i.test(ast.type)) {
      return ast as unknown as GraphASTNode;
    }
    // ts-graphviz/ast v3: Root is { type: 'Dot', children: [ { type: 'Graph', ... } ] }
    const children = Array.isArray(ast.children) ? ast.children : undefined;
    if (children) {
      const g = children.find(
        (c: StatementASTNode) =>
          typeof c?.type === 'string' && /graph/i.test(c.type)
      );
      if (g) return g as GraphASTNode;
    }
    return ast as unknown as GraphASTNode;
  }

  private getStatements(
    node: GraphASTNode | SubgraphASTNode
  ): ClusterStatementASTNode[] | undefined {
    if (!node || typeof node !== 'object') return undefined;
    if (Array.isArray(node.children)) return node.children;
    return undefined;
  }

  private readEdgeTargets(stmt: EdgeASTNode): string[] {
    const [from, to, ...rest] = Array.isArray(stmt.targets) ? stmt.targets : [];
    const ids: string[] = [];
    const allTargets = [from, to, ...rest];
    for (const target of allTargets) {
      if (!target) continue;
      const nodeId = target?.type === 'NodeRef' ? target?.id.value : undefined;
      if (nodeId) ids.push(nodeId);
    }
    return ids;
  }

  private readLabelAttribute(stmt: ASTBaseParentNode): string | undefined {
    for (const c of stmt.children ?? []) {
      if (c.type === 'Attribute') {
        const attr = c as AttributeASTNode;
        const key = attr.key?.value ?? attr.key;
        const value = attr.value?.value ?? attr.value;
        if (typeof key === 'string' && key === 'label') {
          return value;
        }
      }
    }
    return undefined;
  }

  private pickStartNode(nodes: ZFNode[]): string {
    const idsWithIncoming = new Set<string>();
    for (const n of nodes)
      for (const p of n.outlets ?? []) idsWithIncoming.add(p.to);
    const candidates = nodes.filter(
      (n) => !idsWithIncoming.has(n.id) && (n.outlets?.length ?? 0) > 0
    );
    return candidates[0]?.id ?? nodes[0]?.id ?? '';
  }

  private sanitizeNodeText(text: string): string {
    return text.replace(/\\n/g, '\n');
  }

  private formatNodeTitle(id: string): string {
    return id
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\\\\/g, '\\')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }
}
