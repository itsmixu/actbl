---
name: actbl Design System
colors:
  surface: '#fff8f6'
  surface-dim: '#e9d6d1'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#fdeae4'
  surface-container-high: '#f7e4df'
  surface-container-highest: '#f1dfd9'
  on-surface: '#231916'
  on-surface-variant: '#56423c'
  inverse-surface: '#392e2b'
  inverse-on-surface: '#ffede8'
  outline: '#89726b'
  outline-variant: '#dcc1b8'
  surface-tint: '#9d4324'
  primary: '#9a4021'
  on-primary: '#ffffff'
  primary-container: '#b95837'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59d'
  secondary: '#5f5f57'
  on-secondary: '#ffffff'
  secondary-container: '#e5e3d9'
  on-secondary-container: '#65655d'
  tertiary: '#006768'
  on-tertiary: '#ffffff'
  tertiary-container: '#008283'
  on-tertiary-container: '#f3fffe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390b00'
  on-primary-fixed-variant: '#7e2c0e'
  secondary-fixed: '#e5e3d9'
  secondary-fixed-dim: '#c8c7bd'
  on-secondary-fixed: '#1b1c16'
  on-secondary-fixed-variant: '#474740'
  tertiary-fixed: '#89f4f4'
  tertiary-fixed-dim: '#6cd7d8'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#004f50'
  background: '#fff8f6'
  on-background: '#231916'
  surface-variant: '#f1dfd9'
  parchment-bg: '#f5f4ed'
  ivory-surface: '#faf9f5'
  near-black-text: '#141413'
  olive-gray: '#5e5d59'
  terracotta-brand: '#c96442'
  coral-accent: '#d97757'
  error-crimson: '#b53333'
  focus-blue: '#3898ec'
  warm-sand: '#e8e6dc'
  charcoal-warm: '#4d4c48'
  stone-gray: '#87867f'
  border-cream: '#f0eee6'
  bg-dark: '#141413'
  surface-dark: '#1c1b19'
  text-dark-primary: '#ede9df'
  brand-dark: '#d4693e'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 64px
    fontWeight: '500'
    lineHeight: '1.10'
  section-heading:
    fontFamily: Newsreader
    fontSize: 52px
    fontWeight: '500'
    lineHeight: '1.20'
  sub-heading-lg:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '500'
    lineHeight: '1.30'
  sub-heading:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.10'
  feature-title:
    fontFamily: Newsreader
    fontSize: 20.8px
    fontWeight: '500'
    lineHeight: '1.20'
  body-large:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.60'
  body-standard:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.60'
  body-ui-bold:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.25'
  caption:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.43'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.30'
    letterSpacing: 0.12px
  overline:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '400'
    lineHeight: '1.60'
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  '3': 3px
  '4': 4px
  '6': 6px
  '8': 8px
  '10': 10px
  '12': 12px
  '16': 16px
  '20': 20px
  '24': 24px
  '30': 30px
  section-gap-lg: 120px
  section-gap-md: 80px
  card-padding: 24px
---

# actbl Design System

## 1. Visual Theme & Atmosphere

actbl is a focused accountability tool — warm enough to feel like a supportive coach, serious enough to mean it. The entire experience is built on a parchment-toned canvas (`#f5f4ed`) that feels grounded and deliberate rather than digital and sterile. This isn't a clinical productivity tracker, and it isn't a casual journal — it occupies the space between the two: a place where you commit to things and actually follow through.

The typographic approach uses a medium-weight serif for headings that commands attention without shouting, paired with a clean sans-serif for all functional UI. Every line of copy should feel like it was written with intention — no filler, no hand-holding. The tone is direct, warm, and honest. Think: the friend who checks in on you and actually means it.

The color palette is warm throughout — terracotta (`#c96442`) as the primary action color, parchment as the canvas, and exclusively yellow-brown-tinted neutrals. There are no cool blue-grays anywhere. This warmth keeps the app from feeling punishing or clinical even when the content is about missed tasks or difficult weeks. Accountability should feel human, not corporate.

