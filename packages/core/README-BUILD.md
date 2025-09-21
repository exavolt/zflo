# Build Configuration Notes

## TypeScript Configuration

This package uses `skipLibCheck: true` in its TypeScript configuration due to a known issue with the `cel-js@0.8.2` dependency, which has broken type declarations:

```
error TS2307: Cannot find module './cst-definitions.js' or its corresponding type declarations.
```

**Type Safety Measures:**

- All source code in `src/` is subject to strict TypeScript checking
- The root `tsconfig.json` enforces strict compiler options including:
  - `strict: true`
  - `noImplicitReturns: true`
  - `noUncheckedIndexedAccess: true`
  - `noUnusedLocals: true`
  - `noUnusedParameters: true`
  - `noFallthroughCasesInSwitch: true`

**Dependency Issue:**

- The `cel-js` library is used for Common Expression Language evaluation
- Version 0.8.2 is the latest available but has broken TypeScript declarations
- `skipLibCheck` only affects third-party library type checking, not our source code

**Future Improvement:**
Consider replacing `cel-js` with a more reliable expression evaluator or contributing fixes upstream.
