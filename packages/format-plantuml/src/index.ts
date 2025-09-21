import { createFormatImplementation, autoRegister } from '@zflo/api-format';
import { PlantUMLParser } from './plantuml-parser';
import { PlantUMLFormatter } from './plantuml-formatter';
import { plantumlDetector } from './plantuml-detector';

// Create and auto-register the PlantUML format implementation
const plantumlFormat = createFormatImplementation({
  formatId: 'plantuml',
  name: 'PlantUML Activity',
  description: 'PlantUML Activity diagram format for flowcharts and processes',
  parser: new PlantUMLParser(),
  formatter: new PlantUMLFormatter(),
  detector: plantumlDetector,
});

// Auto-register on import
autoRegister(plantumlFormat);

// Export components for direct use if needed
export { PlantUMLParser } from './plantuml-parser';
export { PlantUMLFormatter } from './plantuml-formatter';
export { plantumlDetector } from './plantuml-detector';
export { plantumlFormat };