**Key Characteristics:**
- Warm parchment canvas (`#f5f4ed`) — grounded and focused, not sterile
- Serif for headings, sans for all UI — authority without decoration
- Terracotta brand accent (`#c96442`) — action-forward, warm, high-signal
- Exclusively warm-toned neutrals — every gray has a yellow-brown undertone
- Minimal illustration use — UI does the heavy lifting, visuals support not distract
- Ring-based shadow system (`0px 0px 0px 1px`) for clean, purposeful depth
- Focused spacing — generous enough to breathe, tight enough to keep momentum

## 2. Color Palette & Roles

### Primary
- **Near Black** (`#141413`): The primary text color and dark-theme surface — a warm, olive-tinted dark that's easier to read for extended sessions. Used for all body copy and primary UI text.
- **Terracotta Brand** (`#c96442`): The core action color — a burnt orange-brown reserved for primary CTAs and high-signal moments. When this color appears, something important is happening.
- **Coral Accent** (`#d97757`): A lighter, warmer variant used for text accents, links on dark surfaces, and secondary emphasis.

### Secondary & Accent
- **Error Crimson** (`#b53333`): Deep warm red for error and missed-task states — visible and honest without being alarming.
- **Focus Blue** (`#3898ec`): Input focus rings only — the single cool color in the system, used purely for accessibility compliance.

### Surface & Background
- **Parchment** (`#f5f4ed`): The primary background — a warm cream that feels grounded and analog. Not a productivity dashboard, not a blank page. A working surface.
- **Ivory** (`#faf9f5`): The card surface — slightly lighter than Parchment, creating a clean lift for content containers without introducing visual noise.
- **Pure White** (`#ffffff`): Reserved for maximum-contrast interactive elements only.
- **Warm Sand** (`#e8e6dc`): Secondary button backgrounds and interactive surfaces — noticeably warm, clearly tappable.
- **Dark Surface** (`#30302e`): Dark-theme containers and elevated dark elements — warm charcoal that never reads as cold.
- **Deep Dark** (`#141413`): Dark-theme page background and primary dark surface.

### Neutrals & Text
- **Charcoal Warm** (`#4d4c48`): Button text on light warm surfaces — the go-to dark-on-light text.
- **Olive Gray** (`#5e5d59`): Secondary body text — a distinctly warm medium-dark gray.
- **Stone Gray** (`#87867f`): Tertiary text, footnotes, and de-emphasized metadata.
- **Dark Warm** (`#3d3d3a`): Dark text links and emphasized secondary text.
- **Warm Silver** (`#b0aea5`): Text on dark surfaces — a warm, parchment-tinted light gray.

### Semantic & Accent
- **Border Cream** (`#f0eee6`): Standard light-theme border — barely visible warm cream, creating the gentlest possible containment.
- **Border Warm** (`#e8e6dc`): Prominent borders, section dividers, and emphasized containment on light surfaces.
- **Border Dark** (`#30302e`): Standard border on dark surfaces — maintains the warm tone.
- **Ring Warm** (`#d1cfc5`): Shadow ring color for button hover/focus states.
- **Ring Subtle** (`#dedc01`): Secondary ring variant for lighter interactive surfaces.
- **Ring Deep** (`#c2c0b6`): Deeper ring for active/pressed states.

### Gradient System
- actbl is **gradient-free**. Depth comes from warm surface tone layering, not decorative gradients. The palette creates natural visual progression — cream → sand → stone → charcoal → black — without introducing anything that distracts from the content.

---

## 2b. Dark Mode Palette

Dark mode keeps the same warm, grounded identity — it doesn't flip to cold blue-black like most apps. Every dark surface has an olive-charcoal undertone. The background feels like a dimly lit workspace, not a void. Terracotta remains the primary action color and is the one thing that stays bright in an otherwise muted environment.

### Dark Mode Backgrounds & Surfaces

