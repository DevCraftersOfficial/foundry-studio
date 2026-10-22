# Foundry Studio — Design System & Visual Standards

- **Status:** Approved Product Baseline (Milestone FS-002.5)
- **Target Audience:** Frontend Engineers, UI/UX Designers, Autonomous Agents, Agency Implementers
- **Accessibility Target:** WCAG 2.2 AA Conformance
- **Technology Alignment:** Next.js (App Router), Payload CMS 3.x, Tailwind CSS, Lucide SVG Icons

---

## 1. Product Vision & Design Principles

Foundry Studio is an agency-first, reusable content publishing platform engineered for client installations (corporations, creative studios, journalism publications, and independent editorial platforms). It bridges two distinct operational modes:

1. **The Editorial Experience:** A focused, high-efficiency operational workspace for writers, editors, and administrators.
2. **The Public Publishing Experience:** A refined, authoritative, typographic-first reading surface for audiences and search engines.

### Core Principles

- **Quiet Craftsmanship Over Digital Slop:** Avoid generic AI templates, floating purple/cyan gradient orbs, and arbitrary card grids. Content and typography take precedence; UI decoration recedes.
- **Typographic Authority:** Rooted in the traditions of Swiss editorial design and classic print journalism. High contrast, precise vertical rhythm, comfortable line measures (65–75 characters), and harmonious scale.
- **State Transparency & Resilient States:** Every view must account for all six lifecycle states: Ideal, Loading, Empty, Error, Success, and Permission Denied.
- **Deterministic Accessibility (WCAG 2.2 AA):** Accessibility is not a post-launch audit; it is a structural invariant. High contrast (>=4.5:1 text, >=3:1 UI boundaries), visible focus rings, full keyboard traversability, and explicit reduced-motion accommodations are non-negotiable.
- **Single-Source Design Tokens:** All colors, spacing units, and typography scales are defined via semantic CSS custom properties and consumed by Tailwind CSS classes. Ad-hoc hex values and arbitrary utility values (e.g., `text-[#123456]`) are strictly prohibited.

---

## 2. Dual Experience Visual Direction

### 2.1. Editorial Experience (Workspace & CMS Admin)

The editorial UI is an **App Screen** designed for daily, prolonged cognitive work. Following `design-taste-frontend` and `ui-ux-pro-max` app-screen guidelines:

- **Visual Tone:** Quiet, structured, calm, high utility. Neutral grey surfaces with crisp 1px borders, subtle paneling, and dense table/form layouts.
- **Status Clarity:** Content publication state (`Draft`, `In Review`, `Scheduled`, `Published`, `Archived`) must be immediately discernible at a glance through semantic badges.
- **Predictable Control Layout:** Primary actions (e.g., "Save Draft", "Submit for Review", "Publish") are positioned consistently in fixed header/footer utility bars. Destructive actions (e.g., "Delete Post") require double confirmation and are separated from benign actions.
- **Payload CMS Extension Model:** Custom components injected into Payload CMS (custom fields, custom views, dashboard widgets) must adopt Payload's native CSS variables and design tokens rather than injecting conflicting third-party component libraries.

### 2.2. Public Publishing Experience (Reader & Publication Site)

The public UI is a **Reading Surface** optimized for immersion, comprehension, and performance:

- **Visual Tone:** Sophisticated, timeless, literary. High-contrast ink on crisp paper-white backgrounds.
- **Grid & Layout:** Fluid 12-column layout with deliberate asymmetrical whitespace options (e.g., 40/60 split for author notes/article body, or classical single-column longform with side annotations).
- **Media Presentation:** High-definition photography, rich text quotes, and embed slots framed with clean rectangular geometry. No decorative drop shadows or rounded pill frames on editorial media.
- **Zero Draft Leaks:** Server components strictly filter out unapproved/draft content before rendering the public tree.

---

## 3. Design Tokens

### 3.1. Color Tokens & Semantic Mappings

All colors are mapped to CSS custom variables supporting both Light Mode (default) and Dark Mode with strict contrast parity.

