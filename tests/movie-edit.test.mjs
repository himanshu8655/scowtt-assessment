import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOptimisticMovie, rollbackMovie } from '../src/lib/movie-edit.js';

test('applyOptimisticMovie updates favorite movie immediately', () => {
  const before = { email: 'a@b.com', favoriteMovie: 'Interstellar' };
  const after = applyOptimisticMovie(before, 'Inception');
  assert.equal(after.favoriteMovie, 'Inception');
});

test('rollbackMovie restores previous movie after failure', () => {
  const optimistic = { email: 'a@b.com', favoriteMovie: 'Inception' };
  const rolledBack = rollbackMovie(optimistic, 'Interstellar');
  assert.equal(rolledBack.favoriteMovie, 'Interstellar');
});