| Role | Token | Hex | Notes |
|------|-------|-----|-------|
| Page Background | `bg-dark` | `#141413` | Near Black — deep warm charcoal, the base of everything |
| Card Surface | `surface-dark` | `#1c1b19` | Slightly above background — primary content container |
| Elevated Card | `surface-dark-raised` | `#242220` | Modals, popovers, overlays — clearly lifted from base |
| Section Bar / Nav | `surface-dark-bar` | `#1e1d1b` | Tab bars, section headers, sticky elements |
| Input Background | `input-dark` | `#222120` | Form fields — distinct from card surface without being jarring |
| Pressed / Active State | `surface-dark-active` | `#2a2826` | Touch feedback on interactive surfaces |

### Dark Mode Text

| Role | Token | Hex | Notes |
|------|-------|-----|-------|
| Primary Text | `text-dark-primary` | `#ede9df` | Warm off-white with a cream tint — never pure white |
| Secondary Text | `text-dark-secondary` | `#a8a59c` | The warm-gray workhorse for labels, subtitles, metadata |
| Tertiary / Muted Text | `text-dark-tertiary` | `#6e6b63` | Timestamps, disabled states, de-emphasized info |
| Inverse Text (on Terracotta) | `text-on-brand` | `#faf9f5` | Ivory — used for text on Terracotta buttons |

### Dark Mode Brand & Actions

| Role | Token | Hex | Notes |
|------|-------|-----|-------|
| Terracotta Brand | `brand-dark` | `#d4693e` | Slightly brightened from light-mode `#c96442` — maintains pop against dark surfaces |
| Coral Accent | `coral-dark` | `#e08060` | Lightened for dark backgrounds — links, secondary highlights |
| Destructive / Error | `error-dark` | `#d94f4f` | Brighter than light-mode crimson — must be readable against dark |
| Focus Ring | `focus-dark` | `#3898ec` | Same Focus Blue as light mode — accessibility compliance |

### Dark Mode Borders & Rings

| Role | Token | Hex | Notes |
|------|-------|-----|-------|
| Standard Border | `border-dark` | `#2a2826` | Subtle warm separator between cards and sections |
| Prominent Border | `border-dark-strong` | `#333028` | Section dividers, emphasized containers |
| Ring (hover/focus) | `ring-dark` | `#3d3a35` | Ring shadow color for interactive element states |
| Ring (active/pressed) | `ring-dark-deep` | `#4a4640` | Deeper ring for pressed/active feedback |

### Dark Mode Semantic Mapping

Each light-mode role maps directly to a dark-mode equivalent:

| Light Role | Light Hex | → | Dark Role | Dark Hex |
|------------|-----------|---|-----------|----------|
| Parchment (bg) | `#f5f4ed` | → | Near Black (bg) | `#141413` |
| Ivory (card) | `#faf9f5` | → | Dark Card | `#1c1b19` |
| Warm Sand (interactive) | `#e8e6dc` | → | Dark Active | `#2a2826` |
| Near Black (text) | `#141413` | → | Warm Off-White (text) | `#ede9df` |
| Olive Gray (secondary) | `#5e5d59` | → | Warm Mid-Gray | `#a8a59c` |
| Stone Gray (tertiary) | `#87867f` | → | Muted Warm Gray | `#6e6b63` |
| Terracotta Brand | `#c96442` | → | Terracotta (brightened) | `#d4693e` |
| Border Cream | `#f0eee6` | → | Dark Border | `#2a2826` |
| Border Warm | `#e8e6dc` | → | Dark Border Strong | `#333028` |
| Ring Warm | `#d1cfc5` | → | Dark Ring | `#3d3a35` |

### Dark Mode Rules

- **Keep it warm**: Never introduce cool blue-gray or pure black (`#000000`). The warmest dark backgrounds (`#141413`, `#1c1b19`) must retain their olive undertone.
- **No pure white text**: Primary text is `#ede9df` — the cream tint keeps it from reading as harsh on warm dark surfaces.
- **Terracotta stays bold**: It's the one color that lifts visually in dark mode. Don't dilute it — it's the user's primary action signal.
- **Elevation through lightness**: Surfaces get progressively lighter as they rise — bg → card → elevated card. This replaces the drop shadow approach with surface tone itself.
- **System status colors (error, focus) stay close to light-mode values** — users have learned to associate blue focus rings and red errors; don't subvert those expectations.

