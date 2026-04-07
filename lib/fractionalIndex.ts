// ---------------------------------------------------------------------------
// Thin wrappers around the `fractional-indexing` package.
//
// WHY FRACTIONAL INDEXING:
// Integer positions (0, 1, 2, ...) require renumbering every card after an
// insert or concurrent reorder. Fractional index strings ("a0", "a0V", "a1")
// allow inserting between any two positions without touching other cards.
// Two concurrent inserts at the same slot produce different keys — no collision.
// This is the property that makes Phase 2 conflict-free for card ordering.
//
// USAGE:
//   positionBetween(null, null)        → first item in an empty list
//   positionBetween(null, "a1")        → insert before "a1"
//   positionBetween("a0", null)        → insert after "a0"
//   positionBetween("a0", "a1")        → insert between "a0" and "a1"
// ---------------------------------------------------------------------------

import { generateKeyBetween } from 'fractional-indexing'

/**
 * Generate a fractional position string between two existing positions.
 * Pass null for `before` to insert at the start, null for `after` to insert
 * at the end.
 */
export function positionBetween(
  before: string | null,
  after: string | null
): string {
  return generateKeyBetween(before, after)
}

/**
 * Given an array of items with a `position` field, return a new position
 * string for inserting at a specific index.
 *
 * @param items  Array already sorted by position ascending.
 * @param index  Desired insertion index (0 = before everything).
 */
export function positionAtIndex<T extends { position: string }>(
  items: T[],
  index: number
): string {
  const before = items[index - 1]?.position ?? null
  const after  = items[index]?.position   ?? null
  return positionBetween(before, after)
}

/**
 * Sort comparator for fractional index strings (lexicographic order).
 * Use directly with Array.sort or as a Zustand selector sort key.
 */
export function comparePositions(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
