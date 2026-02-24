import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiError } from '../src/lib/api-utils.js';

test('normalizeApiError returns payload values when provided', () => {
  const error = normalizeApiError(401, { code: 'UNAUTHENTICATED', message: 'Unauthorized' });
  assert.equal(error.status, 401);
  assert.equal(error.code, 'UNAUTHENTICATED');
  assert.equal(error.message, 'Unauthorized');
});

test('normalizeApiError falls back for missing values', () => {
  const error = normalizeApiError(500, {});
  assert.equal(error.status, 500);
  assert.equal(error.code, 'UNKNOWN_ERROR');
  assert.equal(error.message, 'Unexpected API error');
});