---

## 3. Typography Rules

### Font Family
- **Headline**: `Anthropic Serif`, with fallback: `Georgia`
- **Body / UI**: `Anthropic Sans`, with fallback: `Arial`
- **Code**: `Anthropic Mono`, with fallback: `Arial`

*Note: These are custom typefaces. For external implementations, Georgia serves as the serif substitute and system-ui/Inter as the sans substitute.*

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / Hero | Anthropic Serif | 64px (4rem) | 500 | 1.10 (tight) | normal | Maximum impact, book-title presence |
| Section Heading | Anthropic Serif | 52px (3.25rem) | 500 | 1.20 (tight) | normal | Feature section anchors |
| Sub-heading Large | Anthropic Serif | 36–36.8px (~2.3rem) | 500 | 1.30 | normal | Secondary section markers |
| Sub-heading | Anthropic Serif | 32px (2rem) | 500 | 1.10 (tight) | normal | Card titles, feature names |
| Sub-heading Small | Anthropic Serif | 25–25.6px (~1.6rem) | 500 | 1.20 | normal | Smaller section titles |
| Feature Title | Anthropic Serif | 20.8px (1.3rem) | 500 | 1.20 | normal | Small feature headings |
| Body Serif | Anthropic Serif | 17px (1.06rem) | 400 | 1.60 (relaxed) | normal | Serif body text (editorial passages) |
| Body Large | Anthropic Sans | 20px (1.25rem) | 400 | 1.60 (relaxed) | normal | Intro paragraphs |
| Body / Nav | Anthropic Sans | 17px (1.06rem) | 400–500 | 1.00–1.60 | normal | Navigation links, UI text |
| Body Standard | Anthropic Sans | 16px (1rem) | 400–500 | 1.25–1.60 | normal | Standard body, button text |
| Body Small | Anthropic Sans | 15px (0.94rem) | 400–500 | 1.00–1.60 | normal | Compact body text |
| Caption | Anthropic Sans | 14px (0.88rem) | 400 | 1.43 | normal | Metadata, descriptions |
| Label | Anthropic Sans | 12px (0.75rem) | 400–500 | 1.25–1.60 | 0.12px | Badges, small labels |
| Overline | Anthropic Sans | 10px (0.63rem) | 400 | 1.60 | 0.5px | Uppercase overline labels |
| Micro | Anthropic Sans | 9.6px (0.6rem) | 400 | 1.60 | 0.096px | Smallest text |
| Code | Anthropic Mono | 15px (0.94rem) | 400 | 1.60 | -0.32px | Inline code, terminal |

### Principles
- **Serif for headings, sans for everything else**: Serif headings establish section weight and visual hierarchy — they signal "this matters, pay attention." Sans-serif handles all functional UI with clarity and zero friction.
- **Single weight for serifs**: All serif headings use weight 500 — consistent, intentional, no variation. One voice across all heading levels.
- **Readable body line-height**: Body text uses 1.60 line-height. Users read task notes, check-in summaries, and friend messages in real contexts — legibility is non-negotiable.
- **Tight headings, open body**: Headings sit at 1.10–1.30 line-height — compact and confident. Body content breathes. The contrast reinforces visual hierarchy.
- **Letter-spacing on small labels**: Text at 12px and below uses 0.12px–0.5px letter-spacing to maintain legibility at compact sizes where labels, badges, and metadata live.

## 4. Component Stylings

### Buttons

**Warm Sand (Secondary)**
- Background: Warm Sand (`#e8e6dc`)
- Text: Charcoal Warm (`#4d4c48`)
- Padding: 0px 12px 0px 8px (asymmetric — icon-first layout)
- Radius: comfortably rounded (8px)
- Shadow: ring-based (`#e8e6dc 0px 0px 0px 0px, #d1cfc5 0px 0px 0px 1px`)
- The workhorse button — warm, unassuming, clearly interactive

