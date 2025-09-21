# @zflo/format-zflojson

ZFlo JSON format support for ZFlo. This package provides parsing, formatting, and detection capabilities for ZFlo native JSON format.

## Features

- 🔍 **Auto-Detection**: Automatically detects ZFlo JSON format with high confidence
- 📝 **Parsing**: Converts ZFlo JSON to ZFFlow objects with validation
- 🎨 **Formatting**: Converts ZFFlow objects back to clean ZFlo JSON
- ✅ **Validation**: Comprehensive validation with detailed error messages
- 🔧 **Auto-Registration**: Automatically registers with the format registry

## Installation

```bash
pnpm add @zflo/format-zflojson
```

## Usage

### Auto-Registration (Recommended)

Simply import the package to automatically register the format:

```typescript
import '@zflo/format-zflojson';
import { getFormatRegistry } from '@zflo/api-format';

const registry = getFormatRegistry();
const result = registry.parse(zfloJsonCode);
```

### Direct Usage

```typescript
import {
  ZFloJsonParser,
  ZFloJsonFormatter,
  ZFloJsonDetector,
} from '@zflo/format-zflojson';

const parser = new ZFloJsonParser();
const formatter = new ZFloJsonFormatter();
const detector = ZFloJsonDetector;

// Parse ZFlo JSON
const flow = parser.parse(jsonCode);

// Format back to JSON
const formatted = formatter.format(flow, { indent: 2 });

// Detect format
const detection = detector.detect(code);
```

## ZFlo JSON Format

The ZFlo JSON format is the native format for ZFlo flows:

```json
{
  "id": "my-flow",
  "title": "My Flow",
  "startNodeId": "start",
  "nodes": [
    {
      "id": "start",
      "type": "message",
      "title": "Welcome",
      "content": "Hello! Welcome to my flow.",
      "outlets": [
        {
          "to": "next",
          "label": "Continue"
        }
      ]
    },
    {
      "id": "next",
      "type": "message",
      "title": "Next Step",
      "content": "This is the next step."
    }
  ]
}
```

### Required Fields

- `id`: Unique identifier for the flow
- `startNodeId`: ID of the starting node
- `nodes`: Array of flow nodes

### Optional Fields

- `title`: Human-readable title for the flow
- Additional custom fields are preserved

### Node Structure

Each node must have:

- `id`: Unique identifier within the flow
- `type`: Node type (defaults to "message")
- `title`: Node title (optional)
- `content`: Node content (optional)
- `outlets`: Array of connections to other nodes (optional)

## API Reference

### ZFloJsonParser

```typescript
class ZFloJsonParser implements FormatParser {
  parse(code: string, options?: Record<string, unknown>): ZFFlow;
  validate(code: string): ValidationResult;
}
```

### ZFloJsonFormatter

```typescript
class ZFloJsonFormatter implements FormatFormatter {
  format(
    flow: ZFFlow,
    options?: {
      indent?: number;
      sortKeys?: boolean;
    }
  ): string;
}
```

**Options:**

- `indent`: Number of spaces for indentation (default: 2)
- `sortKeys`: Whether to sort object keys alphabetically (default: false)

### ZFloJsonDetector

```typescript
const ZFloJsonDetector: FormatDetector;
```

Returns confidence score (0-1) based on:

- Valid JSON structure
- Presence of required ZFlo fields (`id`, `nodes`, `startNodeId`)
- Node structure validation
- ZFlo-specific patterns

## Validation

The parser performs comprehensive validation:

- **JSON Syntax**: Must be valid JSON
- **Structure**: Must be an object (not array or primitive)
- **Required Fields**: Must have `id`, `nodes`, and `startNodeId`
- **Field Types**: Validates field types and constraints
- **Node Validation**: Ensures all nodes have required fields
- **Reference Validation**: Ensures `startNodeId` references an existing node

## Error Handling

Detailed error messages for common issues:

```typescript
// Invalid JSON syntax
"Invalid JSON syntax: Unexpected token ..."

// Missing required fields
"Missing or invalid "id" field - must be a non-empty string"

// Invalid node structure
"Node at index 0 missing or invalid "id" field"

// Invalid references
"startNodeId "invalid" not found in nodes"
```

## Integration

This package integrates seamlessly with the ZFlo format system:

```typescript
// In your application
import '@zflo/format-zflojson';
import { getFormatRegistry } from '@zflo/api-format';

const registry = getFormatRegistry();

// Auto-detection and parsing
const result = registry.parse(someCode);
if (result.success && result.format === 'xfjson') {
  console.log('Parsed ZFlo JSON flow:', result.flowchart);
}

// Format detection
const detection = registry.detectFormat(code);
if (detection.format === 'xfjson') {
  console.log('Detected ZFlo JSON with confidence:', detection.confidence);
}
```

## License

MIT
