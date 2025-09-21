import { describe, it, expect } from 'vitest';
import {
  ContentInterpolator,
  interpolateContent,
  hasContentInterpolations,
} from '../content-interpolator';

describe('ContentInterpolator', () => {
  const interpolator = new ContentInterpolator();

  describe('basic interpolation', () => {
    it('should interpolate simple variables', () => {
      const content = 'Temperature is ${temp}°C';
      const state = { temp: 90 };

      const result = interpolator.interpolate(content, state);

      expect(result.content).toBe('Temperature is 90°C');
      expect(result.hasInterpolations).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should interpolate expressions', () => {
      const content = 'Middle temperature is ${(highTemp + lowTemp) / 2}°C';
      const state = { highTemp: 100, lowTemp: 80 };

      const result = interpolator.interpolate(content, state);

      expect(result.content).toBe('Middle temperature is 90°C');
      expect(result.hasInterpolations).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple interpolations', () => {
      const content =
        'Range: ${lowTemp}°C to ${highTemp}°C, middle: ${(highTemp + lowTemp) / 2}°C';
      const state = { highTemp: 100, lowTemp: 80 };

      const result = interpolator.interpolate(content, state);

      expect(result.content).toBe('Range: 80°C to 100°C, middle: 90°C');
      expect(result.hasInterpolations).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle undefined variables gracefully', () => {
      const content = 'Value is ${unknownVar}';
      const state = {};

      const result = interpolator.interpolate(content, state);

      // CEL evaluator returns undefined for unknown variables, which gets converted to empty string
      expect(result.content).toBe('Value is ');
      expect(result.hasInterpolations).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to interpolate');
    });

    it('should handle invalid expressions', () => {
      const content = 'Result is ${invalid syntax}';
      const state = {};

      const result = interpolator.interpolate(content, state);

      expect(result.hasInterpolations).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle escaped interpolations', () => {
      const content = 'Literal: \\${temp} and interpolated: ${temp}';
      const state = { temp: 90 };

      const result = interpolator.interpolate(content, state);

      expect(result.content).toBe('Literal: ${temp} and interpolated: 90');
      expect(result.hasInterpolations).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple escaped interpolations', () => {
      const content = 'Examples: \\${var1}, \\${var2}, but ${actual} works';
      const state = { actual: 'test' };

      const result = interpolator.interpolate(content, state);

      expect(result.content).toBe('Examples: ${var1}, ${var2}, but test works');
      expect(result.hasInterpolations).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle only escaped interpolations', () => {
      const content = 'All escaped: \\${var1} and \\${var2}';
      const state = { var1: 'test1', var2: 'test2' };

      const result = interpolator.interpolate(content, state);

      expect(result.content).toBe('All escaped: ${var1} and ${var2}');
      expect(result.hasInterpolations).toBe(false);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('utility functions', () => {
    it('should detect interpolations', () => {
      expect(hasContentInterpolations('Hello ${name}')).toBe(true);
      expect(hasContentInterpolations('Hello world')).toBe(false);
      expect(hasContentInterpolations('${a} and ${b}')).toBe(true);
    });

    it('should interpolate using convenience function', () => {
      const result = interpolateContent('Hello ${name}', { name: 'World' });
      expect(result).toBe('Hello World');
    });
  });

  describe('value formatting', () => {
    it('should format numbers nicely', () => {
      const result = interpolator.interpolate(
        'Integer: ${int}, Float: ${float}',
        {
          int: 42,
          float: 3.14159,
        }
      );

      expect(result.content).toBe('Integer: 42, Float: 3.14');
    });

    it('should handle arrays', () => {
      const result = interpolator.interpolate('Items: ${items}', {
        items: ['apple', 'banana', 'cherry'],
      });

      expect(result.content).toBe('Items: apple, banana, cherry');
    });

    it('should handle booleans', () => {
      const result = interpolator.interpolate(
        'Active: ${active}, Disabled: ${disabled}',
        {
          active: true,
          disabled: false,
        }
      );

      expect(result.content).toBe('Active: true, Disabled: false');
    });
  });
});
