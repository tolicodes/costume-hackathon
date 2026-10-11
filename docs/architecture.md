# Architecture record

## October 11, 2026 — repository initialization

Implemented: README product brief, repository ignore rules, and GPL-3.0-only license. This is documentation and project setup; there is no executable application or deployed service.

Proposed flow: event brief → three concepts → chosen costume → component sourcing → assembly checklist. This flow is a starting recommendation, not an implemented or user-approved architecture.

Proposed contracts:

- Event brief: event/theme, date, location, budget/currency, comfort constraints, and owned pieces.
- Costume concept: name, event fit, difficulty/effort, and required component descriptions.
- Component: role, essential/optional, owned/buy/borrow/DIY status, substitutions, and assembly instructions.
- Listing evidence: provider, source URL, title, observed price/currency and time; size, availability, shipping, and arrival evidence may be unknown.
- Cost summary: purchased-piece subtotal with estimates and missing shipping/tax explicitly identified.

A model may propose costume ideas and search terms. Claims about products and delivery must come from listing evidence. Secrets stay on the server. No model, framework, external API, runtime configuration, backend endpoint, or hosting target has been selected or integrated.

Verification for this initialization: inspect tracked files and GPL text; check Markdown relative links and whitespace; verify GitHub repository visibility, pushed commit, and collaborator invitation separately. Runtime tests are not applicable to this documentation-only initialization. No paid calls or deployment.

Update this canonical record in the same commit as future repository changes, distinguishing proposals, implementation, verification, and deployment.
