# Design System Strategy: The Elite Editorial

## 1. Overview & Creative North Star

**Creative North Star: "The Digital Curator"**

This design system is built to transcend the "utility-only" look of standard SaaS platforms. We are blending the rigorous precision of a high-end financial tool with the bold, expansive layouts of a premium sports editorial like _The Athletic_ or _Victory Journal_.

To break the "template" look, we prioritize **intentional asymmetry** and **tonal depth**. Rather than a rigid grid of identical boxes, layouts should feel like a curated magazine—utilizing varying card heights, overlapping elements (e.g., a player image breaking the boundary of a container), and high-contrast typography scales that command attention. We do not just show data; we present insights with authority.

---

## 2. Colors & Surface Logic

Our palette moves away from the "flat web" by using a sophisticated spectrum of off-whites and cool grays, punctuated by a singular, high-energy focal point. The primary accent color for key interactive elements is currently `#3fe769`.

### The Palette (Core Tokens)

- **Background:** `#F7F9FB` (The canvas)
- **Primary (Accent):** `#6B38D4` (Electric Violet - for action and energy)
- **On-Surface:** `#191C1E` (Deep Navy - for elite readability)
- **Surface Containers:** Range from `Lowest (#FFFFFF)` to `Highest (#E0E3E5)`

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Traditional borders create visual noise that interrupts the "editorial flow." Boundaries must be defined solely through:

1.  **Background Color Shifts:** Placing a `surface-container-low` section against a `surface` background.
2.  **Tonal Transitions:** Using subtle shifts in hue to denote change in context.

### Surface Hierarchy & Nesting

Treat the UI as a physical stack of fine paper.

- **The Base:** `background` (#F7F9FB).
- **The Content Layer:** Use `surface-container-lowest` (#FFFFFF) for the primary content cards to create a "lifted" feel.
- **Nested Elements:** Inside a white card, use `surface-container` (#ECEEF0) for secondary metadata or inset areas. This "inset" look provides structure without the need for lines.

### Signature Textures: Glass & Gradients

To provide "soul," use the **Signature Glow**:

- **CTAs:** Use a linear gradient from `primary` (#6B38D4) to `primary-container` (#8455EF) at a 135° angle.
- **Glassmorphism:** For floating navigation or modal overlays, use `surface-container-lowest` at 80% opacity with a `24px` backdrop blur. This ensures the vibrant sports imagery or data underneath bleeds through softly, maintaining a sense of place.

---

## 3. Typography: The Editorial Voice

We utilize a dual-font strategy to balance character with functionality.

- **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "grotesque" feel. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero moments. This conveys the "Elite" status of the creator.
- **Body & Labels (Inter):** The industry standard for readability. Inter handles the heavy lifting of sports data and long-form analysis.

**Hierarchy as Identity:**

- **High Contrast:** Always pair a massive `headline-lg` with a much smaller, uppercase `label-md` (using extra letter spacing) to create an "Editorial Header" effect.
- **Weight as Emphasis:** Use `Medium` (500) for body text to maintain a premium, "ink-on-paper" weight against the light background.

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than structural shadows.

- **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card sitting on a `surface-container-low` section creates a natural, soft lift.
- **Ambient Shadows:** For high-importance floating elements (like a "Place Pick" button), use an extra-diffused shadow: `0px 20px 40px rgba(15, 23, 42, 0.06)`. The shadow must be a tinted version of the navy text color, never pure black.
- **The "Ghost Border" Fallback:** If a container lacks contrast against its background, use a "Ghost Border": `outline-variant` (#CBC3D7) at **15% opacity**. It should be felt, not seen.

---

## 5. Component Guidelines

### Cards (The Hero Component)

- **Radius:** 24px (`xl`) for large layout containers; 16px (`lg`) for internal nested cards.
- **Separation:** Forbid dividers. Use `32px` or `48px` of vertical whitespace to separate content chunks. Spacing across the system is set to `2` for a compact feel.
- **Content:** Images should use a subtle inner vignette or a `surface-dim` overlay to ensure text overlay readability.

### Buttons

- **Primary:** Gradient fill (`primary` to `primary-container`), 999px radius (Full), `label-md` bold uppercase text.
- **Secondary:** `surface-container-high` background with `on-surface` text. No border.
- **Interaction:** On hover, apply a subtle `4px` translateY lift and increase the shadow diffusion.

### Input Fields

- **Style:** `surface-container-lowest` background with a `Ghost Border`.
- **Focus State:** The border transitions to 100% opacity `primary` violet with a 4px soft outer glow (10% opacity primary color).

### Additional "Creator-First" Components

- **The "Insight Glow" Chip:** A selection chip using a semi-transparent violet background (`primary` at 10% opacity) with a vibrant violet dot. Used to highlight "Lock" picks or expert insights.
- **The Performance Graph:** Use `primary` gradients for line charts, removing all grid lines except for the baseline to maintain the "No-Line" editorial philosophy.

---

## 6. Do’s and Don’ts

### Do

- **Do** use expansive white space, while maintaining a compact overall feel with spacing set to `2`. If a layout feels "full," increase the margins.
- **Do** use asymmetrical image placement. Let an athlete’s head or a piece of equipment overlap the edge of a container to break the "SaaS box."
- **Do** use the _theme's primary color_ (`#3fe769`) sparingly, it is a laser, not a paint bucket. Use it to draw the eye to the most critical action.

### Don’t

- **Don’t** use pure black (#000000). It kills the premium feel. Stick to the Deep Navy (`on-surface`).
- **Don’t** use 1px dividers or "hr" tags. If you need a break, use a `surface-container-highest` block or increased padding.
- **Don’t** use "Hype" aesthetics (e.g., slanted "italic" containers, neon "gaming" glows, or cluttered grit textures). We are professional and selective, not loud.
