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

## Run the app locally

Python 3.11+ is the only runtime dependency. From the repository directory:

```sh
python3 server.py
```

Open http://127.0.0.1:3000. Demo mode works without credentials and shows four clearly labeled sample costumes, their pieces, and an assembly checklist. Demo mode does not research the entered event or fabricate shopping sources.

For live research, copy `.env.example` to `.env` and set `NIMBLE_API_KEY` and `OPENAI_API_KEY`, then restart the server. Obtain the Nimble key from https://online.nimbleway.com and the OpenAI key from your OpenAI API account. Never commit keys or paste them into chat. `OPENAI_MODEL` is configurable (default `gpt-4o-mini`).

Live flow: event name → Nimble event/theme search → four generated concepts with source-backed themes or labeled inferences → select a concept → Nimble shopping search for each piece. Sources are discovery results; verify prices, variants, stock, and delivery on the merchant site. Failed searches are shown per piece. No prices or totals are invented.

This is a local prototype, bound to loopback. Plans expire after an hour and are stored only in memory. Owned/borrow/DIY selections and checkboxes are temporary UI state. No accounts, checkout, public hosting, or persistence is implemented. Event text is sent to Nimble and OpenAI in live mode; shopping queries are sent to Nimble. Provider usage may incur charges.

Verification (with the app running):

```sh
python3 -m unittest discover -s tests -v
```

API references: [Nimble Search](https://docs.nimbleway.com/nimble-sdk/web-tools/search), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

### Costume images with Gemini

Add `GEMINI_API_KEY` to `.env` and restart. `GEMINI_IMAGE_MODEL` defaults to `gemini-2.5-flash-image` and can be overridden for a model your account supports. When the event search returns four costume ideas, image generation starts automatically if the Gemini key is configured. The **Generate / retry missing images** control lets you retry failures. Twelve image jobs are queued together, with four provider requests running concurrently. Each card shows a studio look, party look, and outfit flat lay as they complete. Images are AI inspiration, not merchant product photographs. Results and jobs are cached in memory for the plan lifetime; navigation back to the looks does not regenerate them. Missing images can be retried independently. Gemini image access may require paid billing and sufficient quota.

### Saved searches and generations

Search history now persists locally in `.cache/costumes.sqlite3` (ignored by Git). Expand **Previous searches** to reopen a saved event. Repeating the same event name reuses the latest matching result, separately for demo and live mode; enable **Search again** for a new version. Completed Gemini images and costume sourcing results are reused across refreshes and server restarts. Failed images remain retryable. Cached sources retain their original observation time and may be stale. Old searches from before this feature were only in memory and cannot be recovered after restart. Closet selections and checklist state still are not persisted.

### Visual shopping
Install `requirements.txt` in `.venv` and run `.venv/bin/python server.py`. Public crops are served by a separate image-only server on port 3001. Start `cloudflared tunnel --url http://127.0.0.1:3001 --no-autoupdate` and save its HTTPS base URL in `.cache/public-crop-url`. Each piece's Search this image link opens Google Lens directly using its public crop URL. The quick tunnel works only while the local server and tunnel process are running; a new tunnel may have a different URL. No automatic Google scraping runs.

Set SERPAPI_API_KEY in .env and restart the app to fetch Google Lens visual product matches automatically beneath each crop. Results cache for 24 hours, up to six merchant cards per piece. The public crop tunnel must remain active for new searches.
