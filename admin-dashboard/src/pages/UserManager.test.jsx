import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sourcePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'UserManager.jsx');
const source = readFileSync(sourcePath, 'utf8');

describe('UserManager password handling', () => {
  test('does not collect reset passwords with window.prompt', () => {
    expect(source).not.toMatch(/\bprompt\s*\(/);
  });

  test('uses a masked password input and basic complexity validation for resets', () => {
    expect(source).toContain('type="password"');
    expect(source).toMatch(/\/\[A-Z\]\//);
    expect(source).toMatch(/\/\[a-z\]\//);
    expect(source).toMatch(/\/\[0-9\]\//);
    expect(source).toMatch(/\/\[\^A-Za-z0-9\]\//);
  });
});
