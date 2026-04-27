/**
 * Phase 2 E2E — Real-time sync exit-criteria suite.
 *
 * Prerequisites:
 *   - Next.js dev server running on http://localhost:3000
 *   - NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY set in .env.local
 *
 * The suite opens two isolated browser contexts (equivalent to two browser
 * windows) on the same board room and verifies that mutations made in one
 * context propagate correctly to the other via Liveblocks.
 *
 * Run:  npx playwright test tests/e2e/realtime-sync.spec.ts
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const BOARD_URL = '/board/board-1'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for the board to fully hydrate in a page. */
async function waitForBoard(page: Page): Promise<void> {
  // Presence bar renders once the Liveblocks room is connected
  await page.waitForSelector('[data-testid="presence-bar"]', { timeout: 15_000 })
  // Columns are visible once the REST snapshot has loaded
  await page.waitForSelector('[data-column-id="col-todo"]',  { timeout: 10_000 })
}

/**
 * Drag a card to the centre of a target column using low-level mouse events.
 * Steps are required to trigger dnd-kit's PointerSensor activation constraint
 * (distance: 8px) and to let the collision-detection algorithm track the move.
 */
async function dragCard(
  page: Page,
  cardId: string,
  toColumnId: string,
): Promise<void> {
  const card = page.locator(`[data-card-id="${cardId}"]`)
  const col  = page.locator(`[data-column-id="${toColumnId}"]`)

  const cardBox = await card.boundingBox()
  const colBox  = await col.boundingBox()
  if (!cardBox || !colBox) throw new Error(`dragCard: element not found (card=${cardId} col=${toColumnId})`)

  const fromX = cardBox.x + cardBox.width  / 2
  const fromY = cardBox.y + cardBox.height / 2
  const toX   = colBox.x  + colBox.width   / 2
  const toY   = colBox.y  + 20  // land near the top of the column, not dead-centre

  // 1 — position over the card
  await page.mouse.move(fromX, fromY)
  // 2 — press; dnd-kit registers pointerdown
  await page.mouse.down()
  // 3 — exceed the 8px activation constraint
  await page.mouse.move(fromX + 15, fromY, { steps: 3 })
  // 4 — glide to the target column in small steps so onDragOver fires
  await page.mouse.move(toX, toY, { steps: 20 })
  // 5 — brief pause so collision detection settles before drop
  await page.waitForTimeout(100)
  // 6 — release
  await page.mouse.up()
  // 7 — allow onDragEnd + REST call to fire
  await page.waitForTimeout(200)
}

/**
 * Returns the data-column-id of the column currently containing the card,
 * or null if the card is not found in any column.
 */
async function getCardColumn(page: Page, cardId: string): Promise<string | null> {
  return page.evaluate((id) => {
    const card = document.querySelector(`[data-card-id="${id}"]`)
    if (!card) return null
    return card.closest('[data-column-id]')?.getAttribute('data-column-id') ?? null
  }, cardId)
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Phase 2 — real-time sync', () => {
  let ctxA: BrowserContext
  let ctxB: BrowserContext
  let pageA: Page
  let pageB: Page

  test.beforeEach(async ({ browser }) => {
    ctxA  = await browser.newContext()
    ctxB  = await browser.newContext()
    pageA = await ctxA.newPage()
    pageB = await ctxB.newPage()

    await Promise.all([
      pageA.goto(BOARD_URL),
      pageB.goto(BOARD_URL),
    ])

    // Wait for both boards to be fully loaded and connected to Liveblocks
    await Promise.all([
      waitForBoard(pageA),
      waitForBoard(pageB),
    ])
  })

  test.afterEach(async () => {
    await ctxA.close()
    await ctxB.close()
  })

  // ---- Test 1: single-direction propagation ----------------------------------

  test('move in context A propagates to context B within 2 000 ms', async () => {
    // Precondition: card-1 starts in col-todo in both contexts
    await expect(pageA.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
      .toBeVisible()
    await expect(pageB.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
      .toBeVisible()

    // Action: move card-1 from col-todo → col-inprogress in context A
    await dragCard(pageA, 'card-1', 'col-inprogress')

    // Optimistic update — context A should reflect the move immediately
    await expect(pageA.locator('[data-column-id="col-inprogress"] [data-card-id="card-1"]'))
      .toBeVisible({ timeout: 1_000 })

    // Propagation — context B must see the card in col-inprogress within 2 000 ms
    await expect(pageB.locator('[data-column-id="col-inprogress"] [data-card-id="card-1"]'))
      .toBeVisible({ timeout: 2_000 })

    // Consistency — card must be absent from col-todo in both contexts
    await expect(pageA.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
      .not.toBeVisible()
    await expect(pageB.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
      .not.toBeVisible()
  })

  // ---- Test 2: concurrent edits (same card, different columns) ---------------

  test('concurrent moves of the same card converge — no data loss', async () => {
    // Precondition: card-2 starts in col-todo in both contexts
    await expect(pageA.locator('[data-column-id="col-todo"] [data-card-id="card-2"]'))
      .toBeVisible()
    await expect(pageB.locator('[data-column-id="col-todo"] [data-card-id="card-2"]'))
      .toBeVisible()

    // Action: fire moves from both contexts simultaneously
    //   Context A moves card-2 → col-done
    //   Context B moves card-2 → col-review
    // Promise.all fires them without an await between, making them concurrent.
    await Promise.all([
      dragCard(pageA, 'card-2', 'col-done'),
      dragCard(pageB, 'card-2', 'col-review'),
    ])

    // Allow Liveblocks sync to settle (last-write-wins via seqNo / timestamp)
    await pageA.waitForTimeout(3_000)

    const columnInA = await getCardColumn(pageA, 'card-2')
    const columnInB = await getCardColumn(pageB, 'card-2')

    // No data loss: the card must exist in exactly one column in each context
    expect(columnInA, 'card-2 missing from context A after concurrent edit').not.toBeNull()
    expect(columnInB, 'card-2 missing from context B after concurrent edit').not.toBeNull()

    // Convergence: both contexts must agree on which column won
    expect(columnInA, `contexts diverged — A says ${columnInA}, B says ${columnInB}`)
      .toBe(columnInB)

    // Sanity: the winning column must be one of the two that were targeted
    expect(['col-done', 'col-review']).toContain(columnInA)
  })
})
