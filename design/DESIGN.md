# Design System Strategy: The Silent Architecture

## 1. Overview & Creative North Star
This design system is built upon the philosophy of **"The Silent Architecture."** In a high-velocity project management environment, the UI should never compete with the user's data. Instead of rigid boxes and heavy lines, we utilize tonal depth, generous whitespace, and editorial typography to create a sense of calm authority.

The goal is to move beyond the "template" look of SaaS tools. We achieve this through **Intentional Asymmetry**—where sidebars and utility panels use different tonal weights than the main canvas—and **Optical Hierarchies**, ensuring the most critical path (the work) is always the most luminous element on the screen.

---

## 2. Color & Surface Philosophy
The palette is rooted in muted, professional slates and indigos. We avoid high-saturation "tech neon" in favor of colors that feel like high-end stationery or architectural materials.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are prohibited for sectioning.** Traditional dividers create visual clutter. Instead, boundaries must be defined through:
*   **Background Shifts:** Using `surface-container-low` for a sidebar against a `surface` main canvas.
*   **Tonal Transitions:** A `surface-container-highest` header sitting atop a `surface-container-low` body.

### Surface Hierarchy & Nesting
Think of the UI as a series of physical layers. Use the following tiers to "nest" importance:
*   **Base Layer (`surface`):** The primary canvas.
*   **In-set Containers (`surface-container-low`):** For utility zones like sidebars or navigation rails.
*   **Raised Elements (`surface-container-lowest`):** For the highest priority items, such as active task cards. This creates a "light-box" effect where the most important content is the brightest.

### The "Glass & Gradient" Rule
To move beyond a "flat" feel, use **Glassmorphism** for floating elements (modals, dropdowns, or hovering toolbars). Use a semi-transparent `surface-container-lowest` with a `20px` backdrop-blur. 
*   **Signature Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (#544fc0) to `primary-dim` (#4742b3) at a 145-degree angle. This adds a "soul" to the action that flat hex codes cannot provide.

---

## 3. Typography: Editorial Precision
We use **Inter** as our typographic backbone. The focus is on a high-contrast scale that mimics a technical journal.

*   **The Technical Label:** Use `label-sm` (0.6875rem) in all-caps with `0.05em` letter-spacing for metadata, status tags, and column headers. This creates a "pro-tool" aesthetic.
*   **The Narrative Headline:** `headline-sm` should be used for project titles to provide a strong anchor point.
*   **The Workhorse:** `body-md` (0.875rem) is the default for all user-generated content, optimized for legibility in dense lists.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than structural shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift that feels integrated into the environment.
*   **Ambient Shadows:** When an element must "float" (e.g., a dragged card), use an extra-diffused shadow:
    *   *Y: 8px, Blur: 24px, Color: `on-surface` at 6% opacity.*
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, it must be a **Ghost Border**. Use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** A subtle gradient (`primary` to `primary-dim`). Corner radius: `DEFAULT` (0.5rem). Text: `label-md` (Medium weight).
*   **Secondary:** No background. A `Ghost Border` using `outline-variant`. On hover, transition to `surface-container-high`.
*   **Tertiary/Ghost:** No border or background. Only `on-surface-variant` text.

### Cards (The "FlowCard")
*   **Structure:** No borders. Background: `surface-container-lowest`.
*   **Interaction:** On hover, transition the background to `surface-bright` and apply a `4%` ambient shadow.
*   **Content:** Forbid divider lines between card sections. Use `1.5rem` of vertical padding to separate content blocks.

### Input Fields
*   **Default State:** `surface-container-highest` background with a `Ghost Border`. 
*   **Focus State:** The `Ghost Border` becomes `primary` at 100% opacity, with a `2px` outer glow using `primary` at 10% opacity.

### Navigation Rails
*   **Vertical Rails:** Use `surface-container-low`. Active states are indicated by a `surface-container-lowest` pill-shaped background (`full` roundedness) behind the icon and label.

### Chips & Tags
*   **Status Tags:** Use `secondary-container` for the background and `on-secondary-container` for the text. Keep them lowercase for a modern, "linear-style" feel.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a structural element. If an interface feels "busy," increase the padding rather than adding a line.
*   **DO** use `surface-container` shifts to group related items.
*   **DO** ensure that the most important text (Titles) uses `on-surface`, while secondary metadata uses `on-surface-variant`.

### Don’t
*   **DON'T** use pure black (#000) or high-contrast grey lines.
*   **DON'T** use the `DEFAULT` shadow for static elements; depth should be "baked" into the background colors.
*   **DON'T** use more than one `primary` color action per screen. If everything is a priority, nothing is.
*   **DON'T** use standard 1px dividers in lists. Use 8px or 12px of vertical spacing to imply separation.

---

## 7. Signature Interaction: "The Soft Focus"
When a user opens a modal or a focused task view, the background "Main Canvas" should not just dim—it should blur (8px) and shift slightly in scale (98%). This reinforces the "Editorial" feel, making the active work feel like it is sitting on a physical layer of frosted glass above the rest of the application.