**White Surface**
- Background: Pure White (`#ffffff`)
- Text: Anthropic Near Black (`#141413`)
- Padding: 8px 16px 8px 12px
- Radius: generously rounded (12px)
- Hover: shifts to secondary background color
- Clean, elevated button for light surfaces

**Dark Charcoal**
- Background: Dark Surface (`#30302e`)
- Text: Ivory (`#faf9f5`)
- Padding: 0px 12px 0px 8px
- Radius: comfortably rounded (8px)
- Shadow: ring-based (`#30302e 0px 0px 0px 0px, ring 0px 0px 0px 1px`)
- The inverted variant for dark-on-light emphasis

**Brand Terracotta**
- Background: Terracotta Brand (`#c96442`)
- Text: Ivory (`#faf9f5`)
- Radius: 8–12px
- Shadow: ring-based (`#c96442 0px 0px 0px 0px, #c96442 0px 0px 0px 1px`)
- The primary CTA — the only button with chromatic color

**Dark Primary**
- Background: Anthropic Near Black (`#141413`)
- Text: Warm Silver (`#b0aea5`)
- Padding: 9.6px 16.8px
- Radius: generously rounded (12px)
- Border: thin solid Dark Surface (`1px solid #30302e`)
- Used on dark theme surfaces

### Cards & Containers
- Background: Ivory (`#faf9f5`) or Pure White (`#ffffff`) on light surfaces; Dark Surface (`#30302e`) on dark
- Border: thin solid Border Cream (`1px solid #f0eee6`) on light; `1px solid #30302e` on dark
- Radius: comfortably rounded (8px) for standard cards; generously rounded (16px) for featured; very rounded (32px) for hero containers and embedded media
- Shadow: whisper-soft (`rgba(0,0,0,0.05) 0px 4px 24px`) for elevated content
- Ring shadow: `0px 0px 0px 1px` patterns for interactive card states
- Section borders: `1px 0px 0px` (top-only) for list item separators

### Inputs & Forms
- Text: Anthropic Near Black (`#141413`)
- Padding: 1.6px 12px (very compact vertical)
- Border: standard warm borders
- Focus: ring with Focus Blue (`#3898ec`) border-color — the only cool color moment
- Radius: generously rounded (12px)

### Navigation
- Sticky top nav with warm background
- Logo: Claude wordmark in Anthropic Near Black
- Links: mix of Near Black (`#141413`), Olive Gray (`#5e5d59`), and Dark Warm (`#3d3d3a`)
- Nav border: `1px solid #30302e` (dark) or `1px solid #f0eee6` (light)
- CTA: Terracotta Brand button or White Surface button
- Hover: text shifts to foreground-primary, no decoration

### Image Treatment
- App screenshots and UI previews use generous border-radius (12–16px)
- Profile avatars: fully rounded (50% radius), warm border or ring shadow
- No decorative illustrations — UI content should be self-explanatory
- Dark UI surfaces provide contrast against the light Parchment canvas
- If onboarding screens require visuals, keep them minimal and purposeful — one clear message per image

### Distinctive Components

**Task Cards**
- Each task is a contained card on Ivory (`#faf9f5`) with a Border Cream border
- Task title in Serif at 20px, completion status clearly represented (Terracotta fill = done)
- Accountability friend name in Stone Gray if assigned — visible but not the focus

**Weekly Check-In Block**
- The primary completion moment — uses Near Black or Terracotta as a signal that this is important
- Copy is direct: what did you do, what did you miss, what's next
- No decorative elements — the weight comes from the content

**Poke / Nudge Row**
- Compact notification-style row — friend name, message, two action buttons
- Terracotta for the primary action (respond), Warm Sand for dismiss
- Should feel lightweight — a small prompt, not a wall of information

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 3px, 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px, 30px
- Button padding: asymmetric (0px 12px 0px 8px) or balanced (8px 16px)
- Card internal padding: approximately 24–32px
- Section vertical spacing: generous (estimated 80–120px between major sections)

