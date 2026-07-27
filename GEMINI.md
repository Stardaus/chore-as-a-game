# Gemini CLI Project Instructions

This project follows these specific technology and implementation guidelines:

- **Framework & Tooling:** Use **React** with **Vite** as the build tool.
- **Progressive Web App (PWA):**
  - Use **Workbox** for service worker implementation and offline capabilities.
  - Use `npx pwa-asset-generator` for generating PWA icons and splash screens.
- **Data Persistence:** Use **IndexedDB** for local storage and client-side data management.

**MUST DO** - code obfuscation via vite minification - encryption of IndexedDB

**Workflow & Planning**

- Use `docs/PLAN.md` to plan implementation of any changes.
- **Process:**
  1.  Propose a detailed plan in `docs/PLAN.md`.
  2.  Discuss and refine the plan with the user until they are satisfied.
  3.  **WAIT** for the user's explicit prompt to execute the plan.
  4.  Upon execution, comment out the completed plan within `docs/PLAN.md` to preserve history while clearing space for future plans.

**Bug Reporting & Fixes**
Every time you fix a bug, you MUST provide a summary at the end of your response using the following format:

- **Bug Title**: Concise name of the issue.
- **Bug Description**: What was happening and why it was incorrect.
- **Bug Location**: File path(s) and line/function.
- **Bug Fixes**: Summary of the technical changes made to resolve it.
