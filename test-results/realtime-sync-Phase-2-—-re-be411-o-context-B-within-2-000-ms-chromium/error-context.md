# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: realtime-sync.spec.ts >> Phase 2 — real-time sync >> move in context A propagates to context B within 2 000 ms
- Location: tests\e2e\realtime-sync.spec.ts:116:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-column-id="col-todo"] [data-card-id="card-1"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-column-id="col-todo"] [data-card-id="card-1"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: FlowBoard
        - generic [ref=e6]:
          - img [ref=e7]
          - textbox "Search tasks…" [ref=e10]
      - generic [ref=e11]:
        - button "Switch to dark mode" [ref=e12]:
          - img [ref=e13]
        - button [ref=e15]:
          - img [ref=e16]
        - button [ref=e19]:
          - img [ref=e20]
        - button [ref=e23]:
          - img [ref=e24]
        - generic [ref=e27]: JD
    - generic [ref=e28]:
      - complementary [ref=e29]:
        - generic [ref=e30]:
          - img [ref=e32]
          - generic [ref=e36]:
            - paragraph [ref=e37]: Engineering
            - paragraph [ref=e38]: Product Team
        - navigation [ref=e39]:
          - link "Dashboard" [ref=e40] [cursor=pointer]:
            - /url: "#"
            - img [ref=e42]
            - text: Dashboard
          - link "My Tasks" [ref=e47] [cursor=pointer]:
            - /url: "#"
            - img [ref=e49]
            - text: My Tasks
          - link "Projects" [ref=e52] [cursor=pointer]:
            - /url: "#"
            - img [ref=e54]
            - text: Projects
          - link "Team" [ref=e58] [cursor=pointer]:
            - /url: "#"
            - img [ref=e60]
            - text: Team
          - link "Analytics" [ref=e65] [cursor=pointer]:
            - /url: "#"
            - img [ref=e67]
            - text: Analytics
        - generic [ref=e68]:
          - button "New Project" [ref=e69]:
            - img [ref=e70]
            - text: New Project
          - link "Settings" [ref=e71] [cursor=pointer]:
            - /url: "#"
            - img [ref=e73]
            - text: Settings
      - main [ref=e76]:
        - generic [ref=e77]:
          - generic [ref=e78]:
            - generic [ref=e79]:
              - navigation [ref=e80]:
                - generic [ref=e81]: Projects
                - img [ref=e82]
                - generic [ref=e84]: Engineering Roadmap
              - heading "Engineering Roadmap" [level=1] [ref=e85]
            - generic [ref=e86]:
              - generic [ref=e87]:
                - generic "You" [ref=e88]: BF
                - generic "Cool Owl" [ref=e89]: CO
                - generic "Calm Lynx" [ref=e90]: CL
                - generic "Wise Owl" [ref=e91]: WO
              - button "Share" [ref=e92]:
                - img [ref=e93]
                - text: Share
          - generic [ref=e96]:
            - button "Board" [ref=e97]:
              - img [ref=e98]
              - text: Board
            - button "List" [ref=e102]:
              - img [ref=e103]
              - text: List
            - button "Timeline" [ref=e104]:
              - img [ref=e105]
              - text: Timeline
        - generic [ref=e109]:
          - generic [ref=e110]:
            - generic [ref=e111]:
              - generic [ref=e112]:
                - generic [ref=e113]:
                  - heading "To Do" [level=3] [ref=e114]
                  - generic [ref=e115]: "1"
                - button "Column options" [ref=e117]:
                  - img [ref=e118]
              - 'button "Card: Redesign onboarding flow, position 1" [ref=e123]':
                - 'button "Card: Redesign onboarding flow, position 1" [ref=e124] [cursor=pointer]':
                  - img [ref=e126]
                  - generic [ref=e134]: Design
                  - heading "Redesign onboarding flow" [level=4] [ref=e135]
                  - generic [ref=e136]:
                    - generic [ref=e137]:
                      - img [ref=e138]
                      - generic [ref=e140]: Nov 1
                    - generic "PK" [ref=e141]
              - button "Add Card" [ref=e143]:
                - img [ref=e144]
                - text: Add Card
            - generic [ref=e145]:
              - generic [ref=e146]:
                - generic [ref=e147]:
                  - heading "In Progress" [level=3] [ref=e148]
                  - generic [ref=e149]: "4"
                - button "Column options" [ref=e151]:
                  - img [ref=e152]
              - generic [ref=e156]:
                - 'button "Card: Competitor analysis for mobile auth flows, position 1" [ref=e157]':
                  - 'button "Card: Competitor analysis for mobile auth flows, position 1" [ref=e158] [cursor=pointer]':
                    - img [ref=e160]
                    - generic [ref=e168]: Research
                    - heading "Competitor analysis for mobile auth flows" [level=4] [ref=e169]
                    - generic [ref=e170]:
                      - generic [ref=e171]:
                        - img [ref=e172]
                        - generic [ref=e174]: Oct 24
                      - generic "SL" [ref=e175]
                - 'button "Card: Add request rate limiting to public API, position 2" [ref=e176]':
                  - 'button "Card: Add request rate limiting to public API, position 2" [ref=e177] [cursor=pointer]':
                    - img [ref=e179]
                    - generic [ref=e187]: Infrastructure
                    - heading "Add request rate limiting to public API" [level=4] [ref=e188]
                    - generic [ref=e189]:
                      - generic [ref=e190]:
                        - img [ref=e191]
                        - generic [ref=e193]: Oct 25
                      - generic "NV" [ref=e194]
                - 'button "Card: Dark mode support for user dashboard, position 3" [ref=e195]':
                  - 'button "Card: Dark mode support for user dashboard, position 3" [ref=e196] [cursor=pointer]':
                    - img [ref=e198]
                    - generic [ref=e206]: Feature
                    - heading "Dark mode support for user dashboard" [level=4] [ref=e207]
                    - generic [ref=e208]:
                      - generic [ref=e209]:
                        - img [ref=e210]
                        - generic [ref=e212]: Oct 28
                      - generic "CW" [ref=e213]
                - 'button "Card: test, position 4" [ref=e214]':
                  - 'button "Card: test, position 4" [ref=e215] [cursor=pointer]':
                    - img [ref=e217]
                    - heading "test" [level=4] [ref=e224]
              - button "Add Card" [ref=e226]:
                - img [ref=e227]
                - text: Add Card
            - generic [ref=e228]:
              - generic [ref=e229]:
                - generic [ref=e230]:
                  - heading "In Review" [level=3] [ref=e231]
                  - generic [ref=e232]: "3"
                - button "Column options" [ref=e234]:
                  - img [ref=e235]
              - generic [ref=e239]:
                - 'button "Card: Integrate Stripe Connect for marketplace payouts, position 1" [ref=e240]':
                  - 'button "Card: Integrate Stripe Connect for marketplace payouts, position 1" [ref=e241] [cursor=pointer]':
                    - img [ref=e243]
                    - generic [ref=e251]: Feature
                    - heading "Integrate Stripe Connect for marketplace payouts" [level=4] [ref=e252]
                    - generic [ref=e253]:
                      - generic [ref=e254]:
                        - img [ref=e255]
                        - generic [ref=e257]: Oct 26
                      - generic "MR" [ref=e258]
                - 'button "Card: Fix layout shift on Safari mobile browsers, position 2" [ref=e259]':
                  - 'button "Card: Fix layout shift on Safari mobile browsers, position 2" [ref=e260] [cursor=pointer]':
                    - img [ref=e262]
                    - generic [ref=e270]: Bug
                    - heading "Fix layout shift on Safari mobile browsers" [level=4] [ref=e271]
                    - generic [ref=e272]:
                      - generic [ref=e273]:
                        - img [ref=e274]
                        - generic [ref=e276]: Oct 23
                      - generic "AJ" [ref=e277]
                - 'button "Card: Set up CI/CD pipeline, position 3" [ref=e278]':
                  - 'button "Card: Set up CI/CD pipeline, position 3" [ref=e279] [cursor=pointer]':
                    - img [ref=e281]
                    - generic [ref=e289]: Infrastructure
                    - heading "Set up CI/CD pipeline" [level=4] [ref=e290]
                    - generic [ref=e291]:
                      - generic [ref=e292]:
                        - img [ref=e293]
                        - generic [ref=e295]: Oct 10
                      - generic "SL" [ref=e296]
              - button "Add Card" [ref=e298]:
                - img [ref=e299]
                - text: Add Card
            - generic [ref=e300]:
              - generic [ref=e301]:
                - generic [ref=e302]:
                  - heading "Done" [level=3] [ref=e303]
                  - generic [ref=e304]: "3"
                - button "Column options" [ref=e306]:
                  - img [ref=e307]
              - generic [ref=e311]:
                - 'button "Card: Migrate DB to RDS Aurora Cluster, position 1" [ref=e312]':
                  - 'button "Card: Migrate DB to RDS Aurora Cluster, position 1" [ref=e313] [cursor=pointer]':
                    - img [ref=e315]
                    - generic [ref=e323]: Infrastructure
                    - heading "Migrate DB to RDS Aurora Cluster" [level=4] [ref=e324]
                    - generic [ref=e325]:
                      - generic [ref=e326]:
                        - img [ref=e327]
                        - generic [ref=e329]: Oct 15
                      - generic "DK" [ref=e330]
                - 'button "Card: Cleanup legacy API utility functions, position 2" [ref=e331]':
                  - 'button "Card: Cleanup legacy API utility functions, position 2" [ref=e332] [cursor=pointer]':
                    - img [ref=e334]
                    - generic [ref=e342]: Refactor
                    - heading "Cleanup legacy API utility functions" [level=4] [ref=e343]
                    - generic [ref=e344]:
                      - generic [ref=e345]:
                        - img [ref=e346]
                        - generic [ref=e348]: Oct 21
                      - generic "BT" [ref=e349]
                - 'button "Card: test, position 3" [ref=e350]':
                  - 'button "Card: test, position 3" [ref=e351] [cursor=pointer]':
                    - img [ref=e353]
                    - heading "test" [level=4] [ref=e360]
              - button "Add Card" [ref=e362]:
                - img [ref=e363]
                - text: Add Card
            - button "Add Column" [ref=e365]:
              - img [ref=e366]
              - text: Add Column
          - status [ref=e367]
  - button "Open Next.js Dev Tools" [ref=e373] [cursor=pointer]:
    - img [ref=e374]
  - alert [ref=e377]
  - generic [ref=e378]:
    - link "Liveblocks" [ref=e379] [cursor=pointer]:
      - /url: https://lblcks.io/badge
      - img [ref=e380]
    - button [ref=e388] [cursor=pointer]:
      - img [ref=e389]
```

# Test source

```ts
  19  | // ---------------------------------------------------------------------------
  20  | // Helpers
  21  | // ---------------------------------------------------------------------------
  22  | 
  23  | /** Wait for the board to fully hydrate in a page. */
  24  | async function waitForBoard(page: Page): Promise<void> {
  25  |   // Presence bar renders once the Liveblocks room is connected
  26  |   await page.waitForSelector('[data-testid="presence-bar"]', { timeout: 15_000 })
  27  |   // Columns are visible once the REST snapshot has loaded
  28  |   await page.waitForSelector('[data-column-id="col-todo"]',  { timeout: 10_000 })
  29  | }
  30  | 
  31  | /**
  32  |  * Drag a card to the centre of a target column using low-level mouse events.
  33  |  * Steps are required to trigger dnd-kit's PointerSensor activation constraint
  34  |  * (distance: 8px) and to let the collision-detection algorithm track the move.
  35  |  */
  36  | async function dragCard(
  37  |   page: Page,
  38  |   cardId: string,
  39  |   toColumnId: string,
  40  | ): Promise<void> {
  41  |   const card = page.locator(`[data-card-id="${cardId}"]`)
  42  |   const col  = page.locator(`[data-column-id="${toColumnId}"]`)
  43  | 
  44  |   const cardBox = await card.boundingBox()
  45  |   const colBox  = await col.boundingBox()
  46  |   if (!cardBox || !colBox) throw new Error(`dragCard: element not found (card=${cardId} col=${toColumnId})`)
  47  | 
  48  |   const fromX = cardBox.x + cardBox.width  / 2
  49  |   const fromY = cardBox.y + cardBox.height / 2
  50  |   const toX   = colBox.x  + colBox.width   / 2
  51  |   const toY   = colBox.y  + 20  // land near the top of the column, not dead-centre
  52  | 
  53  |   // 1 — position over the card
  54  |   await page.mouse.move(fromX, fromY)
  55  |   // 2 — press; dnd-kit registers pointerdown
  56  |   await page.mouse.down()
  57  |   // 3 — exceed the 8px activation constraint
  58  |   await page.mouse.move(fromX + 15, fromY, { steps: 3 })
  59  |   // 4 — glide to the target column in small steps so onDragOver fires
  60  |   await page.mouse.move(toX, toY, { steps: 20 })
  61  |   // 5 — brief pause so collision detection settles before drop
  62  |   await page.waitForTimeout(100)
  63  |   // 6 — release
  64  |   await page.mouse.up()
  65  |   // 7 — allow onDragEnd + REST call to fire
  66  |   await page.waitForTimeout(200)
  67  | }
  68  | 
  69  | /**
  70  |  * Returns the data-column-id of the column currently containing the card,
  71  |  * or null if the card is not found in any column.
  72  |  */
  73  | async function getCardColumn(page: Page, cardId: string): Promise<string | null> {
  74  |   return page.evaluate((id) => {
  75  |     const card = document.querySelector(`[data-card-id="${id}"]`)
  76  |     if (!card) return null
  77  |     return card.closest('[data-column-id]')?.getAttribute('data-column-id') ?? null
  78  |   }, cardId)
  79  | }
  80  | 
  81  | // ---------------------------------------------------------------------------
  82  | // Suite
  83  | // ---------------------------------------------------------------------------
  84  | 
  85  | test.describe('Phase 2 — real-time sync', () => {
  86  |   let ctxA: BrowserContext
  87  |   let ctxB: BrowserContext
  88  |   let pageA: Page
  89  |   let pageB: Page
  90  | 
  91  |   test.beforeEach(async ({ browser }) => {
  92  |     ctxA  = await browser.newContext()
  93  |     ctxB  = await browser.newContext()
  94  |     pageA = await ctxA.newPage()
  95  |     pageB = await ctxB.newPage()
  96  | 
  97  |     await Promise.all([
  98  |       pageA.goto(BOARD_URL),
  99  |       pageB.goto(BOARD_URL),
  100 |     ])
  101 | 
  102 |     // Wait for both boards to be fully loaded and connected to Liveblocks
  103 |     await Promise.all([
  104 |       waitForBoard(pageA),
  105 |       waitForBoard(pageB),
  106 |     ])
  107 |   })
  108 | 
  109 |   test.afterEach(async () => {
  110 |     await ctxA.close()
  111 |     await ctxB.close()
  112 |   })
  113 | 
  114 |   // ---- Test 1: single-direction propagation ----------------------------------
  115 | 
  116 |   test('move in context A propagates to context B within 2 000 ms', async () => {
  117 |     // Precondition: card-1 starts in col-todo in both contexts
  118 |     await expect(pageA.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
> 119 |       .toBeVisible()
      |        ^ Error: expect(locator).toBeVisible() failed
  120 |     await expect(pageB.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
  121 |       .toBeVisible()
  122 | 
  123 |     // Action: move card-1 from col-todo → col-inprogress in context A
  124 |     await dragCard(pageA, 'card-1', 'col-inprogress')
  125 | 
  126 |     // Optimistic update — context A should reflect the move immediately
  127 |     await expect(pageA.locator('[data-column-id="col-inprogress"] [data-card-id="card-1"]'))
  128 |       .toBeVisible({ timeout: 1_000 })
  129 | 
  130 |     // Propagation — context B must see the card in col-inprogress within 2 000 ms
  131 |     await expect(pageB.locator('[data-column-id="col-inprogress"] [data-card-id="card-1"]'))
  132 |       .toBeVisible({ timeout: 2_000 })
  133 | 
  134 |     // Consistency — card must be absent from col-todo in both contexts
  135 |     await expect(pageA.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
  136 |       .not.toBeVisible()
  137 |     await expect(pageB.locator('[data-column-id="col-todo"] [data-card-id="card-1"]'))
  138 |       .not.toBeVisible()
  139 |   })
  140 | 
  141 |   // ---- Test 2: concurrent edits (same card, different columns) ---------------
  142 | 
  143 |   test('concurrent moves of the same card converge — no data loss', async () => {
  144 |     // Precondition: card-2 starts in col-todo in both contexts
  145 |     await expect(pageA.locator('[data-column-id="col-todo"] [data-card-id="card-2"]'))
  146 |       .toBeVisible()
  147 |     await expect(pageB.locator('[data-column-id="col-todo"] [data-card-id="card-2"]'))
  148 |       .toBeVisible()
  149 | 
  150 |     // Action: fire moves from both contexts simultaneously
  151 |     //   Context A moves card-2 → col-done
  152 |     //   Context B moves card-2 → col-review
  153 |     // Promise.all fires them without an await between, making them concurrent.
  154 |     await Promise.all([
  155 |       dragCard(pageA, 'card-2', 'col-done'),
  156 |       dragCard(pageB, 'card-2', 'col-review'),
  157 |     ])
  158 | 
  159 |     // Allow Liveblocks sync to settle (last-write-wins via seqNo / timestamp)
  160 |     await pageA.waitForTimeout(3_000)
  161 | 
  162 |     const columnInA = await getCardColumn(pageA, 'card-2')
  163 |     const columnInB = await getCardColumn(pageB, 'card-2')
  164 | 
  165 |     // No data loss: the card must exist in exactly one column in each context
  166 |     expect(columnInA, 'card-2 missing from context A after concurrent edit').not.toBeNull()
  167 |     expect(columnInB, 'card-2 missing from context B after concurrent edit').not.toBeNull()
  168 | 
  169 |     // Convergence: both contexts must agree on which column won
  170 |     expect(columnInA, `contexts diverged — A says ${columnInA}, B says ${columnInB}`)
  171 |       .toBe(columnInB)
  172 | 
  173 |     // Sanity: the winning column must be one of the two that were targeted
  174 |     expect(['col-done', 'col-review']).toContain(columnInA)
  175 |   })
  176 | })
  177 | 
```