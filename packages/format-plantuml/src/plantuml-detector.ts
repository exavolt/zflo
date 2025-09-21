import { createDetector } from '@zflo/api-format';

/**
 * PlantUML format detector that identifies PlantUML Activity diagram syntax
 */
export const plantumlDetector = createDetector({
  formatId: 'plantuml',
  detect: (code: string) => {
    const trimmed = code.trim();
    const lines = trimmed.split('\n').map((line) => line.trim());

    let confidence = 0;

    // Check for PlantUML start/end markers
    if (trimmed.includes('@startuml') || trimmed.includes('@enduml')) {
      confidence += 0.4;
    }

    // Check for PlantUML activity diagram keywords
    const activityKeywords = ['start', 'stop', 'end'];
    for (const keyword of activityKeywords) {
      if (new RegExp(`^${keyword}$`, 'm').test(trimmed)) {
        confidence += 0.2;
        break;
      }
    }

    // Check for PlantUML-specific syntax patterns
    const plantumlPatterns = [
      /^:\s*.+\s*;$/, // activity syntax: :text;
      /^if\s*\(.+\)\s*then\s*\(.+\)$/, // if statement
      /^else(?:\s*\(.+\))?$/, // else statement
      /^endif$/, // endif statement
      /^elseif\s*\(.+\)\s*then\s*\(.+\)$/, // elseif statement
      /^label\s+\w+$/, // label statement
      /^goto\s+\w+$/, // goto statement
      /^note\s+(left|right|top|bottom)/, // note syntax
    ];

    let patternMatches = 0;
    for (const line of lines) {
      for (const pattern of plantumlPatterns) {
        if (pattern.test(line)) {
          patternMatches++;
          break;
        }
      }
    }

    if (patternMatches > 0) {
      confidence += Math.min(0.3, patternMatches * 0.1);
    }

    // Check for title directive
    if (/^title\s+.+/m.test(trimmed)) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  },
});