```css
:root {
  /* Surface & Background */
  --bg-canvas: #FAFAF9;              /* Warm off-white / newsprint */
  --bg-surface: #FFFFFF;             /* Pure white card / panel */
  --bg-surface-elevated: #F4F4F5;    /* Slightly elevated panel / hover */
  --bg-muted: #E4E4E7;               /* Subtle container background */

  /* Ink & Typography */
  --text-primary: #09090B;          /* Pitch black ink (21:1 on white) */
  --text-secondary: #52525B;        /* Editorial slate (5.8:1 on white, passes AA) */
  --text-muted: #71717A;            /* Captions, timestamps (4.6:1 on white) */
  --text-inverse: #FAFAFA;          /* Text on dark fills */

  /* Borders & Dividers */
  --border-subtle: #E4E4E7;         /* Crisp 1px rule */
  --border-strong: #A1A1AA;         /* Active / hovered border */
  --border-focus: #09090B;          /* Keyboard focus ring */

  /* Brand & Editorial Accents */
  --brand-primary: #0F172A;         /* Deep editorial obsidian */
  --brand-accent: #B45309;          /* Warm artisan ochre / amber (4.8:1 on white) */
  --brand-accent-hover: #92400E;    /* Darker ochre for hover states */

  /* Status Tokens */
  --status-draft-bg: #F1F5F9;
  --status-draft-text: #475569;
  --status-review-bg: #FEF3C7;
  --status-review-text: #92400E;
  --status-scheduled-bg: #E0E7FF;
  --status-scheduled-text: #3730A3;
  --status-published-bg: #DCFCE7;
  --status-published-text: #166534;
  --status-destructive-bg: #FEE2E2;
  --status-destructive-text: #991B1B;
}

[data-theme='dark'] {
  --bg-canvas: #09090B;              /* Deep obsidian dark ground */
  --bg-surface: #18181B;             /* Dark panel */
  --bg-surface-elevated: #27272A;    /* Elevated surface */
  --bg-muted: #27272A;

  --text-primary: #FAFAFA;          /* Crisp light ink (18:1 on dark) */
  --text-secondary: #A1A1AA;        /* Slate body (5.6:1 on dark) */
  --text-muted: #71717A;
  --text-inverse: #09090B;

  --border-subtle: #27272A;
  --border-strong: #52525B;
  --border-focus: #FAFAFA;

  --brand-primary: #FAFAFA;
  --brand-accent: #F59E0B;          /* Brighter amber for dark contrast (8.2:1 on dark) */
  --brand-accent-hover: #FBBF24;

  --status-draft-bg: #1E293B;
  --status-draft-text: #94A3B8;
  --status-review-bg: #451A03;
  --status-review-text: #FCD34D;
  --status-scheduled-bg: #1E1B4B;
  --status-scheduled-text: #A5B4FC;
  --status-published-bg: #052E16;
  --status-published-text: #86EFAC;
  --status-destructive-bg: #450A0A;
  --status-destructive-text: #FCA5A5;
}
```

### 3.2. Typography Tokens & Scale

Foundry Studio implements a dual font-family pairing:
- **Headings & Mastheads:** High-character editorial serif (e.g., `Newsreader`, `Libre Baskerville`, or system serif fallback).
- **Body & Editorial Workspace:** Highly legible, clean humanist/geometric sans-serif (e.g., `Public Sans`, `Inter`, or system sans fallback).

| Token | Size | Line Height | Tracking | Recommended Use |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | 3.5rem (56px) | 1.1 | -0.025em | Main publication masthead / Hero title |
| `text-h1` | 2.5rem (40px) | 1.15 | -0.02em | Article headline (Desktop) |
| `text-h2` | 1.875rem (30px) | 1.25 | -0.015em | Major section headers, Collection titles |
| `text-h3` | 1.5rem (24px) | 1.3 | -0.01em | Subsections, Card headlines |
| `text-lead` | 1.25rem (20px) | 1.5 | 0 | Standfirst, Article introductory summaries |
| `text-body` | 1.0rem (16px) | 1.65 | 0 | Standard longform body reading |
| `text-ui` | 0.875rem (14px) | 1.4 | 0 | Admin forms, table cells, metadata, buttons |
| `text-caption` | 0.75rem (12px) | 1.4 | +0.02em | Photo captions, status badges, timestamps |

