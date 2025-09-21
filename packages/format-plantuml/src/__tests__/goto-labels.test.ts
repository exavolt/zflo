import { describe, it, expect, beforeEach } from 'vitest';
import { PlantUMLParser } from '../plantuml-parser';

describe('PlantUML Parser - Goto and Labels', () => {
  let parser: PlantUMLParser;

  beforeEach(() => {
    parser = new PlantUMLParser();
  });

  it('should handle goto statements and labels correctly', () => {
    const plantUML = `
@startuml
title Point two queries to same activity\\nwith \`goto\`
start
if (Test Question?) then (yes)
'space label only for alignment
label sp_lab0
label sp_lab1
'real label
label lab
:shared;
else (no)
if (Second Test Question?) then (yes)
label sp_lab2
goto sp_lab1
else
:nonShared;
endif
endif
:merge;
@enduml
    `.trim();

    const result = parser.parse(plantUML);

    // Find nodes by their content
    const testQuestionNode = result.nodes.find((n) =>
      n.title.includes('Test Question')
    );
    const secondTestQuestionNode = result.nodes.find((n) =>
      n.title.includes('Second Test Question')
    );
    const sharedNode = result.nodes.find((n) => n.title === 'shared');
    const nonSharedNode = result.nodes.find((n) => n.title === 'nonShared');
    const mergeNode = result.nodes.find((n) => n.title === 'merge');

    expect(testQuestionNode).toBeTruthy();
    expect(secondTestQuestionNode).toBeTruthy();
    expect(sharedNode).toBeTruthy();
    expect(nonSharedNode).toBeTruthy();
    expect(mergeNode).toBeTruthy();

    // Check paths from Test Question
    const testQuestionPaths = testQuestionNode?.outlets || [];
    expect(testQuestionPaths).toHaveLength(2);

    // Path to shared should be labeled "yes"
    const pathToShared = testQuestionPaths.find((p) => p.to === sharedNode?.id);
    expect(pathToShared?.label).toBe('yes');

    // Path to Second Test Question should be labeled "no"
    const pathToSecondTest = testQuestionPaths.find(
      (p) => p.to === secondTestQuestionNode?.id
    );
    expect(pathToSecondTest?.label).toBe('no');

    // Check paths from Second Test Question
    const secondTestPaths = secondTestQuestionNode?.outlets || [];
    expect(secondTestPaths).toHaveLength(2);

    // Path to shared should be labeled "yes" (via goto)
    const secondPathToShared = secondTestPaths.find(
      (p) => p.to === sharedNode?.id
    );
    expect(secondPathToShared?.label).toBe('yes');

    // Path to nonShared should have no label (else branch with no explicit label)
    const pathToNonShared = secondTestPaths.find(
      (p) => p.to === nonSharedNode?.id
    );
    expect(pathToNonShared?.label).toBeUndefined();

    // Check path from shared to merge
    const sharedPaths = sharedNode?.outlets || [];
    expect(sharedPaths).toHaveLength(1);
    expect(sharedPaths[0].to).toBe(mergeNode?.id);

    // Check path from nonShared to merge
    const nonSharedPaths = nonSharedNode?.outlets || [];
    expect(nonSharedPaths).toHaveLength(1);
    expect(nonSharedPaths[0].to).toBe(mergeNode?.id);
  });
});
