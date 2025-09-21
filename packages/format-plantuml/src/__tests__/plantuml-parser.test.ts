import { describe, it, expect } from 'vitest';
import { PlantUMLParser } from '../plantuml-parser';

describe('PlantUMLParser', () => {
  const parser = new PlantUMLParser();

  describe('parse', () => {
    it('should parse a simple activity diagram', () => {
      const plantUML = `
@startuml
start
:Welcome to the adventure;
:Choose your path;
stop
@enduml
      `;

      const result = parser.parse(plantUML);

      expect(result.id).toBe('plantuml-activity');
      expect(result.title).toBe('PlantUML Activity Diagram');
      expect(result.nodes).toHaveLength(4); // start, 2 activities, stop
      expect(result.startNodeId).toBeTruthy();

      const startNode = result.nodes.find((n) => n.id === result.startNodeId);
      expect(startNode?.title).toBe('Start');
    });

    it('should parse activity diagram with decision points', () => {
      const plantUML = `
@startuml
start
:Welcome to the adventure;
if (Choose your path?) then (cave)
  :Explore the dark cave;
  :Find treasure!;
else (mountain)
  :Climb the mountain;
  :Enjoy the view!;
endif
:Victory!;
stop
@enduml
      `;

      const result = parser.parse(plantUML);

      expect(result.nodes.length).toBeGreaterThan(5);

      // Should have decision node
      const decisionNode = result.nodes.find((n) =>
        n.title.includes('Choose your path')
      );
      expect(decisionNode).toBeTruthy();
      expect(decisionNode?.outlets?.length).toBe(2);

      // Should have labeled paths
      const paths = decisionNode?.outlets || [];
      expect(paths.some((p) => p.label === 'cave')).toBe(true);
      expect(paths.some((p) => p.label === 'mountain')).toBe(true);
    });

    it('should parse activity diagram with title', () => {
      const plantUML = `
@startuml
title Adventure Story
start
:Begin your quest;
stop
@enduml
      `;

      const result = parser.parse(plantUML);

      expect(result.title).toBe('Adventure Story');
      expect(result.metadata?.originalTitle).toBe('Adventure Story');
    });

    it('should handle activities with complex text', () => {
      const plantUML = `
@startuml
start
:You find yourself at a crossroads\\nThe path ahead splits in two directions;
:Make your choice carefully\\nThis decision will affect your journey;
stop
@enduml
      `;

      const result = parser.parse(plantUML);

      const activities = result.nodes.filter(
        (n) => n.title !== 'Start' && n.title !== 'End'
      );
      expect(activities.length).toBe(2);
      expect(activities[0].content).toContain('crossroads');
      expect(activities[1].content).toContain('choice carefully');
    });

    it('should validate and return validation results', () => {
      const validPlantUML = `
@startuml
start
:Valid activity;
stop
@enduml
      `;

      expect(() => parser.parse(validPlantUML)).not.toThrow();
    });

    it('should handle invalid syntax gracefully', () => {
      const invalidPlantUML = 'invalid plantuml syntax';

      expect(() => parser.parse(invalidPlantUML)).toThrow();
    });

    it('should handle empty input', () => {
      const emptyPlantUML = `
@startuml
@enduml
      `;

      const result = parser.parse(emptyPlantUML);
      expect(result.nodes).toHaveLength(0);
      expect(result.startNodeId).toBe('');
    });

    it('should ignore comments and notes', () => {
      const plantUMLWithComments = `
@startuml
' This is a comment
start
:Main activity;
note right: This is a note
:Another activity;
stop
@enduml
      `;

      const result = parser.parse(plantUMLWithComments);

      // Should only have start, 2 activities, and stop
      expect(result.nodes).toHaveLength(4);
      expect(
        result.nodes.every(
          (n) => !n.title.includes('comment') && !n.title.includes('note')
        )
      ).toBe(true);
    });

    it('should handle nested decision structures', () => {
      const plantUML = `
@startuml
start
if (First choice?) then (yes)
  :Do something;
  if (Second choice?) then (continue)
    :Continue path;
  else (stop)
    :Stop here;
  endif
else (no)
  :Alternative path;
endif
:Final activity;
stop
@enduml
      `;

      const result = parser.parse(plantUML);

      // Should have multiple decision nodes
      const decisionNodes = result.nodes.filter((n) =>
        n.title.includes('choice')
      );
      expect(decisionNodes.length).toBe(2);
    });
  });
});