**Reading Geometry Rule:** Longform article bodies (`text-body`) must have an enforced maximum line length of `68ch` (`max-w-prose`) to maintain optimal visual reading comfort and prevent eye fatigue.

### 3.3. Spacing Scale

Based on an 8pt primary spatial grid with 4pt half-steps for micro-components:

```css
--space-1:  0.25rem;  /* 4px  - icon gaps, badge internal padding */
--space-2:  0.5rem;   /* 8px  - form input padding-y, tight item gap */
--space-3:  0.75rem;  /* 12px - button padding-y, card internal micro-gap */
--space-4:  1.0rem;   /* 16px - standard component padding, form element gap */
--space-6:  1.5rem;   /* 24px - card internal padding, panel spacing */
--space-8:  2.0rem;   /* 32px - section spacing in admin workspace */
--space-12: 3.0rem;   /* 48px - sub-feature separations */
--space-16: 4.0rem;   /* 64px - article section spacing */
--space-24: 6.0rem;   /* 96px - major editorial hero/chapter separations */
```

### 3.4. Borders, Radii, and Elevation

- **Radii:**
  - `radius-none`: `0px` — Used for architectural images, full-bleed containers, print-like layout dividers.
  - `radius-sm`: `3px` — Badges, chips, small code snippets.
  - `radius-md`: `6px` — Standard buttons, inputs, modal containers, and cards.
  - `radius-full`: `9999px` — Strictly for status indicator dots or circular avatars. **Never** use pill-shaped buttons for editorial CTAs.
- **Borders:**
  - Standard border width is strictly `1px solid var(--border-subtle)`.
  - Focused interactive controls use `2px solid var(--border-focus)`.
- **Elevation / Shadows:**
  - Avoid soft diffuse blurred floating shadows ("Apple-style" or "neumorphic" blur).
  - Use subtle, tight boundary elevation:
    - `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (card resting state)
    - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)` (modals & popovers)

---

## 4. Responsive Breakpoints

Foundry Studio tests and certifies four primary viewports:

| Breakpoint | Target Width | Typical Hardware Target | Core Layout Behavior |
| :--- | :--- | :--- | :--- |
| **Mobile (`sm`)** | `375px` – `639px` | Modern smartphones | Single-column stack, full-width touch targets (>=44px), collapsible navdrawer. |
| **Tablet (`md`)** | `768px` – `1023px` | iPad, tablet portrait/landscape | 2-column editorial grids, persistent sidebars collapsed to icons or slide-overs. |
| **Desktop (`lg`)** | `1024px` – `1439px` | Realistic laptops, standard monitors | Full editorial multi-column layouts, sticky metadata sidebars, split-screen editor previews. |
| **Wide (`xl`/`2xl`)**| `1440px+` | External displays, 4K monitors | Centered layout with maximum reading boundary (`max-w-7xl`), expanded margins for margin notes. |

---

## 5. Interaction States & Transitions

### 5.1. Interactive Lifecycle Rules

All clickable or interactive elements (`<a>`, `<button>`, inputs, list row actions) must define explicit visual styles for:

1. **Resting:** Clear visual boundary, unmistakable interactive cue (cursor: pointer).
2. **Hover:** 150ms–200ms ease-out transition. Subtle background shift (`bg-surface-elevated`) or text color change. No aggressive scaling (no `scale-110`).
3. **Focus-Visible:** Essential for keyboard navigation. A distinct `2px solid var(--border-focus)` outline with `2px` offset. Never disable `outline` without providing an equal-or-better focus indicator.
4. **Active (Pressed):** Instant response (0ms–50ms) with subtle visual feedback (e.g., slight background darkening or `translate-y-px`).
5. **Disabled:** Visual de-emphasis (`opacity-50`), `cursor-not-allowed`, and accessibility tags (`aria-disabled="true"`).

### 5.2. Motion & Reduced Motion Standards

