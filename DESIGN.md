---
name: Utilitarian Market Ledger
colors:
  surface: '#fff8f5'
  surface-dim: '#e2d8d2'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2eb'
  surface-container: '#f6ece6'
  surface-container-high: '#f0e6e0'
  surface-container-highest: '#eae1da'
  on-surface: '#1f1b17'
  on-surface-variant: '#3f4942'
  inverse-surface: '#342f2b'
  inverse-on-surface: '#f9efe8'
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
  background: '#fff8f5'
  on-background: '#1f1b17'
  surface-variant: '#eae1da'
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
- **Glare-Defiant High Contrast:** Strict luminance pairing between warm stone neutrals and clean parchment off-white ensures immediate glanceability without eye strain.
- **Physical Ledger Tactility:** Strikethroughs, micro-depressions, and explicit border bounds provide the psychological reassurance of striking pencil across physical paper.
- **One-Handed Ergonomics:** Heavy anchoring towards the bottom two-thirds of the viewport. Critical actions reside strictly within natural thumb-sweep zones.
- **Utilitarian Speed:** Eliminates gratuitous decorative art, complex nested menus, and slow transitions in favor of instantaneous state toggling and legible iconography.

## Colors

The palette balances clinical legibility with warm, stone- and paper-derived undertones to soften harsh mobile glare without sacrificing contrast compliance.

### Functional Roles
- **Base Canvas (`#FFF8F5`, `--bg`):** A warm parchment surface resembling heavy uncoated bond paper. Diminishes harsh OLED white glare in bright market interiors.
- **Elevated Canvas (`#FFFFFF`, `--surface`):** High-clarity white reserved for rows, the header, modal sheets, and list cards.
- **Tonal Fill (`#FCF2EB`, `--surface-2`):** A bought row and a tonal card. Chips and tonal buttons use `#F6ECE6` (`--secondary`).
- **Primary Ink (`#1F1B17`, `--text`):** Warm, deep charcoal for items, quantities, and primary headlines.
- **Muted Ink (`#3F4942`, `--muted`):** Green-grey tone for secondary metadata and aisle markers.
- **Struck Ink (`#6F7A71`, `--struck`):** Reserved for crossed-off, completed items and the border of an idle tick.
- **Primary Action & Resolved Accent (`#13734B`, `--done` and `--primary`):** Deep emerald green used for the main action, progress, and the checked state.
- **Alert Accent (`#A23E18`, `--warning`):** Terracotta used for alerts and the mark of a recurrent item.
- **Error (`#BA1A1A`, `--danger`):** A destructive action and a failure.
- **Structure & Borders (`#BEC9C0` `--line` / `#6F7A71` `--control`):** Green-grey divider lines and the border of a field.
- **Dark theme:** Derived from the same roles: canvas `#1F1B17`, rows `#2A2521`, tonal fill `#342F2B`, ink `#F9EFE8`, muted ink `#BEC9C0`, emerald `#82D8A8`.

## Typography

The type system uses **Hanken Grotesk**, an open grotesque typeface featuring robust aperture size, stable baselines, and tall x-heights. It remains razor-sharp on mid-range Android screens even while the user is walking or holding a jostling device.

### Rules of Application
- **Primary Scan Items:** Rendered using `body-lg` at 500 (Medium) weight to guarantee optical punch over light-gray checked items.
- **Numeric Quantities:** Keep numeric characters aligned using tabular figures (`font-variant-numeric: tabular-nums`) to ensure fast vertical scanning across weights and piece counts.
- **Categorical Meta:** Section tags (e.g., "AISLE 4", "DAIRY") use `label-sm` in all caps with positive letter spacing (`0.04em`) to act as instant visual anchors.

## Layout & Spacing

A strictly mobile-first vertical stack engineered around thumb reaches and the minimum 56px interactive target boundary.

