# CLAUDE.md — CORE Cooperative Portal
## Pixel-Accurate Mobile UI Reconstruction & Production Implementation Rules

> This file is the authoritative implementation guide for Claude Code working on the CORE Cooperative Portal.
>
> The visual reference is the supplied login-screen screenshot. The screenshot is the source of truth for visual fidelity.
>
> **Primary rule: reproduce the reference; do not redesign it unless the user explicitly asks for a redesign.**

---

# 1. PROJECT CONTEXT

This project is the **CORE — Cooperative Oversight & Reporting Engine** for the:

**Department of Cooperation • Government of Sikkim**

The application is primarily used on mobile devices.

The current task is to reproduce the supplied mobile login screen as accurately as possible and establish a reusable visual foundation for the rest of CORE.

The UI should feel:

- official
- modern
- restrained
- trustworthy
- mobile-first
- highly legible
- operational rather than decorative

The existing maroon / gold Government of Sikkim visual identity must be preserved.

---

# 2. SOURCE OF TRUTH

Use this file as the visual reference:

```text
reference/login-reference.png
```

If the reference image has another filename, use the actual supplied reference image instead.

Never replace the reference with a generated interpretation.

The reference image determines:

- geometry
- spacing
- proportions
- typography hierarchy
- colors
- alignment
- artwork placement
- component dimensions
- visual density
- shadows
- borders
- corner radii
- icon scale
- footer placement

When code and reference disagree, the reference wins for visual appearance.

---

# 3. NON-NEGOTIABLE VISUAL RULE

Do NOT say:

- "similar to the screenshot"
- "inspired by the screenshot"
- "approximately the same"
- "a modern interpretation"
- "a cleaner version"

Instead:

**Measure, implement, render, compare, correct, repeat.**

Do not introduce design decisions that are not supported by the reference unless required for functionality, accessibility, responsiveness, or browser compatibility.

---

# 4. TARGET REFERENCE VIEWPORT

The supplied reference is approximately:

```text
Width: 828 px
Height: 1792 px
```

Use:

```text
828 × 1792 px
```

as the primary visual validation viewport.

Also validate the layout at common mobile widths:

```text
375 × 812
390 × 844
393 × 852
402 × 874
414 × 896
430 × 932
```

The 828 × 1792 reference must receive the highest visual priority.

---

# 5. MOBILE-FIRST REQUIREMENT

The application is mobile-first.

Do NOT create a desktop page and then scale it down.

Build the mobile composition first.

The interface must:

- fit naturally on narrow phones
- avoid horizontal scrolling
- preserve touch targets
- handle browser safe areas
- handle iOS Safari viewport behavior
- handle Android Chrome viewport behavior
- remain usable when the keyboard opens
- maintain visual hierarchy at smaller widths

Use CSS:

```css
min-height: 100dvh;
```

where appropriate rather than relying exclusively on:

```css
100vh;
```

Respect:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

---

# 6. TECHNOLOGY

Use the project's existing stack if one already exists.

Do NOT migrate frameworks merely for this screen.

If the project is greenfield, prefer:

- React
- Vite or Next.js
- TypeScript
- CSS modules or well-organized global CSS
- SVG for custom decorative/vector artwork
- Lucide or another consistent icon system if exact icon assets are unavailable

Do not introduce unnecessary dependencies.

For visual validation, prefer:

- Playwright
- pixel-level image comparison
- Sharp
- pixelmatch or an equivalent diff library

---

# 7. COMPONENT ARCHITECTURE

Keep the login page componentized.

Recommended structure:

```text
src/
├── components/
│   └── core/
│       ├── CoreBranding.tsx
│       ├── LoginCard.tsx
│       ├── CoreInput.tsx
│       ├── PasswordInput.tsx
│       ├── SecurityFeature.tsx
│       ├── CoreFooter.tsx
│       └── BackgroundArtwork.tsx
│
├── pages/
│   └── Login.tsx
│
├── styles/
│   ├── tokens.css
│   ├── globals.css
│   └── login.css
│
├── assets/
│   └── core/
│       ├── emblem.svg
│       ├── mountains.svg
│       ├── rhododendron.svg
│       └── monastery.svg
│
└── tests/
    └── visual/
```

