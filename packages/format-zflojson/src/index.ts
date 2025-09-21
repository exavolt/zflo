import { registerFormat, createFormatImplementation } from '@zflo/api-format';
import { ZFloJsonParser } from './xfjson-parser.js';
import { ZFloJsonFormatter } from './xfjson-formatter.js';
import { ZFloJsonDetector } from './xfjson-detector.js';

// Create the format implementation
const zfloJsonImplementation = createFormatImplementation({
  formatId: 'zflojson',
  name: 'ZFlo JSON',
  detector: ZFloJsonDetector,
  parser: new ZFloJsonParser(),
  formatter: new ZFloJsonFormatter(),
});

// Auto-register on import
registerFormat(zfloJsonImplementation, '@zflo/format-zflojson');

// Export components for direct use if needed
export { ZFloJsonParser } from './xfjson-parser.js';
export { ZFloJsonFormatter } from './xfjson-formatter.js';
export { ZFloJsonDetector } from './xfjson-detector.js';