### Grid & Container
- Max container width: approximately 1200px, centered
- Screens: single-column mobile-first, task list takes vertical priority
- Task and friend cards: single column on mobile, can expand to 2 columns on wider layouts
- Full-width dark sections for high-stakes moments (check-in submission, week summary)
- Avoid multi-column layouts for primary task content — linear focus is intentional

### Whitespace Philosophy
- **Purposeful breathing room**: Spacing is generous enough that nothing feels cramped, but tight enough that the user stays focused. Every gap should serve a reason — group related content, separate distinct actions.
- **Hierarchy through space**: More space above a heading than below it. Task items sit closer to their context than to surrounding sections. Space communicates structure without requiring explicit dividers.
- **No decorative padding**: Padding exists to aid legibility and touch targets, not to add visual softness. If a spacing choice can't be justified by content or usability, it should be removed.

### Border Radius Scale
- Sharp (4px): Minimal inline elements
- Subtly rounded (6–7.5px): Small buttons, secondary interactive elements
- Comfortably rounded (8–8.5px): Standard buttons, cards, containers
- Generously rounded (12px): Primary buttons, input fields, nav elements
- Very rounded (16px): Featured containers, video players, tab lists
- Highly rounded (24px): Tag-like elements, highlighted containers
- Maximum rounded (32px): Hero containers, embedded media, large cards

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, no border | Parchment background, inline text |
| Contained (Level 1) | `1px solid #f0eee6` (light) or `1px solid #30302e` (dark) | Standard cards, sections |
| Ring (Level 2) | `0px 0px 0px 1px` ring shadows using warm grays | Interactive cards, buttons, hover states |
| Whisper (Level 3) | `rgba(0,0,0,0.05) 0px 4px 24px` | Elevated feature cards, product screenshots |
| Inset (Level 4) | `inset 0px 0px 0px 1px` at 15% opacity | Active/pressed button states |

**Shadow Philosophy**: Depth is communicated through **warm-toned ring shadows** rather than traditional drop shadows. The `0px 0px 0px 1px` pattern creates a contained, border-like halo that is softer than an actual border — precise without being harsh. When drop shadows do appear, they are extremely soft (0.05 opacity, 24px blur) — a barely perceptible lift that suggests the element is active, not floating.

### Depth in Practice
- **Light/Dark alternation**: The sharpest depth shift comes from toggling between Parchment (`#f5f4ed`) and Near Black (`#141413`) surfaces — used deliberately to separate primary content zones (tasks, check-ins, accountability).
- **Warm ring halos**: Interactive elements use ring shadows that stay in the warm palette — never cool-toned or generic gray.

## 7. Do's and Don'ts

### Do
- Use Parchment (`#f5f4ed`) as the primary light background — warm, grounded, deliberate
- Use Serif at weight 500 for all headings — consistent authority across every heading level
- Reserve Terracotta Brand (`#c96442`) for primary actions and the highest-signal UI moments
- Keep all neutrals warm-toned — yellow-brown undertones on every gray
- Use ring shadows (`0px 0px 0px 1px`) for interactive states — clean depth without visual noise
- Maintain the serif/sans split — serif for section headings, sans for all UI and body
- Write UI copy that is direct and action-oriented — every label should earn its place
- Use generous body line-height (1.60) for comfortable reading in real usage contexts
- Apply soft border-radius (8–16px) — approachable without being decorative
- Prioritize scannability — users should be able to understand their week at a glance

### Don't
- Don't use cool blue-grays — the palette is exclusively warm-toned
- Don't use bold (700+) weight on Serif — weight 500 is the ceiling
- Don't introduce saturated colors beyond Terracotta — the palette is deliberately restrained
- Don't use sharp corners (< 6px radius) on interactive elements — softness is intentional
- Don't apply heavy drop shadows — depth comes from ring shadows and surface tone shifts
- Don't use pure white (`#ffffff`) as a page background — Parchment or Ivory are always correct
- Don't add decorative elements that don't serve the task — this is a productivity tool, not a portfolio
- Don't reduce body line-height below 1.40 — legibility under real conditions matters
- Don't use monospace fonts outside of code contexts
- Don't use vague, softened copy — "mark as done" not "let us know how it went"

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Small Mobile | <479px | Minimum layout, stacked everything, compact typography |
| Mobile | 479–640px | Single column, hamburger nav, reduced heading sizes |
| Large Mobile | 640–767px | Slightly wider content area |
| Tablet | 768–991px | 2-column grids begin, condensed nav |
| Desktop | 992px+ | Full multi-column layout, expanded nav, maximum hero typography (64px) |

