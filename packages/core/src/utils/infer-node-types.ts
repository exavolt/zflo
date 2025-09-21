import { ZFNode, NodeType } from '../types/flow-types';

export function inferNodeTypes(nodes: ZFNode[]): Record<string, NodeType> {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  for (const n of nodes) {
    outgoing.set(n.id, n.outlets?.length ?? 0);
    for (const p of n.outlets ?? []) {
      incoming.set(p.to, (incoming.get(p.to) ?? 0) + 1);
    }
  }

  const typeMap: Record<string, NodeType> = {};

  for (const n of nodes) {
    const out = outgoing.get(n.id) ?? 0;
    const inc = incoming.get(n.id) ?? 0;
    if (out === 0 && inc === 0) {
      typeMap[n.id] = 'isolated';
    } else if (!inc && out > 0) {
      typeMap[n.id] = 'start';
    } else if (out === 0 && inc > 0) {
      typeMap[n.id] = 'end';
    } else if (out > 1) {
      typeMap[n.id] = 'decision';
    } else {
      typeMap[n.id] = 'action';
    }
  }

  return typeMap;
}
