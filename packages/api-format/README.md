# @zflo/api-format

Format API contracts and registry for ZFlo parsers and formatters. This package provides standardized interfaces and a plugin architecture for format implementations.

## Features

- **Standardized Interfaces**: Common contracts for parsers, formatters, and detectors
- **Auto-Registration**: Format implementations register themselves on import
- **Format Detection**: Unified format detection with confidence scoring
- **Registry System**: Centralized management of format implementations
- **Collision Prevention**: Prevents duplicate format registrations
- **Fallback Parsing**: Automatic fallback to other formats if primary detection fails

## Installation

```bash
pnpm add @zflo/api-format
```

## Usage

### Using the Registry

```typescript
import { getFormatRegistry } from '@zflo/api-format';

const registry = getFormatRegistry();

// Auto-detect and parse
const result = registry.parse(code);
if (result.success) {
  console.log('Parsed flow:', result.flowchart);
}

// Parse with specific format
const mermaidResult = registry.parseWithFormat(code, 'mermaid');

// Format to specific syntax
const formatResult = registry.format(flow, 'dot');

// Detect format
const detection = registry.detectFormat(code);
console.log(`Detected: ${detection.format} (${detection.confidence})`);
```

### Creating Format Implementations

```typescript
import {
  createFormatImplementation,
  createDetector,
  registerFormat,
} from '@zflo/api-format';
import type { FormatParser, FormatFormatter } from '@zflo/api-format';

// Create detector
const detector = createDetector('myformat', 'My Format', (code) => ({
  confidence: code.includes('myformat') ? 0.9 : 0,
  indicators: ['myformat keyword found'],
}));

// Create parser
const parser: FormatParser = {
  parse(code: string) {
    // Parse logic here
    return parsedFlow;
  },
  validate(code: string) {
    // Validation logic
    return { isValid: true, errors: [], warnings: [] };
  },
};

// Create formatter (optional)
const formatter: FormatFormatter = {
  format(flow: FlowDefinition) {
    // Format logic here
    return formattedCode;
  },
};

// Create implementation
const implementation = createFormatImplementation({
  formatId: 'myformat',
  formatName: 'My Format',
  detector,
  parser,
  formatter,
});

// Auto-register (call this in your package's index.ts)
registerFormat(implementation, '@myorg/format-myformat');
```

### Format Package Structure

Format packages should follow this pattern:

```typescript
// src/index.ts
import { registerFormat, createFormatImplementation } from '@zflo/api-format';
import { MyFormatDetector } from './detector';
import { MyFormatParser } from './parser';
import { MyFormatFormatter } from './formatter';

// Create implementation
const implementation = createFormatImplementation({
  formatId: 'myformat',
  formatName: 'My Format',
  detector: new MyFormatDetector(),
  parser: new MyFormatParser(),
  formatter: new MyFormatFormatter(),
});

// Auto-register on import
registerFormat(implementation, '@myorg/format-myformat');

// Export for direct use
export { MyFormatParser, MyFormatFormatter, MyFormatDetector };
```

## API Reference

### Interfaces

#### `FormatParser<TOptions>`

```typescript
interface FormatParser<TOptions = Record<string, unknown>> {
  parse(code: string, options?: TOptions): FlowDefinition;
  validate?(code: string, options?: TOptions): FormatValidationResult;
  getDefaultOptions?(): TOptions;
}
```

#### `FormatFormatter<TOptions>`

```typescript
interface FormatFormatter<TOptions = Record<string, unknown>> {
  format(flow: FlowDefinition, options?: TOptions): string;
  getDefaultOptions?(): TOptions;
}
```

#### `FormatDetector`

```typescript
interface FormatDetector {
  detect(code: string): FormatDetectionResult;
  getFormatId(): FormatId;
  getFormatName(): string;
}
```

### Registry Methods

- `register(implementation, packageName?)` - Register a format implementation
- `getFormat(formatId)` - Get registered format by ID
- `hasFormat(formatId)` - Check if format is registered
- `detectFormat(code)` - Detect format from code
- `parse(code)` - Parse with auto-detection
- `parseWithFormat(code, formatId, options?)` - Parse with specific format
- `format(flow, formatId, options?)` - Format to specific syntax
- `validate(code, formatId?)` - Validate syntax

### Utilities

- `registerFormat(implementation, packageName?)` - Auto-register format
- `createFormatImplementation(config)` - Create implementation object
- `createDetector(formatId, formatName, detectFn)` - Create simple detector
- `normalizeConfidence(confidence)` - Normalize confidence to 0-1
- `getFormatInfo()` - Get debug information about registered formats

## Error Handling

The package provides specific error types:

- `FormatRegistryError` - Base registry error
- `FormatAlreadyRegisteredError` - Format ID collision
- `FormatNotFoundError` - Format not registered

## Migration from Direct Imports

### Before (apps/play)

```typescript
import { MermaidParser } from '@zflo/format-mermaid';
import { DotParser } from '@zflo/format-dot';
import { FormatDetector } from './format-detector';

const mermaidParser = new MermaidParser();
const dotParser = new DotParser();
const detector = new FormatDetector();
```

### After

```typescript
import { getFormatRegistry } from '@zflo/api-format';
// Import format packages to trigger auto-registration
import '@zflo/format-mermaid';
import '@zflo/format-dot';
import '@zflo/format-plantuml';

const registry = getFormatRegistry();
// Use registry methods instead of direct parser calls
```

## License

MIT
