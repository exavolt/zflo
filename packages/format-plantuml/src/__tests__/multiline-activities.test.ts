import { describe, it, expect, beforeEach } from 'vitest';
import { PlantUMLParser } from '../plantuml-parser';

describe('PlantUML Parser - Multiline Activities', () => {
  let parser: PlantUMLParser;

  beforeEach(() => {
    parser = new PlantUMLParser();
  });

  it('should handle multiline activities with stop', () => {
    const plantUML = `
@startuml
start
:Hello world;
:This is defined on
several **lines**;
stop
@enduml
    `.trim();

    const result = parser.parse(plantUML);

    // Should have start, Hello world, multiline activity, and stop
    expect(result.nodes).toHaveLength(4);

    const helloNode = result.nodes.find((n) => n.title === 'Hello world');
    const multilineNode = result.nodes.find(
      (n) =>
        n.title.includes('This is defined on') && n.title.includes('several')
    );
    const stopNode = result.nodes.find((n) => n.title === 'End');

    expect(helloNode).toBeTruthy();
    expect(multilineNode).toBeTruthy();
    expect(stopNode).toBeTruthy();

    // Check flow: Hello world -> multiline -> stop
    const helloPath = helloNode?.outlets?.[0];
    expect(helloPath?.to).toBe(multilineNode?.id);

    const multilinePath = multilineNode?.outlets?.[0];
    expect(multilinePath?.to).toBe(stopNode?.id);
  });

  it('should handle multiline activities with end', () => {
    const plantUML = `
@startuml
start
:Hello world;
:This is defined on
several **lines**;
end
@enduml
    `.trim();

    const result = parser.parse(plantUML);

    // Should have start, Hello world, multiline activity, and end
    expect(result.nodes).toHaveLength(4);

    const helloNode = result.nodes.find((n) => n.title === 'Hello world');
    const multilineNode = result.nodes.find(
      (n) =>
        n.title.includes('This is defined on') && n.title.includes('several')
    );
    const endNode = result.nodes.find((n) => n.title === 'End');

    expect(helloNode).toBeTruthy();
    expect(multilineNode).toBeTruthy();
    expect(endNode).toBeTruthy();

    // Check flow: Hello world -> multiline -> end
    const helloPath = helloNode?.outlets?.[0];
    expect(helloPath?.to).toBe(multilineNode?.id);

    const multilinePath = multilineNode?.outlets?.[0];
    expect(multilinePath?.to).toBe(endNode?.id);
  });

  it('should handle underscored text in activities', () => {
    const plantUML = `
@startuml
start
if (Graphviz installed?) then (yes)
:process all\\ndiagrams;
else (no)
:process only
__sequence__ and __activity__ diagrams;
endif
stop
@enduml
    `.trim();

    const result = parser.parse(plantUML);

    const processOnlyNode = result.nodes.find(
      (n) =>
        n.title.includes('process only') &&
        n.title.includes('sequence') &&
        n.title.includes('activity')
    );

    expect(processOnlyNode).toBeTruthy();
    expect(processOnlyNode?.title).toContain('__sequence__');
    expect(processOnlyNode?.title).toContain('__activity__');
  });
});
