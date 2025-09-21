import { createFormatImplementation, autoRegister } from '@zflo/api-format';
import { DotParser } from './dot-parser';
import { DotFormatter } from './dot-formatter';
import { dotDetector } from './dot-detector';

// Create and auto-register the DOT format implementation
const dotFormat = createFormatImplementation({
  formatId: 'dot',
  name: 'Graphviz DOT',
  description: 'Graphviz DOT format for directed and undirected graphs',
  parser: new DotParser(),
  formatter: new DotFormatter(),
  detector: dotDetector,
});

// Auto-register on import
autoRegister(dotFormat);

// Export components for direct use if needed
export { DotParser } from './dot-parser';
export { DotFormatter } from './dot-formatter';
export { dotDetector } from './dot-detector';
export { dotFormat };
