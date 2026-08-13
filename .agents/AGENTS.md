# AGENTS.md

## Critical Rules

1. NEVER modify working code unnecessarily.
2. Before changing an existing feature, inspect the related files and understand the current implementation.
3. Do not create duplicate functions, components, database tables, or API endpoints.
4. Reuse existing utilities and components whenever possible.
5. After making changes, run the project's build/test/lint checks.
6. Do not claim a fix is complete until the relevant check has passed.
7. NEVER share or output a web preview URL without verifying that the web bundle compiles and renders properly without blank screens or unhandled exceptions.
8. NEVER return `null` from root components during font or asset loading guards (`!fontsLoaded`); always render a styled loading container with an `<ActivityIndicator />`.

## Lessons Learned

### Web & UI Rendering
- Returning `null` during font or asset loading (`!fontsLoaded`) causes a blank white screen in React Native Web; always return a fallback loading indicator.
- Verify the correct project directory (`milk-pcs-expo` React Native Expo app vs `MilkPcsReportingApp` Android native repository) before executing scripts or dev commands.
- Run `npx expo export --platform web` or node verification checks after modifying React Native Web components to ensure clean bundling.

### PDF Rendering
- Do not assume that a layout rendering correctly on the emulator means it will render correctly on physical Xiaomi devices.
- PDF layouts must be explicitly measured and laid out before rendering.
- Verify that TextViews actually contain visible text before generating the PDF.
- Do not change the PDF dimensions or scaling without checking the existing working implementation.

### Database
- Never change an existing schema without checking existing migrations/data.
- Do not recreate tables simply because a query fails.
- Preserve existing data during schema changes.

### UI
- Do not introduce a new visual style when an existing component/design system already exists.
- Reuse existing spacing, typography, buttons, cards, and navigation patterns.

## Before Finishing Any Task

- Inspect existing implementation.
- Identify dependencies on the code being changed.
- Make the smallest appropriate change.
- Build the project.
- Run relevant tests/checks.
- Review the diff for accidental changes.
- Report exactly what was changed and what was verified.