### Layout Mechanics
- **Single-Column Focus:** Content flows down a single primary column on mobile displays. On larger devices the content is a centred column of at most 640px (`--content-max`). From 840px `Compra` and `Menú` add side panels, and from 1024px every screen but `Ajustes` fills the area beside the sidebar; `Ajustes` stays a centred column (`--settings-max`).
- **The Lower-Third Thumb Zone:** The bottom 30% of the viewport is reserved for dynamic entry and execution (the add button, the dock with the shop chip and the search, and the bottom bar).
- **Physical Padding:** Item rows adhere to strict internal top/bottom padding (`space-md`) coupled with minimum height boundaries (`min-height: 56px`), mitigating accidental toggles when tapping quickly while walking.

## Elevation & Depth

To maximize battery efficiency and visibility under intense fluorescent shop lamps, this design system rejects blurry drop shadows and complex translucent skeuomorphism. Depth is achieved via **structural edge borders** and **tonal card grounding**.

### Elevation Hierarchy
- **Level 0 (Base Canvas):** Parchment tone `#FFF8F5`. All category headers and scroll backdrops live here.
- **Level 1 (Card & List Rows):** Pure crisp white (`#FFFFFF`) with a 1px inset border (`#BEC9C0`). Elements feel crisp, defined, and flatly set into the screen.
- **Level 2 (Sheets & a Lifted Row):** Grounded by a warm offset ambient edge: `0 4px 12px rgba(120, 113, 108, 0.12)` (`--shadow-l`). Only a sheet or a lifted row has a shadow. This keeps docked controls crisp without fading into background noise.

## Shapes

A balanced **Soft** visual profile (`roundedness: 1`). Crisp, functional corners convey utilitarian reliability, softened just enough to make repeated thumb contact feel comfortable.

### Corner Rules
- **Base Components (Inputs, List Rows, Cards):** `0.375rem` (6px) rounded corners. Clean, orderly, and paper-cut in appearance.
- **Badges, Chips & Department Identifiers:** Pill-shaped (`999px`, `--radius-pill`) to create an immediate morphological distinction between informational labels and interactive square-bound item rows.
- **Tick Buttons:** Full circular geometry (`32px` diameter, `--tick`) centered inside the square `56px` tap boundary to give the eye a distinct target dot.

## Components

### 1. Checklist Row (Core Component)
- **Geometry:** Height minimum 56px (`--tap-l`, 48px in the compact density); full horizontal width.
- **States:**
  - *Active:* Crisp `#FFFFFF` background, `#1F1B17` label (18px, weight 500, `--text-row`), rows of a group in a card with a `#BEC9C0` border.
  - *Checked:* Background turns to `--surface-2` (`#FCF2EB`), text turns to `--struck` (`#6F7A71`) with a center strike-through (`text-decoration: line-through 1.5px`).
- **Affordance:** 32px tick target on the side of the hand that the user chose in `Ajustes`.
- **Quantity:** Free text (such as `2` or `1 kg`) shown as a tonal chip on one line.

### 2. Tick Circles & Checkboxes
- **Inactive:** 32px circle, `#FFFFFF` fill, border in `--struck` (`#6F7A71`).
- **Active / Checked:** 32px circle, filled with `--done` (`#13734B`), displaying a crisp white 2.5px check (`--tick-stroke`). Transitions with a short scale snap.

### 3. Department & Aisle Chips
- **Geometry:** Height 28px; pill-shaped (`9999px`); padding `0 10px`.
- **Chip Style:** Fill `--secondary` (`#F6ECE6`), text `--text`; a pressed chip has a `--control` border.
- **Recurrent Style:** Tinted fill `--warning-soft`, edge `--warning-line`, text `--warning` (`#A23E18`).

### 4. Bottom Dock & Add Button
- **Placement:** Affixed above the bottom bar, safe-area-inset aware.
- **Dock:** Horizontal strip with the chip of the shop list and a search button that opens a search field.
- **Add Button (`fab`):** 56px square, `--primary` (`#13734B`) solid background, white `+`, 6px corners. It opens the add sheet, and it collapses on a scroll.

### 5. Input Fields
- **Default:** Height 48px (`--tap`), background `#FFFFFF`, border 1.5px solid `--control` (`#6F7A71`), text `#1F1B17`.
- **Focused:** Border 2px solid `--done` (`#13734B`). Instant cursor display without soft glow or blur artifacts.