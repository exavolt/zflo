import { describe, it, expect } from 'vitest';
import { PlantUMLParser } from '../plantuml-parser';

describe('PlantUML Parser - Elseif Chaining', () => {
  it('should parse complex elseif chaining correctly', () => {
    const plantUMLCode = `
@startuml
start
if (condition A) then (yes)
  :Text 1;
elseif (condition B) then (yes)
  :Text 2;
  stop
(no) elseif (condition C) then (yes)
  :Text 3;
(no) elseif (condition D) then (yes)
  :Text 4;
else (nothing)
  :Text else;
endif
stop
@enduml
    `.trim();

    const parser = new PlantUMLParser();
    const result = parser.parse(plantUMLCode);

    // Expected structure:
    // - Start node
    // - Decision node for condition A
    // - Decision node for condition B (connected from condition A's "no" path)
    // - Decision node for condition C (connected from condition B's "no" path)
    // - Decision node for condition D (connected from condition C's "no" path)
    // - Text 1, Text 2, Text 3, Text 4, Text else activities
    // - Two End nodes (one after Text 2, one after the main flow)

    const startNode = result.nodes.find((node) => node.title === 'Start');
    const conditionANode = result.nodes.find(
      (node) => node.title === 'condition A'
    );
    const conditionBNode = result.nodes.find(
      (node) => node.title === 'condition B'
    );
    const conditionCNode = result.nodes.find(
      (node) => node.title === 'condition C'
    );
    const conditionDNode = result.nodes.find(
      (node) => node.title === 'condition D'
    );

    const text1Node = result.nodes.find((node) => node.title === 'Text 1');
    const text2Node = result.nodes.find((node) => node.title === 'Text 2');
    const text3Node = result.nodes.find((node) => node.title === 'Text 3');
    const text4Node = result.nodes.find((node) => node.title === 'Text 4');
    const textElseNode = result.nodes.find(
      (node) => node.title === 'Text else'
    );

    // Verify all nodes exist
    expect(startNode).toBeDefined();
    expect(conditionANode).toBeDefined();
    expect(conditionBNode).toBeDefined();
    expect(conditionCNode).toBeDefined();
    expect(conditionDNode).toBeDefined();
    expect(text1Node).toBeDefined();
    expect(text2Node).toBeDefined();
    expect(text3Node).toBeDefined();
    expect(text4Node).toBeDefined();
    expect(textElseNode).toBeDefined();

    // Verify decision chaining structure
    // condition A -> yes -> Text 1
    // condition A -> no -> condition B
    const conditionAPaths = conditionANode!.outlets;
    const yesPathA = conditionAPaths?.find((path) => path.label === 'yes');
    const noPathA = conditionAPaths?.find((path) => path.label === 'no');

    expect(yesPathA?.to).toBe(text1Node!.id);
    expect(noPathA?.to).toBe(conditionBNode!.id);

    // condition B -> yes -> Text 2
    // condition B -> no -> condition C
    const conditionBPaths = conditionBNode!.outlets;
    const yesPathB = conditionBPaths?.find((path) => path.label === 'yes');
    const noPathB = conditionBPaths?.find((path) => path.label === 'no');

    expect(yesPathB?.to).toBe(text2Node!.id);
    expect(noPathB?.to).toBe(conditionCNode!.id);

    // condition C -> yes -> Text 3
    // condition C -> no -> condition D
    const conditionCPaths = conditionCNode!.outlets;
    const yesPathC = conditionCPaths?.find((path) => path.label === 'yes');
    const noPathC = conditionCPaths?.find((path) => path.label === 'no');

    expect(yesPathC?.to).toBe(text3Node!.id);
    expect(noPathC?.to).toBe(conditionDNode!.id);

    // condition D -> yes -> Text 4
    // condition D -> nothing -> Text else
    const conditionDPaths = conditionDNode!.outlets;
    const yesPathD = conditionDPaths?.find((path) => path.label === 'yes');
    const nothingPathD = conditionDPaths?.find(
      (path) => path.label === 'nothing'
    );

    expect(yesPathD?.to).toBe(text4Node!.id);
    expect(nothingPathD?.to).toBe(textElseNode!.id);

    // Verify that Text 1 and Text 3 connect to the final End node
    const finalEndNode = result.nodes.find(
      (node) =>
        node.title === 'End' && (node.outlets?.length === 0 || !node.outlets) // Final end node has no outgoing paths
    );
    expect(finalEndNode).toBeDefined();

    expect(text1Node?.outlets).toHaveLength(1);
    expect(text1Node?.outlets?.[0].to).toBe(finalEndNode!.id);

    expect(text3Node?.outlets).toHaveLength(1);
    expect(text3Node?.outlets?.[0].to).toBe(finalEndNode!.id);

    // Text 4 and Text else should also connect to final End
    expect(text4Node?.outlets).toHaveLength(1);
    expect(text4Node?.outlets?.[0].to).toBe(finalEndNode!.id);

    expect(textElseNode?.outlets).toHaveLength(1);
    expect(textElseNode?.outlets?.[0].to).toBe(finalEndNode!.id);
  });
});