### Touch Targets
- Buttons use generous padding (8–16px vertical minimum)
- Navigation links adequately spaced for thumb navigation
- Card surfaces serve as large touch targets
- Minimum recommended: 44x44px

### Collapsing Strategy
- **Navigation**: Bottom tab bar on mobile — primary navigation is always thumb-accessible
- **Task lists**: Single column on all mobile sizes — linear and unambiguous
- **Section headings**: 32px → 25px on mobile — still carries weight without crowding
- **Cards**: Full width on mobile, max ~480px on tablet
- **Section padding**: Reduces proportionally on smaller screens, but task rows should never feel cramped
- **Check-in blocks**: Always full width — these are high-focus interactions

### Image Behavior
- Product screenshots scale proportionally within rounded containers
- Illustrations maintain quality at all sizes
- Video embeds maintain 16:9 aspect ratio with rounded corners
- No art direction changes between breakpoints

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary Action: "Terracotta Brand (#c96442)"
- Page Background: "Parchment (#f5f4ed)"
- Card Surface: "Ivory (#faf9f5)"
- Primary Text: "Near Black (#141413)"
- Secondary Text: "Olive Gray (#5e5d59)"
- Tertiary / Meta Text: "Stone Gray (#87867f)"
- Borders (light): "Border Cream (#f0eee6)"
- Dark Surface: "Dark Surface (#30302e)"

### Example Component Prompts
- "Create a weekly task card on Ivory (#faf9f5) with a 1px solid Border Cream (#f0eee6) border and 8px rounded corners. Task title in Serif at 20px weight 500, Near Black (#141413). Status label in Olive Gray (#5e5d59) at 14px Sans. Completion toggle as a Terracotta (#c96442) filled circle when done. Add a whisper shadow (rgba(0,0,0,0.05) 0px 4px 24px)."
- "Design a weekly check-in summary section on Parchment (#f5f4ed). Section heading in Serif at 32px weight 500, line-height 1.10. Body text in Olive Gray (#5e5d59) at 16px Sans, 1.60 line-height. Use a Terracotta (#c96442) CTA button with Ivory text and 12px radius."
- "Build a dark accountability card on Near Black (#141413) with Ivory (#faf9f5) heading text in Serif at 25px weight 500. Friend name and task info in Warm Silver (#b0aea5) at 15px Sans. Border in Dark Surface (#30302e). Ring shadow on hover."
- "Create a primary action button in Terracotta (#c96442) with Ivory (#faf9f5) text, 12px radius, and a ring shadow (0px 0px 0px 1px #c96442). Padding: 9.6px 16.8px. Sans, weight 500."
- "Design a poke/nudge notification row on Ivory (#faf9f5). Friend name in Near Black (#141413) at 15px Sans weight 500. Message in Olive Gray (#5e5d59) at 14px. Action buttons: Terracotta for respond, Warm Sand (#e8e6dc) for dismiss. 8px radius throughout."

### Iteration Guide
1. Focus on ONE component at a time — complete it before moving to the next
2. Reference specific color names — "use Olive Gray (#5e5d59)" not "make it gray"
3. Always specify warm-toned variants — no cool grays anywhere
4. Describe serif vs sans usage explicitly — "Serif for the heading, Sans for the label"
5. For shadows, use "ring shadow (0px 0px 0px 1px)" or "whisper shadow" — never a generic drop shadow
6. Specify the surface — "on Parchment (#f5f4ed)" or "on Near Black (#141413)"
7. Copy should be direct and action-oriented — match the tone of a focused, supportive coach