- **Functional Purpose Only:** Motion is permitted only to communicate state change, spatial continuity (modals opening/closing), or progressive disclosure (accordions). Purely ornamental bouncing, continuous rotating badges, or automatic marquee animations are banned.
- **Timing:** 150ms–250ms with ease-out timing curve `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Reduced Motion Requirement:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 6. Accessibility & WCAG 2.2 AA Compliance

1. **Contrast Ratio Strictness:**
   - Normal text (< 18pt or < 14pt bold): minimum **4.5:1** contrast against background.
   - Large text (>= 18pt or >= 14pt bold): minimum **3.0:1** contrast against background.
   - Essential UI components and active borders: minimum **3.0:1** contrast.
2. **Target Sizing (Touch & Pointer):**
   - Interactive touch targets must meet the minimum size of **44 × 44 CSS pixels** on mobile/tablet viewports.
3. **Accessible Forms & Error Handling:**
   - Every input must have an associated, programmatically linked `<label>` (using `htmlFor` / `id`).
   - Placeholder text is **never** a replacement for a label.
   - Validation errors must appear adjacent to the field with `aria-describedby` pointing to the error message ID and `aria-invalid="true"` set on the input.
4. **Iconography & Visual Elements:**
   - Use clean, scalable SVG icons (Lucide or Heroicons).
   - **Strict prohibition:** Never use emojis (e.g., 📝, 🚀, ❌) as icons for functional UI actions.
   - Standalone icon buttons (no visible text) must provide an accessible label via `aria-label` or visually hidden screen reader text (`sr-only`). Decorative icons must have `aria-hidden="true"`.

---

## 7. Component Architecture Conventions

1. **Atomic & Focused:** Build UI components in `src/components/` grouped by domain (`src/components/ui/` for primitive buttons, badges, inputs; `src/components/editorial/` for article cards, mastheads, author bios).
2. **Server-First by Default:** All components are Next.js Server Components unless interactive browser APIs, event listeners, or React client state (`useState`, `useEffect`) are explicitly required. Mark client boundaries with `'use client'` at the lowest possible sub-tree leaf.
3. **Resilient State Handling:** Every container or list component must implement:
   - **Loading State:** Skeleton loaders matching the real geometric layout of the loaded content (no generic centered spinning wheels).
   - **Empty State:** Honest, helpful editorial copy explaining what belongs here and how to create the first item.
   - **Error State:** Clear, non-technical explanation with an actionable recovery option ("Try Again" button).
4. **Safe Rich Text:** Lexical rich text output must be sanitized and rendered through approved semantic server components. Never execute raw `dangerouslySetInnerHTML` with untrusted markup.

---

## 8. Explicit Anti-Patterns to Avoid

- ❌ **No AI Slop Gradients:** No vibrant neon-purple-to-hot-pink diagonal gradients on buttons or hero backgrounds.
- ❌ **No Arbitrary Three-Card Clones:** No generic marketing rows with three identical icon-in-tinted-circle feature cards.
- ❌ **No Emojis as UI Icons:** Functional controls must use crisp, consistent SVG icons with accessibility labels.
- ❌ **No Low-Contrast Gray Text:** Never use faint `#9CA3AF` body text on white backgrounds. Text contrast must be verified at >=4.5:1.
- ❌ **No Unlabeled Icon Buttons:** Every button must either have visible text or an accessible `aria-label`.
- ❌ **No Hardcoded Hex Values in Markup:** All colors must flow through semantic tokens (`var(--text-primary)`, `var(--bg-surface)`).
- ❌ **No Pill Buttons for Editorial CTAs:** Avoid hyper-rounded bubble buttons in formal publishing contexts.
- ❌ **No Disabling Keyboard Focus:** Removing `outline: none` without providing a visible focus ring is a critical accessibility failure.
- ❌ **No Leaking Draft Articles:** Draft or unverified editorial revisions must never be rendered in public routes, RSS feeds, or sitemaps.

---

## 9. Extending the Design System

When new components or custom editorial views are introduced in future milestones:

1. **Check Existing Tokens First:** Map the requirements onto existing color, spacing, and typography scales before proposing additions.
2. **Consult Installed Skills:**
   - For public pages and visual art direction, consult `design-taste-frontend` (`.agents/skills/design-taste-frontend/SKILL.md`).
   - For UI component specifications, UX accessibility rules, and layout constraints, run `ui-ux-pro-max` search:
     ```bash
     python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
     ```
3. **Document Token Shifts in ADRs:** Any addition of major design tokens, color scales, or typography providers requires updating `docs/DESIGN_SYSTEM.md` and logging an ADR if architectural conventions change.
