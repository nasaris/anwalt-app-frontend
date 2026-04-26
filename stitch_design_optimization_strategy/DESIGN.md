---
name: Jurisprudence UI
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#434655'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#515659'
  on-tertiary: '#ffffff'
  tertiary-container: '#696e71'
  on-tertiary-container: '#edf1f5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  badge:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 24px
  gutter: 20px
---

## Brand & Style

This design system is engineered for the legal sector, where clarity, authority, and reliability are paramount. It adopts a **Corporate / Modern** aesthetic, prioritizing information density without sacrificing visual breathing room. The interface is designed to reduce the cognitive load of legal professionals managing complex case files, timelines, and multi-party documentation.

The emotional response should be one of "quiet efficiency." By utilizing a restrained color palette and a structured grid, the system communicates stability and precision. The style avoids trendy flourishes in favor of long-term functional utility, ensuring that critical case data remains the focal point of the user experience.

## Colors

The color strategy uses a base of **Slate Grays** to provide a neutral canvas for dense textual data. **Deep Blue** is reserved strictly for primary actions and highlights, signaling intent and navigation without overwhelming the user.

- **Primary:** A refined blue for buttons, active sidebar states, and key links.
- **Surface:** Layers of light grays (`#F8FAFC` to `#F1F5F9`) differentiate content containers from the application background.
- **Accents:** Status badges use a semantic system. Active or positive statuses utilize soft emerald greens, while legal specializations (e.g., 'Arbeitsrecht') use slate tones to maintain professional neutrality.
- **Typography:** The primary text color is a deep navy-slate (`#1E293B`) to ensure high legibility and contrast against white card backgrounds.

## Typography

This design system relies exclusively on **Inter** for its systematic and utilitarian qualities. The typographic hierarchy is strictly enforced to manage complex data structures. 

Headlines use a tighter letter-spacing and heavier weights to anchor sections. Body text is optimized at 14px for general reading, with a 13px variant used for dense sidebars or secondary metadata. A specialized "label-caps" style is utilized for metadata headers (e.g., "GEBIET", "ERÖFFNET") to provide clear visual categorization without competing with the actual data values.

## Layout & Spacing

The design system employs a **Fluid Grid** model with a standard 12-column foundation for the main content area. A fixed-width left navigation sidebar (240px) provides a consistent anchor. 

Whitespace is used strategically to group related information. While the data density is high, we maintain a minimum of 24px padding within cards to prevent the UI from feeling claustrophobic. Horizontal rhythm is driven by a 4px base unit, ensuring all alignments (icons to text, input fields to labels) are mathematically consistent.

## Elevation & Depth

Depth is established through **Tonal Layers** and **Soft Shadows** rather than heavy borders. 

- **Level 0 (Background):** The application canvas uses a subtle off-white/gray (`#F8FAFC`).
- **Level 1 (Cards):** Main content containers are pure white with a very soft, diffused shadow (0px 1px 3px rgba(0,0,0,0.05)) to lift them slightly from the canvas.
- **Level 2 (Modals/Popovers):** Elements requiring immediate focus use a more pronounced shadow (0px 10px 15px -3px rgba(0,0,0,0.1)) and a subtle 1px border (`#E2E8F0`).

This approach creates a flat, modern stack that feels organized and tactile without the visual noise of traditional skeumorphism.

## Shapes

The shape language is **Rounded**, using a 0.5rem (8px) corner radius for most standard components like cards, input fields, and buttons. 

Secondary elements like tags, status badges, and search bars utilize a more pill-shaped approach (full rounding) to distinguish them from structural layout containers. This mix of geometric card structures and organic badge shapes creates a balance between professional rigor and modern accessibility.

## Components

### Buttons
Primary buttons use the deep blue background with white text. Secondary buttons use a white background with a subtle gray border and slate text. Icons should be used sparingly, primarily in ghost buttons for actions like "Back" or "Edit."

### Chips & Badges
Status indicators use a pill-shape. Those representing "Active" states use a soft green tint, while "Category" or "Tag" badges use a solid slate background with white text to minimize color distraction.

### Lists & Data Tables
Tables should be borderless, utilizing thin horizontal dividers (`#F1F5F9`). Row hovering should trigger a subtle background color change to assist with tracking data across wide screens.

### Input Fields
Fields should have a 1px border in a light slate gray, which transitions to the primary blue on focus. Labels are positioned above the field in the `label-caps` typography style.

### Timeline/Phase Tracker
A specialized horizontal component for case phases. Active phases are highlighted with a dark slate background, while upcoming or past phases are represented with lighter, desaturated tones and connected by a thin, centered line.

### Case Information Sidebar
A high-density card component utilizing the `label-caps` style for field headers, followed immediately by bolded `body-md` text for the data values. This ensures that legal professionals can scan critical case IDs and dates at a glance.