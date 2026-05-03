# Career Quiz App - Design System

> **Updated 2026-05-03 for v1.2.0 kindergarten redesign.** The earlier Indigo + gradient palette has been superseded by the Claymorphism `clay-*` tokens below. The original sections further down in this file are kept only as historical reference.

## Design Philosophy

This design system targets **4-year-old preschoolers** using shared kindergarten iPads. It follows a Claymorphism visual language with:
- **Tactile feel**: soft dual-layer shadows, 24px rounded corners, scale-press feedback so taps feel rewarding
- **One thing per screen**: never more than one primary CTA in view (kid + adult eye don't have to scan)
- **No emoji as icons**: every icon is a `lucide-react` SVG so weight, stroke and color stay on-brand
- **Accessibility**: H1 per route, `<label for>`, 3px focus ring, `prefers-reduced-motion` disables wiggle/slide
- **Responsiveness**: mobile-first; verified at 375 / 768 / 1280, portrait + landscape

---

## Color System (current — `clay-*` tokens)

Defined in [`tailwind.config.js`](tailwind.config.js) under `theme.extend.colors.clay`:

```css
clay-primary:        #F97316  /* Tailwind orange-500. Primary CTA fill. */
clay-primary-press:  #EA580C  /* Press / hover state of primary CTA. */
clay-bg:             #FFF7ED  /* App background — warm cream. */
clay-surface:        #FFFFFF  /* Cards, sheets, raised surfaces. */
clay-ink:            #451A03  /* Primary text — dark brown, high contrast. */
clay-ink-soft:       #92400E  /* Secondary / supporting text. */
clay-accent:         #F59E0B  /* Amber accent — used sparingly. */
clay-danger:         #DC2626  /* Error state. */
```

### Contrast notes

| Pair | Ratio | WCAG |
|---|---|---|
| `clay-ink` on `clay-bg` | ~13:1 | AAA |
| `clay-ink-soft` on `clay-bg` | ~7.8:1 | AAA |
| `white` on `clay-primary` | ~3.1:1 | AA large only — accepted brand decision; primary CTA text is bold ≥18px |

### Shadows (clay)

```css
shadow-clay:        0 12px 24px rgba(180, 83, 9, 0.18),
                    inset 0 2px 4px rgba(255, 255, 255, 0.7);
shadow-clay-press:  0 4px 8px  rgba(180, 83, 9, 0.18),
                    inset 0 2px 4px rgba(255, 255, 255, 0.5);
```

The inset highlight + warm drop is what gives the "soft clay" feel. Don't replace with stock Tailwind `shadow-md`.

### Typography (current)

```css
font-heading:  'Baloo 2', system-ui, sans-serif;     /* H1, CTAs, card titles */
font-body:     'Comic Neue', system-ui, sans-serif;  /* Body copy, helper text */
```

Both fonts are loaded via Google Fonts in `index.html` with `display=swap`. Minimum body size is 16px on mobile (avoids iOS auto-zoom). H1s use `text-2xl md:text-3xl`.

### Animations

Defined in `tailwind.config.js` keyframes + `src/styles/clay.css` reduced-motion overrides.

| Class | Use | Duration | Disabled by reduced-motion |
|---|---|---|---|
| `animate-wiggle` | Primary CTA on selection screen — invites the tap | 2s infinite | yes |
| `animate-slide-in-right` | Carousel forward transition | 250ms | yes |
| `animate-slide-in-left` | Carousel backward transition | 250ms | yes |
| `clay-press-fx` | Scale-press feedback on any interactive element | ~150ms | no (essential feedback) |

Under `@media (prefers-reduced-motion: reduce)` the wiggle and slides collapse to `animation: auto ease 0s 1 normal none running none !important;`.

---

## ⚠️ Historical reference (pre-v1.2.0)

The sections below describe the previous Indigo-based Tailwind setup used by the multi-question quiz before May 2026. They no longer match the shipping code; kept only so you can identify legacy references in old issues / PRs.

---

## Color System

### Primary Colors
```css
Indigo-600: #4F46E5  /* Primary actions, links, main brand color */
Indigo-700: #4338CA  /* Hover states */
Indigo-500: #6366F1  /* Accents */
Indigo-50:  #EEF2FF  /* Light backgrounds */
```

### Semantic Colors
```css
Success:    #16A34A  /* Green-600 - Success states */
Warning:    #F59E0B  /* Amber-500 - Warnings */
Error:      #EF4444  /* Red-500 - Errors */
```

### Neutral Colors
```css
Gray-900: #111827  /* Primary text */
Gray-800: #1F2937  /* Secondary headings */
Gray-700: #374151  /* Body text */
Gray-600: #4B5563  /* Supporting text */
Gray-500: #6B7280  /* Placeholders */
Gray-200: #E5E7EB  /* Borders */
Gray-100: #F3F4F6  /* Light backgrounds */
Gray-50:  #F9FAFB  /* Page backgrounds */
```

### Gradient Backgrounds
```css
Primary: from-indigo-50 via-blue-50 to-purple-50
Success: from-green-50 to-blue-50
```

---

## Typography Scale

### Headings
```css
Display (Hero):   text-5xl md:text-7xl (48px/56px → 72px/80px)
H1 (Page Title):  text-3xl md:text-4xl (30px/36px → 36px/40px)
H2 (Section):     text-xl md:text-2xl  (20px/28px → 24px/32px)
H3 (Card Title):  text-base md:text-xl (16px/24px → 20px/28px)
```

### Body Text
```css
Large:   text-base md:text-lg (16px/24px → 18px/28px)
Body:    text-sm md:text-base (14px/20px → 16px/24px)
Small:   text-xs md:text-sm   (12px/16px → 14px/20px)
```

### Font Weights
```css
Bold:      font-bold      (700)
Semibold:  font-semibold  (600)
Medium:    font-medium    (500)
Normal:    (default)      (400)
```

---

## Spacing System

Based on Tailwind's spacing scale (1 unit = 0.25rem = 4px):

### Component Spacing
```css
Tight:    gap-3 md:gap-4    (12px → 16px)
Default:  gap-4 md:gap-5    (16px → 20px)
Relaxed:  gap-5 md:gap-6    (20px → 24px)
Loose:    gap-6 md:gap-8    (24px → 32px)
```

### Section Spacing
```css
Cards:    space-y-6 md:space-y-8  (24px → 32px)
Sections: space-y-5 md:space-y-6  (20px → 24px)
Elements: space-y-3 md:space-y-4  (12px → 16px)
```

### Padding
```css
Small:  p-4 md:p-5   (16px → 20px)
Medium: p-5 md:p-6   (20px → 24px)
Large:  p-6 md:p-8   (24px → 32px)
XLarge: p-6 md:p-10  (24px → 40px)
```

---

## Border Radius

```css
Small:  rounded-lg   (8px)  - Small elements
Medium: rounded-xl   (12px) - Cards, inputs
Large:  rounded-2xl  (16px) - Main containers
```

---

## Shadows

```css
Small:  shadow-md   - Buttons, small cards
Medium: shadow-lg   - Main cards
Large:  shadow-xl   - Modals
XLarge: shadow-2xl  - Hero elements
```

---

## Component States

### Buttons

#### Primary Button
```css
Base:     bg-indigo-600 text-white
Hover:    bg-indigo-700
Focus:    focus:ring-4 focus:ring-indigo-300
Disabled: opacity-50 cursor-not-allowed
```

#### Secondary Button
```css
Base:     border-2 border-indigo-600 text-indigo-600
Hover:    bg-indigo-50
Focus:    focus:ring-4 focus:ring-indigo-100
```

#### Ghost Button
```css
Base:     bg-gray-200 text-gray-800
Hover:    bg-gray-300
Focus:    focus:ring-4 focus:ring-gray-300
```

### Inputs
```css
Base:     border-2 border-gray-200 bg-white
Focus:    border-indigo-500 ring-4 ring-indigo-100
Error:    border-red-500 ring-4 ring-red-100
```

### Cards
```css
Standard: bg-white rounded-2xl shadow-lg p-6 md:p-8
Info:     bg-indigo-50 border-2 border-indigo-200 rounded-xl
Success:  bg-green-50 border-2 border-green-200 rounded-xl
Warning:  bg-amber-50 border-2 border-amber-200 rounded-xl
Error:    bg-red-50 border-2 border-red-200 rounded-xl
```

---

## Layout Structure

### Page Container
```css
min-h-screen                          /* Full viewport height */
bg-gradient-to-br from-indigo-50      /* Gradient background */
py-8 md:py-12                         /* Vertical padding */
```

### Content Container
```css
max-w-3xl mx-auto                     /* Max width 768px, centered */
px-4                                  /* Horizontal padding */
space-y-6 md:space-y-8                /* Vertical spacing */
```

### Card Layout
```css
bg-white                              /* White background */
rounded-2xl                           /* Large radius */
shadow-lg                             /* Medium shadow */
p-6 md:p-8                           /* Responsive padding */
```

---

## Animations

### Fade In Up
```css
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
    opacity: 0;
}
```

### Stagger Delays
```css
Element 1: style={{ animationDelay: '0.1s' }}
Element 2: style={{ animationDelay: '0.2s' }}
Element 3: style={{ animationDelay: '0.3s' }}
```

### Hover Effects
```css
transform hover:scale-105             /* Slight scale on hover */
transition-all                        /* Smooth transitions */
```

### Loading Spinner
```css
animate-spin                          /* Tailwind built-in */
rounded-full border-b-4 border-indigo-600
```

---

## Responsive Breakpoints

Following Tailwind CSS defaults:

```css
sm:  640px  /* Small devices */
md:  768px  /* Tablets */
lg:  1024px /* Desktops */
xl:  1280px /* Large screens */
```

### Usage Pattern
```css
/* Mobile first approach */
text-base md:text-lg               /* 16px → 18px */
p-4 md:p-6                        /* 16px → 24px */
gap-4 md:gap-6                    /* 16px → 24px */
```

---

## Accessibility Guidelines

### Color Contrast
- Text on white: minimum 4.5:1 ratio (WCAG AA)
- Large text: minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio

### Focus States
All interactive elements must have visible focus states:
```css
focus:outline-none focus:ring-4 focus:ring-{color}-300
```

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Include `aria-label` for icon-only buttons
- Ensure all images have `alt` text

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows visual order
- Modal traps focus appropriately

---

## Component Checklist

When creating new components, ensure:

- [ ] Mobile-first responsive design
- [ ] Proper color contrast (WCAG AA)
- [ ] Loading states implemented
- [ ] Error states designed
- [ ] Empty states considered
- [ ] Focus states visible
- [ ] Hover states smooth
- [ ] Disabled states clear
- [ ] Animations performant
- [ ] Typography scale followed
- [ ] Spacing system consistent
- [ ] Shadow hierarchy correct

---

## File Organization

```
components/
├── StartScreen.tsx       - Onboarding & photo capture
├── ResultsScreen.tsx     - Career recommendations
├── CameraCapture.tsx     - Photo upload flow
├── ProcessingStatus.tsx  - AI processing feedback
└── ReportModal.tsx       - Printable report
```

---

## Key Design Decisions

### 1. Removed Absolute Positioning
**Problem**: Content was cut off and couldn't scroll
**Solution**: Use `min-h-screen` + flexbox for proper document flow

### 2. Unified Color System
**Problem**: Multiple conflicting colors (purple, blue, green, yellow)
**Solution**: Indigo as primary with semantic colors for states

### 3. Card-Based Layout
**Problem**: Dense information with poor visual hierarchy
**Solution**: Separate cards for each content section

### 4. Consistent Spacing
**Problem**: Inconsistent gaps and padding
**Solution**: Strict adherence to spacing system

### 5. Improved Typography
**Problem**: Too many font sizes and weights
**Solution**: Clear 4-level heading system

---

## Quick Reference

### Common Patterns

**Section Card:**
```jsx
<div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">
    Title
  </h2>
  <p className="text-base md:text-lg text-gray-600">
    Content
  </p>
</div>
```

**Primary Button:**
```jsx
<button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300">
  Click Me
</button>
```

**Status Badge:**
```jsx
<div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
  <p className="text-indigo-700">Status message</p>
</div>
```

---

**Design System Version**: 1.0
**Last Updated**: 2025-10-08
**Maintained by**: UI Designer Agent
