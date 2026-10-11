# Costume Hackathon

Given an event, help someone choose a costume, assemble it, and source its components.

## Start with one complete journey

Example brief: “An outdoor Halloween party next Saturday in NYC; $100 budget; comfortable enough to dance; I already own black boots.”

Proposed demo:

1. Collect event/theme, date, location, budget, comfort requirements, and owned pieces.
2. Suggest three distinct costume concepts with a short explanation and rough effort level.
3. Let the user choose one, then break it into essential and optional components.
4. Mark each component as owned, buy, borrow, or DIY. For purchases, show real listing links and observed prices; identify unknown size, stock, delivery, and shipping details.
5. Produce an assembly checklist with substitutions and a cost subtotal that clearly labels excluded or unknown costs.

First validation: manually build this plan for one actual event and ask someone whether they could act on it. Start with curated listings; add a single search integration after the plan proves useful. All examples are illustrative until verified against real listings.

## Useful starting points

- **Broad shopping discovery:** [SerpApi Google Shopping](https://serpapi.com/google-shopping-api) documents structured Shopping results. Candidate integration; access, costs, regional coverage, and listing quality need validation.
- **Secondhand and distinctive pieces:** [eBay Browse API](https://developer.ebay.com/develop/api/buy/browse_api) supports listing search and filtering. Candidate integration; production access and real delivery/variant coverage need validation.
- **Handmade accessories:** [Etsy developer portal](https://www.etsy.com/developers/) describes app registration and access levels. Start with manually selected Etsy links rather than making approval a demo dependency.
- **Owned, borrowed, and DIY pieces:** treat these as first-class ways to complete the costume, with practical assembly instructions.

Prefer a stack both teammates already know. Keep one frontend, one server boundary for credentials, and one sourcing adapter. Use maintained packages and official SDKs where appropriate. Framework, model, hosting, and provider selections remain open.

## Demo acceptance

- Three believable concepts fit the same event brief.
- The chosen costume has an actionable component and assembly checklist.
- Every claimed purchasable component has a real source URL; model-generated names are search suggestions, not listings.
- The plan distinguishes verified facts, estimates, and unknowns, especially arrival date and total cost.
- Replacing a component preserves the event brief and the other selected pieces.

Defer virtual try-on, checkout, a marketplace, multi-provider orchestration, and native apps until this journey works.

## Repository status

Initialized October 11, 2026 with a product brief and [architecture record](docs/architecture.md). No application, provider integration, paid test, or deployment is implemented.

This is a separate hackathon repository. Existing Costume Network code, credentials, and production services have not been copied or connected.

## License

GNU General Public License version 3.0 only (`GPL-3.0-only`). See [LICENSE](LICENSE).
