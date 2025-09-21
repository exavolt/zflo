import {
  createFormatImplementation,
  getFormatRegistry,
} from '@zflo/api-format';
import { MermaidParser } from './mermaid-parser';
import { MermaidFormatter } from './mermaid-formatter';
import { MermaidDetector } from './mermaid-detector';

// Create and auto-register the Mermaid format implementation
const mermaidFormat = createFormatImplementation({
  formatId: 'mermaid',
  name: 'Mermaid',
  detector: MermaidDetector,
  parser: new MermaidParser(),
  formatter: new MermaidFormatter(),
});

// Register the format synchronously using the imported registry function
try {
  const registry = getFormatRegistry();
  registry.register(mermaidFormat, '@zflo/format-mermaid');
} catch (error) {
  console.error(
    'Failed to register Mermaid format:',
    error instanceof Error ? error.message : error
  );
  throw error;
}

// Export for direct use
export { MermaidParser } from './mermaid-parser';
export { MermaidFormatter } from './mermaid-formatter';
export { MermaidDetector } from './mermaid-detector';
export { zfloToMermaid } from './mermaid-export';
