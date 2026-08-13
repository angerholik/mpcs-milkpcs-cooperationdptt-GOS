# AGENTS.md - Permanent Rules & Guidelines

## 1. Prevent Blank Output & Empty Responses
- **No Blank Agent Responses**: Never end a conversation turn or tool invocation with a blank, empty, or missing text response. Always provide a clear, concise, and visible summary of all work done, changes made, and test results.
- **UI Component Output Integrity**: When creating or editing UI components (React, React Native, HTML, etc.), ensure all render paths, calculations, variables, and fallbacks evaluate to valid non-empty data so that screens, components, and text fields never render blank.
- **Artifact & File Completeness**: Always verify that generated or modified files and artifacts contain complete, fully populated content with no missing placeholders or 0-byte outputs.
