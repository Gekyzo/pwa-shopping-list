---
name: Utilitarian Market Ledger
colors:
  surface: '#f5faff'
  surface-dim: '#d5dbe0'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4fa'
  surface-container: '#e9eef4'
  surface-container-high: '#e3e9ee'
  surface-container-highest: '#dde3e9'
  on-surface: '#161c20'
  on-surface-variant: '#3f4942'
  inverse-surface: '#2b3135'
  inverse-on-surface: '#ecf1f7'
  outline: '#6f7a71'
  outline-variant: '#bec9c0'
  surface-tint: '#046c45'
  primary: '#005937'
  on-primary: '#ffffff'
  primary-container: '#13734b'
  on-primary-container: '#9ef5c3'
  inverse-primary: '#82d8a8'
  secondary: '#a23e18'
  on-secondary: '#ffffff'
  secondary-container: '#fe8357'
  on-secondary-container: '#6f2000'
  tertiary: '#404f57'
  on-tertiary: '#ffffff'
  tertiary-container: '#586770'
  on-tertiary-container: '#d5e5f0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9df5c3'
  primary-fixed-dim: '#82d8a8'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ffb59c'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#822801'
  tertiary-fixed: '#d5e5ef'
  tertiary-fixed-dim: '#b9c9d3'
  on-tertiary-fixed: '#0e1d25'
  on-tertiary-fixed-variant: '#3a4951'
  background: '#f5faff'
  on-background: '#161c20'
  surface-variant: '#dde3e9'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: '0'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: '0'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered specifically for fast-paced, high-distraction environments: the aisles of a supermarket under glare-heavy fluorescent overheads, navigating a cart with one hand while holding a mobile screen with the other. The aesthetic fuses clean Swiss functionalism with the physical tactile feel of a high-grade paper grocery slip.

### Aesthetic Principles
- **Glare-Defiant High Contrast:** Strict luminance pairing between charcoal slate and clean parchment off-white ensures immediate glanceability without eye strain.
- **Physical Ledger Tactility:** Strikethroughs, micro-depressions, and explicit border bounds provide the psychological reassurance of striking pencil across physical paper.
- **One-Handed Ergonomics:** Heavy anchoring towards the bottom two-thirds of the viewport. Critical actions reside strictly within natural thumb-sweep zones.
- **Utilitarian Speed:** Eliminates gratuitous decorative art, complex nested menus, and slow transitions in favor of instantaneous state toggling and legible iconography.

## Colors

The palette balances clinical legibility with warm, paper-derived undertones to soften harsh mobile glare without sacrificing contrast compliance.

### Functional Roles
- **Base Canvas (`#F9F8F5`):** A warm off-white surface resembling heavy uncoated bond paper. Diminishes harsh OLED white glare in bright market interiors.
- **Elevated Canvas (`#FFFFFF`):** High-clarity white reserved for active input surfaces, modal sheets, and list cards.
- **Primary Ink (`#1A2024`):** Near-black deep charcoal slate for items, quantities, and primary headlines. Delivers a minimum 13:1 contrast ratio against the paper base.
- **Muted Ink (`#5C656B`):** Neutral tone for secondary metadata, packaging units, and aisle markers.
- **Disabled / Struck Ink (`#8C959B`):** Reserved for crossed-off, completed inventory items.
- **Primary Action & Resolved Accent (`#13734B`):** Deep emerald green used for confirmed items, positive status badges, completed checkmarks, and primary action affordances.
- **Alert & Category Accent (`#C85A32`):** Terracotta amber used for price changes, out-of-stock warnings, expiry alerts, and promotional department chips.
- **Structure & Borders (`#E2DFD8`):** Uncoated-board divider lines ensuring structural clarity without optical clutter.

## Typography

The type system uses **Hanken Grotesk**, an open grotesque typeface featuring robust aperture size, stable baselines, and tall x-heights. It remains razor-sharp on mid-range Android screens even while the user is walking or holding a jostling device.

### Rules of Application
- **Primary Scan Items:** Rendered using `body-lg` at 500 (Medium) weight to guarantee optical punch over light-gray checked items.
- **Numeric Quantities:** Keep numeric characters aligned using tabular figures (`font-variant-numeric: tabular-nums`) to ensure fast vertical scanning across weights, prices, and piece counts.
- **Categorical Meta:** Section tags (e.g., "AISLE 4", "DAIRY") use `label-sm` in all caps with positive letter spacing (`0.04em`) to act as instant visual anchors.

## Layout & Spacing

A strictly mobile-first vertical stack engineered around thumb reaches and the minimum 56px interactive target boundary.

