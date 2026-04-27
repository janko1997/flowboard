// Pure coordinate normalization for cursor presence.
// Coordinates are normalized to [0, 1] relative to the viewport so that
// CursorOverlay (position: fixed, full viewport) can denormalize without
// needing access to the board canvas element bounds.

export function normalizeCoords(
  clientX: number,
  clientY: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  return {
    x: clientX / viewportWidth,
    y: clientY / viewportHeight,
  }
}

export function denormalizeCoords(
  nx: number,
  ny: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  return {
    x: nx * viewportWidth,
    y: ny * viewportHeight,
  }
}