If the existing project architecture differs, preserve its conventions rather than restructuring the whole application.

---

# 8. DESIGN TOKENS

Create centralized design tokens.

Start with these approximate values, then refine them against the reference screenshot:

```css
:root {
  --core-maroon: #6D0F14;
  --core-maroon-dark: #4D090D;
  --core-maroon-secondary: #7D2427;

  --core-gold: #F4E1B5;
  --core-gold-dark: #C9A65A;

  --core-white: #FFFFFF;
  --core-surface: #F8F9FB;

  --core-text: #1F1F1F;
  --core-text-secondary: #6B7280;
  --core-placeholder: #9CA3AF;

  --core-border: #DDE3EA;

  --core-radius-card: 30px;
  --core-radius-input: 20px;
  --core-radius-button: 20px;

  --core-shadow-card:
    0 10px 30px rgba(0, 0, 0, 0.10);

  --core-max-content-width: 760px;
}
```

These are starting tokens, not immutable values.

If pixel comparison demonstrates that another value matches the reference better, change the token.

Do not create dozens of unrelated hard-coded colors.

---

# 9. GLOBAL CSS RULES

Apply a predictable reset:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
}

body {
  min-height: 100dvh;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

Do not allow browser-default:

- input borders
- button styles
- margins
- font sizes
- focus outlines

to determine the appearance.

---

# 10. PAGE COMPOSITION

The screen is composed of:

```text
STATUS BAR
    ↓
CORE BRANDING
    ↓
MOUNTAIN / SIKKIM BACKGROUND ARTWORK
    ↓
LOGIN CARD
    ↓
SECURITY / INFORMATION FEATURES
    ↓
FOOTER
    ↓
RHODODENDRON + MONASTERY ARTWORK
```

Maintain this visual order.

---

# 11. BACKGROUND

The background is a deep maroon Sikkim-inspired composition.

It should not be a completely flat rectangle.

The reference contains subtle artwork including:

- mountain silhouettes
- tonal gradients
- rhododendron flowers toward bottom-left
- Sikkim architectural/monastery artwork toward bottom-right

The artwork must remain subordinate to the login card.

Do not use highly saturated photographic backgrounds.

Preferred implementation:

```text
background color
+
subtle gradient
+
SVG/vector mountain artwork
+
SVG/vector floral artwork
+
SVG/vector architectural artwork
```

If original assets are supplied, use them.

If they are not supplied:

- create clean SVG/vector approximations
- use low opacity
- use tonal variations of the maroon palette
- avoid visually competing with text
- preserve approximate placement and silhouette

Do NOT put the complete UI into one background image.

---

# 12. STATUS BAR / SAFE AREA

The reference resembles an iPhone viewport.

The application must not attempt to fake the operating-system status bar using HTML text unless required by the project.

Use appropriate safe-area handling.

The application content should naturally sit below the real device status bar.

For screenshot testing, emulate the viewport consistently.

---

# 13. CORE BRANDING

Top branding contains:

1. Government emblem
2. CORE
3. Cooperative Oversight & Reporting Engine
4. Department of Cooperation
5. Government of Sikkim

Visual hierarchy:

```text
EMBLEM
   ↓
CORE
   ↓
Cooperative Oversight & Reporting Engine
   ↓
gold divider
   ↓
Department of Cooperation
   ↓
Government of Sikkim
```

The emblem must be centered.

Do not replace the official emblem with a generic icon if the real asset is available.

Use SVG where possible.

Do not distort the emblem.

Maintain aspect ratio.

---

# 14. HEADER TYPOGRAPHY

The word:

```text
CORE
```

is the primary title.

It should be:

- large
- centered
- high contrast
- clean
- visually dominant

The subtitle:

```text
Cooperative Oversight & Reporting Engine
```

is smaller.

The department name uses the gold accent.

```text
Department of Cooperation
```

The government name appears below:

```text
Government of Sikkim
```

Avoid excessive letter spacing.

The original reference has tracking in some labels, but do not exaggerate it.

---

# 15. OPTIONAL SIDE BRANDING

The reference contains subtle supporting messaging near the upper left/right areas:

Left:

```text
People
Cooperation
Progress
```

Right:

```text
Stronger
Cooperatives
A Brighter Sikkim
```

Preserve these only if they are actually visible in the current reference.

They should remain secondary and subtle.

Do not let them interfere with the main branding.

---

# 16. LOGIN CARD

The login card is the primary foreground object.

Requirements:

- white background
- large rounded corners
- subtle border
- subtle shadow
- centered
- responsive width
- no horizontal overflow

The card should occupy approximately the same width and vertical position as the reference.

Do not make it full-width.

Maintain balanced side margins.

Do not arbitrarily change its proportions.

---

# 17. LOGIN CARD CONTENT

Use exactly:

```text
Welcome back

Sign in to access the Cooperative Portal
```

Then:

```text
OFFICIAL EMAIL ID
```

Email input:

```text
rainisha880@gmail.com
```

Then:

```text
PASSWORD
```

Password placeholder:

```text
Enter your password
```

Then:

```text
Forgot password?
```

Primary button:

```text
SIGN IN →
```

Registration prompt:

```text
New Inspector?   Register here →
```

Do not add unnecessary fields.

Do not add social login.

Do not add a remember-me checkbox unless the existing application requires it.

---

# 18. LOGIN HEADING

The heading:

```text
Welcome back
```

must be visually prominent but should not overpower the CORE brand.

Use a strong weight.

Avoid an oversized heading that causes the form to move significantly lower than the reference.

---

# 19. FORM LABELS

Labels:

```text
OFFICIAL EMAIL ID
PASSWORD
```

must be:

- clearly readable
- medium weight
- appropriately spaced
- aligned with their inputs
- consistent with each other

Use explicit CSS for:

- font-size
- font-weight
- line-height
- letter-spacing
- margin-bottom

Do not rely on inherited styles.

---

# 20. EMAIL INPUT

The email input is a real interactive HTML input.

Requirements:

- correct type
- accessible label
- rounded border
- pale cool-gray background
- envelope icon
- clear/X control
- correct vertical centering
- correct text size
- correct height

Value in reference:

```text
rainisha880@gmail.com
```

The clear button must actually clear the field.

The clear icon must be a real button.

Do not use an unclickable decorative X.

---

# 21. PASSWORD INPUT

The password input must be a real:

```html
<input type="password">
```

with:

- lock icon
- visibility toggle
- correct placeholder
- accessible label

The eye icon must actually toggle:

```text
password
↕
text
```

Do not use a fake eye icon.

The visibility toggle must be keyboard accessible.

---

# 22. FORGOT PASSWORD

Text:

```text
Forgot password?
```

Position it according to the reference.

Use the maroon accent.

It must be a real link or accessible button.

Do not create a large visual gap merely to position it.

---

# 23. SIGN-IN BUTTON

Primary CTA:

```text
SIGN IN →
```

The button should:

- span the intended card width
- use the primary maroon
- have the same approximate corner radius as reference
- use correct vertical alignment
- have a strong but not oversized label
- provide visible pressed/focus states

The arrow should be aligned with the label.

Do not make the button taller than the reference merely to "improve usability."

Maintain an accessible touch target while preserving visual dimensions.

---

# 24. REGISTRATION ACTION

The reference uses:

```text
New Inspector?   Register here →
```

This replaces the heavy two-tab navigation.

Keep:

```text
New Inspector?
```

visually secondary.

Keep:

```text
Register here →
```

as the actionable accent.

The registration action must be a real link.

---

# 25. DO NOT REINTRODUCE THE OLD TAB BAR

Do NOT use:

```text
SIGN IN | REGISTER INSPECTOR
```

as a large segmented tab bar on this redesigned login screen.

Registration should remain a secondary action below the main sign-in flow.

---

# 26. SECURITY / INFORMATION FEATURES

Below the login card, the reference contains three subtle feature blocks.

Conceptually:

```text
Secure
Access
```

```text
For a Stronger
Cooperative Ecosystem
```

```text
Government
of Sikkim
```

Each uses:

- small line icon
- subtle gold/maroon treatment
- centered label

They are informational, not primary navigation.

Do not make them visually louder than the login button.

If icons are implemented with SVG, keep stroke weight consistent.

---

# 27. FOOTER

Footer contains approximately:

```text
Version 2.0.4  |  🔒  Secure government system
```

The version is informational.

Do not display "beta" unless the actual application is intentionally marked beta.

Keep the footer subtle.

Do not let it appear as a major heading.

---

# 28. TYPOGRAPHY SYSTEM

Prefer:

```text
Inter
```

If Inter is unavailable:

```text
system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Suggested starting hierarchy:

```css
CORE:
font-size: clamp(48px, 8vw, 72px);
font-weight: 500;

Login heading:
font-size: 32px;
font-weight: 700;

Login subtitle:
font-size: 18px;
font-weight: 400;

Field label:
font-size: 14px;
font-weight: 600;

Input:
font-size: 18px;
font-weight: 400;

Button:
font-size: 17px;
font-weight: 600;

Secondary link:
font-size: 16px;
```

These values are starting points.

Use screenshot comparison to refine them.

---

# 29. ICONS

Use a consistent icon family.

Preferred:

- outline icons
- rounded but restrained
- consistent stroke width

Required semantic icons:

```text
email → envelope
password → lock
password visibility → eye
clear → X
security → shield
cooperative ecosystem → users/group
government → leaf or appropriate symbolic mark
```

If the screenshot's exact icon differs, match the screenshot rather than blindly following these examples.

---

# 30. ACCESSIBILITY

Pixel accuracy must not mean inaccessible markup.

Use:

```html
<label for="email">Official Email ID</label>
<input id="email" ... />
```

Buttons must be real buttons.

Links must be real links.

Interactive controls must have accessible names.

The password visibility button should have:

```text
aria-label="Show password"
```

and:

```text
aria-label="Hide password"
```

as appropriate.

Do not remove keyboard focus indicators.

Style focus states so they remain visually compatible with the design.

---

# 31. FORM BEHAVIOR

Implement:

### Email

- controlled input
- clear button
- email autocomplete

### Password

- controlled input
- show/hide toggle
- password autocomplete

### Sign in

- disabled/loading state when appropriate
- no fake authentication
- expose a clear handler for backend integration

### Forgot password

- real route or placeholder route according to the project

### Register

- real route or placeholder route according to the project

---

# 32. RESPONSIVE LAYOUT

Do not hard-code the entire design to 828 px.

Use fluid sizing with carefully controlled maximums.

For example:

```css
.login-card {
  width: min(
    calc(100% - 64px),
    760px
  );
}
```

But do not blindly use this exact value.

Measure the reference.

At narrow widths, reduce:

- card side margins
- decorative artwork scale
- header spacing
- feature spacing

before allowing the layout to break.

---

# 33. KEYBOARD BEHAVIOR

When the mobile keyboard opens:

- the password/email field must remain accessible
- the focused input must not be hidden
- the page may scroll
- do not permanently position the card with `position: fixed`

Avoid fixed positioning for the main login card.

---

# 34. SAFE AREA

Use:

```css
padding-top: max(
  16px,
  env(safe-area-inset-top)
);

padding-bottom: max(
  16px,
  env(safe-area-inset-bottom)
);
```

where appropriate.

Do not allow content to overlap the iPhone home indicator.

---

# 35. ANIMATION

Keep animation minimal.

The reference is primarily static.

Allowed:

- subtle button press
- subtle input focus transition
- password toggle transition
- small page-load fade if already consistent with the application

Avoid:

- large parallax
- excessive motion
- animated mountains
- bouncing buttons
- flashy transitions

Visual fidelity takes priority.

---

# 36. DO NOT USE A SINGLE SCREENSHOT AS THE UI

This is critical.

Do NOT implement:

```html
<img src="entire-login-screen.png">
```

as the page.

Do NOT use the entire screenshot as a CSS background.

The following must remain actual UI:

- headings
- labels
- inputs
- links
- buttons
- footer text
- feature labels

Decorative artwork can be image/SVG assets.

---

# 37. ASSET HANDLING

Use exact supplied assets when available.

Preferred formats:

```text
SVG
PNG
WebP
```

For the official emblem:

- preserve aspect ratio
- use transparent background where appropriate
- do not recolor an official mark unless an approved version is supplied

For decorative artwork:

- use SVG where practical
- optimize file size
- avoid unnecessary photographic assets

---

# 38. DESIGN SYSTEM REUSE

This login page is the beginning of the CORE design system.

Create reusable tokens/components for:

- colors
- typography
- cards
- buttons
- inputs
- icons
- spacing
- radius
- shadows
- mobile breakpoints

Future CORE modules, including MPCS, should reuse these foundations.

Do not create a separate visual language for each module.

Domain-specific content can differ, but the following should remain consistent:

- navigation behavior
- component patterns
- typography
- spacing system
- button treatment
- form controls
- cards
- status indicators
- mobile interaction patterns

---

# 39. VISUAL VALIDATION REQUIREMENT

A first implementation is NOT considered complete.

The workflow is:

```text
REFERENCE
   ↓
IMPLEMENT
   ↓
RENDER
   ↓
COMPARE
   ↓
IDENTIFY DIFFERENCES
   ↓
CORRECT
   ↓
RENDER AGAIN
   ↓
COMPARE AGAIN
```

Repeat until the remaining differences are minor.

---

# 40. PLAYWRIGHT SCREENSHOT

Create a script capable of rendering the login page at:

```text
828 × 1792
```

Example command:

```bash
npm run screenshot
```

Expected output:

```text
screenshots/current.png
```

The screenshot must be taken without browser UI.

Use a stable browser environment.

Disable animation during visual testing.

---

# 41. PIXEL DIFFERENCE

Create a comparison command:

```bash
npm run compare
```

It should compare:

```text
reference/login-reference.png
```

against:

```text
screenshots/current.png
```

Output should include:

```text
screenshots/diff.png
```

and a numerical similarity/difference score where practical.

---

# 42. VISUAL AUDIT ORDER

When comparing the screenshot, correct discrepancies in this order:

## Priority 1 — Global geometry

- viewport
- page height
- overall content width
- card position
- header position

## Priority 2 — Major dimensions

- card width
- card height
- input height
- button height
- major spacing

## Priority 3 — Typography

- font family
- font size
- weight
- line-height
- letter spacing

## Priority 4 — Colors

- background
- card
- button
- gold
- text
- borders

## Priority 5 — Components

- icons
- borders
- radii
- shadows
- links

## Priority 6 — Decorative details

- mountain artwork
- flowers
- monastery
- subtle gradients
- micro-spacing

Do not spend 20 minutes perfecting an icon while the login card is 40 px too low.

---

# 43. COORDINATE-BASED DEBUGGING

When a component is visually wrong, do not merely "eyeball" it.

Measure.

For example:

```text
Reference:
card top = 478 px

Current:
card top = 512 px

Difference:
+34 px

Correction:
move card upward by approximately 34 px
```

Use this methodology for:

- x position
- y position
- width
- height
- gaps
- font sizes

---

# 44. THREE-PASS RULE

After the first implementation, perform at least three visual refinement passes.

### Pass 1

Correct:

- page geometry
- card
- header
- spacing

### Pass 2

Correct:

- typography
- colors
- input/button dimensions
- icons

### Pass 3

Correct:

- artwork
- footer
- micro-spacing
- shadows
- borders
- visual polish

Do not stop after Pass 1.

---

# 45. PIXEL-PERFECT MODE

When the user says:

- "pixel perfect"
- "exactly like screenshot"
- "match screenshot"
- "recreate this"
- "same UI"

enter **PIXEL-PERFECT MODE**.

In this mode:

1. Do not redesign.
2. Do not simplify.
3. Do not add features.
4. Do not substitute layouts.
5. Do not stop at a plausible visual match.
6. Render the page.
7. Compare against the reference.
8. Correct the differences.
9. Render again.
10. Repeat.

---

# 46. IMPORTANT: DO NOT OVER-INTERPRET THE SCREENSHOT

If something is ambiguous:

- inspect the pixels
- infer conservatively
- preserve the reference
- avoid inventing additional UI

Do not add:

- navigation bars
- menus
- extra cards
- extra security text
- social login
- unnecessary helper text
- extra fields
- unnecessary animations

---

# 47. PRODUCTION QUALITY

Visual accuracy is necessary but not sufficient.

The implementation must also:

- build successfully
- have no TypeScript errors
- have no console errors
- have no broken assets
- have no horizontal overflow
- have working inputs
- have working password visibility
- have working clear button
- have real links/buttons
- remain responsive

Before declaring completion, run:

```bash
npm run build
```

and the relevant test commands.

---

# 48. BROWSER TESTING

At minimum validate:

- Chromium
- mobile Chromium emulation
- Safari/iOS considerations if the project supports iOS
- desktop browser at narrow viewport

Check:

- input focus
- password toggle
- clear button
- button press
- keyboard navigation
- viewport resizing

---

# 49. PERFORMANCE

Do not load huge decorative images unnecessarily.

Prefer:

- optimized SVG
- compressed WebP/PNG
- CSS gradients
- CSS shapes where appropriate

Do not compromise visual quality merely for a small asset-size reduction.

---

# 50. SECURITY

This is a government portal.

Do not:

- log passwords
- store passwords in localStorage
- print authentication credentials to the console
- create fake authentication tokens
- expose sensitive form values
- hard-code real credentials into production code

The visible email in the reference is a design/example value only.

If authentication is not yet connected, clearly separate UI behavior from authentication logic.

---

# 51. PRIVACY

Do not add analytics or tracking merely for this UI task.

Do not transmit form values anywhere unless the existing application's backend explicitly requires it.

---

# 52. ERROR STATES

When authentication is connected, errors should fit the visual system.

Example:

```text
Unable to sign in.
Please check your email and password.
```

Error states should:

- remain accessible
- not cause major layout jumps
- preserve the visual hierarchy
- use appropriate semantic color
- not destroy the reference layout

Do not invent error UI in the initial static reconstruction unless required.

---

# 53. LOADING STATE

If the backend supports login:

```text
SIGNING IN...
```

may replace the button label temporarily.

Do not allow multiple simultaneous submissions.

Keep button dimensions stable during loading.

---

# 54. ROUTING

The login screen should remain isolated from authenticated application routes.

Recommended conceptual flow:

```text
/login
    ↓
authentication
    ↓
/dashboard
```

Registration:

```text
/register-inspector
```

Forgot password:

```text
/forgot-password
```

Use the project's existing route conventions if they differ.

---

# 55. CODE STYLE

Prefer readable, explicit code.

Avoid:

- giant components
- magic numbers everywhere
- duplicated styles
- inline styles for large portions of the page
- deeply nested CSS
- unnecessary abstraction

Good:

```tsx
<LoginCard />
```

Bad:

```tsx
<div>
  <div>
    <div>
      ...
    </div>
  </div>
</div>
```

with all visual logic embedded inline.

---

# 56. MAGIC NUMBERS

Some exact pixel values are legitimate because this is a screenshot-reconstruction task.

However, centralize important measurements.

For example:

```css
:root {
  --login-card-radius: 30px;
  --login-input-height: 52px;
  --login-button-height: 52px;
  --login-content-gap: 24px;
}
```

If screenshot comparison requires changing these values, change the token.

---

# 57. DO NOT MAKE THE UI "BETTER" WITHOUT PERMISSION

The reference may contain things that you personally would design differently.

Do not change them simply because you prefer:

- different colors
- smaller cards
- larger buttons
- different typography
- different spacing
- different icons
- different artwork
- different information architecture

If the user requests a redesign later, that becomes a separate task.

---

# 58. CURRENT DESIGN DIRECTION

The intended current login direction is:

```text
DEEP MAROON BACKGROUND
        ↓
SIKKIM / GOVERNMENT BRANDING
        ↓
WHITE LOGIN CARD
        ↓
SIMPLE FORM
        ↓
ONE PRIMARY SIGN-IN CTA
        ↓
SECONDARY REGISTRATION ACTION
        ↓
SUBTLE SECURITY INFORMATION
        ↓
MINIMAL FOOTER
```

Do NOT revert to a large:

```text
SIGN IN | REGISTER INSPECTOR
```

tab interface.

---

# 59. RECOMMENDED FILES FOR VISUAL TESTING

Maintain:

```text
reference/
    login-reference.png

screenshots/
    current.png
    diff.png

scripts/
    screenshot.*
    compare.*

tests/
    visual/
```

Do not commit large temporary screenshot collections unless useful to the project.

---

# 60. DEFINITION OF DONE

The login screen is complete only when ALL are true:

### Visual

- [ ] Reference viewport matches 828 × 1792
- [ ] Header geometry matches
- [ ] Emblem position matches
- [ ] CORE typography matches
- [ ] Department branding matches
- [ ] Mountain artwork matches closely
- [ ] Login card position matches
- [ ] Login card width matches
- [ ] Login card height matches
- [ ] Card radius matches
- [ ] Card shadow matches
- [ ] Heading matches
- [ ] Subtitle matches
- [ ] Email field matches
- [ ] Password field matches
- [ ] Forgot password position matches
- [ ] Sign-in button matches
- [ ] Registration action matches
- [ ] Security feature row matches
- [ ] Footer matches
- [ ] Bottom artwork matches

### Functional

- [ ] Email input works
- [ ] Clear email works
- [ ] Password input works
- [ ] Show/hide password works
- [ ] Forgot password works
- [ ] Register action works
- [ ] Sign-in action is wired correctly or intentionally stubbed

### Technical

- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Production build succeeds
- [ ] No horizontal overflow
- [ ] Responsive at common phone sizes
- [ ] Keyboard behavior works
- [ ] Accessibility basics pass

### Visual QA

- [ ] Screenshot generated
- [ ] Screenshot compared against reference
- [ ] Diff inspected
- [ ] At least three refinement passes completed
- [ ] Remaining differences documented

---

# 61. FINAL CLAUDE CODE INSTRUCTION

When starting work on this screen, follow this exact sequence:

```text
1. Inspect the existing repository.
2. Identify the current frontend framework.
3. Locate the supplied reference image.
4. Inspect existing assets and design tokens.
5. Do not overwrite existing functionality unnecessarily.
6. Build the login screen using real components.
7. Implement the visual structure.
8. Implement interactions.
9. Run the application.
10. Capture an 828 × 1792 screenshot.
11. Compare it to the reference.
12. Correct geometry.
13. Compare again.
14. Correct typography.
15. Compare again.
16. Correct colors/components.
17. Compare again.
18. Correct decorative artwork.
19. Run at least three visual refinement passes.
20. Run build/tests.
21. Report the remaining differences honestly.
```

---

# 62. WHEN THE USER UPLOADS A NEW REFERENCE

If the user supplies a newer screenshot:

**The newest explicit reference supersedes the previous visual reference.**

Do not merge two designs unless the user explicitly asks for that.

Before modifying the UI:

1. inspect the new screenshot
2. identify what changed
3. preserve existing functionality
4. modify only what is necessary
5. repeat visual validation

---

# 63. WHEN THE USER SAYS "MAKE IT EXACT"

Interpret this as:

```text
No creative reinterpretation.
No approximation where measurement is possible.
No redesign.
No shortcuts.
Use screenshot comparison.
```

---

# 64. FINAL RESPONSE FORMAT AFTER IMPLEMENTATION

When the implementation is finished, report:

```text
Implementation complete.

Reference viewport:
828 × 1792

Visual validation:
PASS / PASS WITH MINOR DIFFERENCES

Files changed:
- ...
- ...
- ...

Run:
...

Screenshot:
...

Comparison:
...

Remaining differences:
- ...
```

Do not claim "pixel perfect" if meaningful visual differences remain.

Be precise about what remains.

---

# 65. HIGHEST-PRIORITY RULES

If any instructions conflict, use this priority:

```text
1. User's explicit current instruction
2. Actual supplied reference screenshot
3. Existing application architecture
4. Accessibility and functional requirements
5. This CLAUDE.md
6. Developer preference
```

The screenshot controls visual appearance.

The user's explicit current instruction controls requested changes.

Do not silently reinterpret either.

---

# END OF CLAUDE.md