### Layout Mechanics
- **Single-Column Focus:** Content flows down a single primary column on mobile displays. Maximum content width is capped at 640px when rendered on larger devices, remaining centrally anchored.
- **The Lower-Third Thumb Zone:** The bottom 30% of the viewport is reserved for dynamic entry and execution (new item inputs, department filtering chips, quick quantity adjusters).
- **Physical Padding:** Item rows adhere to strict internal top/bottom padding (`space-md`) coupled with minimum height boundaries (`min-height: 56px`), mitigating accidental toggles when tapping quickly while walking.

## Elevation & Depth

To maximize battery efficiency and visibility under intense fluorescent shop lamps, this design system rejects blurry drop shadows and complex translucent skeuomorphism. Depth is achieved via **structural edge borders** and **tonal card grounding**.

### Elevation Hierarchy
- **Level 0 (Base Canvas):** Uncoated paper tone `#F9F8F5`. All category headers and scroll backdrops live here.
- **Level 1 (Card & List Rows):** Pure crisp white (`#FFFFFF`) with a 1px solid border (`#E2DFD8`). Elements feel crisp, defined, and flatly set into the screen.
- **Level 2 (Floating Action Docks & Sheets):** Grounded by a solid 1.5px border (`#D1CDC2`) complemented by an immediate hard offset ambient edge: `0 4px 12px rgba(26, 32, 36, 0.08)`. This keeps docked controls crisp without fading into background noise.
- **Level 3 (Pressed / Interactive Affirmation):** Inset micro-shadow (`inset 0 2px 4px rgba(0, 0, 0, 0.12)`) specifically utilized inside checkbox wells and depressed quantity steppers to validate tactile touch input instantly.

## Shapes

A balanced **Soft** visual profile (`roundedness: 1`). Crisp, functional corners convey utilitarian reliability, softened just enough to make repeated thumb contact feel comfortable.

### Corner Rules
- **Base Components (Inputs, List Rows, Cards):** `0.375rem` (6px) rounded corners. Clean, orderly, and paper-cut in appearance.
- **Badges & Department Identifiers:** Pill-shaped (`9999px`) to create an immediate morphological distinction between informational labels and interactive square-bound item rows.
- **Tick Buttons:** Full circular geometry (`32px` diameter) centered inside the square `56px` tap boundary to give the eye a distinct target dot.

## Components

### 1. Checklist Row (Core Component)
- **Geometry:** Height minimum 56px; full horizontal width; padding `0.75rem 1rem`.
- **States:**
  - *Active:* Crisp `#FFFFFF` background, `#1A2024` label (`body-lg`), 1px bottom divider `#E2DFD8`.
  - *Checked:* Background transitions subtly to `#F4F3F0`, text turns to `#8C959B` with an immediate center strike-through (`text-decoration: line-through 1.5px #8C959B`).
- **Affordance:** Left-aligned 32px tick target.

### 2. Tick Circles & Checkboxes
- **Inactive:** 32px circle, `#FFFFFF` fill, 2px solid border (`#8C959B`).
- **Active / Checked:** 32px circle, filled with `#13734B`, displaying a crisp white 2.5px gauge check icon. Transitions with a 120ms scale-snap (0.9 to 1.0) for punchy haptic feedback.

### 3. Department & Aisle Chips
- **Geometry:** Height 28px; pill-shaped (`9999px`); padding `0 10px`.
- **Aisle Style:** Border 1px solid `#E2DFD8`, fill `#FFFFFF`, text `#2F3E46` (`label-sm`).
- **Urgent / Warning Style:** Tinted fill `rgba(200, 90, 50, 0.12)`, border `1px solid #C85A32`, text `#C85A32` (`label-sm`).

### 4. Tactile Bottom Dock (Input & Quick Add)
- **Placement:** Affixed to viewport bottom, safe-area-inset aware.
- **Layout:** Horizontal strip containing a high-contrast text input, a tactile add button, and quick-tag chips directly above.
- **Add Button:** Minimum 52px square, `#13734B` solid background, bold white plus icon (`#FFFFFF`), rounded-md.

### 5. Input Fields
- **Default:** Height 48px, background `#FFFFFF`, border 1.5px solid `#D1CDC2`, text `#1A2024`, placeholder `#8C959B`.
- **Focused:** Border 2px solid `#13734B`, outline none. Instant cursor display without soft glow or blur artifacts.

### 6. Quantity Steppers
- **Geometry:** Compact dual-button unit `[ - | 1 | + ]`.
- **Dimensions:** Button width 36px, height 36px, border 1px solid `#E2DFD8`, fill `#F9F8F5`.
- **Active State:** Inset press depth, bold numeric display (`body-md`, tabular nums).