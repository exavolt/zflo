import { describe, it, expect } from 'vitest';
import { PlantUMLParser } from '../plantuml-parser';

describe('PlantUML Parser - Graphviz Case', () => {
  it('should parse the Graphviz installation check case correctly', () => {
    const plantUMLCode = `
@startuml

start

if (Graphviz installed?) then (yes)
  :process all
  diagrams;
else (no)
  :process only
  __sequence__ and __activity__ diagrams;
endif

stop

@enduml
    `.trim();

    const parser = new PlantUMLParser();
    const result = parser.parse(plantUMLCode);

    // Find nodes by their content
    const startNode = result.nodes.find((node) => node.title === 'Start');
    const decisionNode = result.nodes.find((node) =>
      node.title.includes('Graphviz')
    );
    const processAllNode = result.nodes.find((node) =>
      node.title.includes('process all')
    );
    const processOnlyNode = result.nodes.find((node) =>
      node.title.includes('process only')
    );
    const endNode = result.nodes.find((node) => node.title === 'End');

    // Verify nodes exist
    expect(startNode).toBeDefined();
    expect(decisionNode).toBeDefined();
    expect(processAllNode).toBeDefined();
    expect(processOnlyNode).toBeDefined();
    expect(endNode).toBeDefined();

    // Check decision node title matches input
    expect(decisionNode!.title).toBe('Graphviz installed?');

    // Check paths from decision node
    expect(decisionNode?.outlets).toHaveLength(2);

    const yesPath = decisionNode?.outlets?.find((path) => path.label === 'yes');
    const noPath = decisionNode?.outlets?.find((path) => path.label === 'no');

    expect(yesPath).toBeDefined();
    expect(noPath).toBeDefined();
    expect(yesPath!.to).toBe(processAllNode!.id);
    expect(noPath!.to).toBe(processOnlyNode!.id);

    // Check that both process nodes have paths to end
    expect(processAllNode?.outlets).toHaveLength(1);
    expect(processAllNode?.outlets?.[0].to).toBe(endNode!.id);

    expect(processOnlyNode?.outlets).toHaveLength(1);
    expect(processOnlyNode?.outlets?.[0].to).toBe(endNode!.id);
  });
});
