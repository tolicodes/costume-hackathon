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

Verified for this initialization: Markdown relative links and complete GPL text pass local checks. GitHub readback confirms a private repository, a pushed main branch, detected GPL-3.0 license, and pending invitation 337196295 for andnic with write access. A follow-up formatting commit removes the license source’s extra trailing blank line; final whitespace verification is required before that commit. Runtime tests are not applicable to this documentation-only initialization. No paid calls or deployment.

Update this canonical record in the same commit as future repository changes, distinguishing proposals, implementation, verification, and deployment.

## October 11, 2026 — local costume planner

Implemented a dependency-free Python HTTP server and responsive HTML/CSS/JavaScript interface. The requested journey now has four concepts: enter an event, review researched themes and costume choices, select a look, then assemble its components from Nimble-discovered sources or owned/borrowed/DIY alternatives.

`POST /api/ideas` performs Nimble v2 Search and uses OpenAI Responses structured outputs to generate exactly four concepts and component descriptions. Each theme carries a source index or an explicit inference marker. `POST /api/pieces` accepts a server-issued plan identifier and concept index, then searches Nimble shopping focus (`search_depth: lite`) with at most three concurrent requests. Search errors remain scoped to individual pieces. Source URLs come only from Nimble results and must use HTTP(S). Frontend provider text is escaped before rendering. Secrets stay in environment variables or ignored `.env`; static serving uses an explicit allowlist. The server binds to loopback and rejects cross-origin browser API calls.

Demo mode is explicit and labeled, uses fixed illustrative concepts, and returns no researched themes or shopping links. Live mode requires both API keys and fails clearly when configuration is incomplete. Plans are held in bounded memory and expire after an hour. The UI includes loading/error states, back navigation, owned/borrow/DIY controls, and an assembly checklist. Those UI selections are not persisted.

Verified: Python compilation, five passing tests covering the demo journey, request validation, unknown plan, Nimble request shape/unsafe URL filtering, and the model request contract using mocked provider responses. No credentialed provider calls were made. Browser visual verification was unavailable; opening a local preview was queued. Nimble account setup was blocked by declined browser permission. No deployment or GitHub push has been performed. Authentication, rate limiting, durable storage, and public hosting remain future work.

### Gemini costume images

Added `POST /api/images` with a validated plan ID, costume index, and variation index. Three variations per costume use Gemini native image generation, with a global four-worker pool, duplicate-job reuse, polling, partial results, and individual retries. The frontend submits all twelve jobs in parallel and preserves images when returning from sourcing. Keys stay server-side; prompts use the existing costume descriptions and pieces. Images are returned as validated PNG/JPEG/WebP data URLs. Default model is `gemini-3.8-flash-image` via v1beta. The newer documented default returned HTTP 404 with this account. Live parallel requests to 2.5 Flash Image returned HTTP 429: free-tier image quota is zero. No images were generated; billing/quota is an external blocker.

Image generation now starts automatically when a successful event search returns its four concepts, if Gemini is configured. Returning to the results does not retrigger generation. The manual control and per-image retries remain available.

### Persistent search history

Added a local SQLite cache for plans, images, and sourcing responses. Search identity normalizes whitespace and case and separates demo/live results. A fresh-search flag creates a new historical version. History list and plan retrieval endpoints power Previous searches in the UI. Image jobs save completed outputs directly, so results survive even if polling stops. Sourcing responses cache successful look breakdowns with original timestamps; failed sourcing responses are not cached. Plans loaded from disk no longer expire after an hour. Verified normalized search reuse, fresh-version retention, database plan/image/source round trips, JavaScript syntax, and the existing five app tests. Old in-memory searches were not recoverable after restarting the previous server. The persistent cache is ignored by Git; owned/borrow/DIY and checklist state are still temporary.

### Shopping discovery timeout handling

Component discovery now distinguishes timeout and connection errors and falls back from Nimble shopping focus to general web search after a transport failure. Shopping requests have a 45-second socket timeout; fallback uses 75 seconds. Verified the fallback with mocked timeout responses, existing five tests, and a live general search returning three sources. Shopping discovery was observed stalling; the original generic error obscured the failure type.

### Parallel Nimble sourcing

Shopping and general searches now start concurrently for each component, both with 120-second socket timeouts. Results merge by URL, retaining successful results if the other search fails. Event research also uses a 120-second socket timeout. Existing cached sourcing stays reusable. Verified six tests, including concurrent execution via a synchronization barrier, partial failure handling, URL deduplication, and both request timeouts. Restarted the local server.

### Source provenance labels

Nimble source results carry shopping/general provenance. URL deduplication retains both origins when both searches return the same URL. The UI displays subtle Shopping, Web, or Shopping + Web text beside the merchant domain. Older cached sources without provenance display Saved source; their origin is not guessed. Six tests and JavaScript syntax checks pass.

### Amazon and Etsy sourcing

Component discovery now restricts both parallel Nimble requests with include_domains amazon.com/etsy.com, and filters returned URLs by exact host or subdomain. Event/theme research stays unrestricted. A separate sourcing cache namespace prevents reuse of earlier unrestricted sources while preserving saved ideas/images. Seven tests pass, including domain filtering and request-domain restrictions.

User selected Gemini Nano Banana 2.1. Updated default and local model override to gemini-nano-banana-2.1; existing cached images remain reusable.

### Component link validation

Source links are fetched before display with a 15-second request timeout and four concurrent checks. Only successful HTTP 200 HTML pages passing common missing-page and bot-challenge checks are displayed. Redirects must remain on Amazon/Etsy. Validation caches locally for an hour; saved sourcing results are revalidated on retrieval. The UI marks checked links and counts hidden broken/unverifiable links. Bot-blocked links are omitted rather than asserted valid. This validates reachability, not stock, price, or delivery; merchants may block automated checks. Verified mocked reachable, soft-404 and robot-check pages, existing seven tests, and Python/JavaScript syntax.

### Browser-style link checks

Link verification uses Chrome-style navigation headers. Only confirmed 404/410 or missing-page titles are hidden. Bot challenges, forbidden responses, and transport failures stay visible as Couldn't verify. A new validation cache namespace bypasses earlier negative checks. Existing sourcing caches retain raw links, so they can be checked again. Compilation, JavaScript syntax, and seven tests pass. Headers do not reproduce a full browser TLS/JavaScript session.

### Event edition and costume-first layout

Added optional event date, included in search and cache identity. Undated searches target the upcoming current-year edition. Generation distinguishes historical inspiration from confirmed current dress codes. New research cache version prevents silent reuse of earlier edition-agnostic results; old history remains accessible. Costume choices now lead the results screen under Choose your costume. Inspiration names, source links, and short reasons appear in a compact expandable list below the cards. Seven existing tests and syntax checks pass. Exact edition matching still depends on source coverage; absence of a current listing is not proof of a dress code.

Progress indicator now uses a larger sticky panel, distinct current-step highlight, completed-step check marks, and aria-current step semantics. Responsive spacing keeps the three steps visible on mobile.

The selected look page now displays its three generated images above the component list. Shared rendering updates both results and selected look galleries as pending images finish; cached images are reused and the existing enlarge dialog works in both views.

Selected-look refinement now uses a conversational interface. Each message updates the selected costume through structured generation, saves an immutable version with parent ID and chat history, starts new images for that costume, and refreshes sourcing. Unchanged costume artifacts are copied into the new version. Chat messages persist with the saved plan.

Loading status now appears in a fixed high-contrast panel with a larger spinner, readable text, and aria-busy state. This includes component sourcing progress and remains visible when the user scrolls.

Component sourcing now prepares direct Google Images search links per piece, restricted by query to Amazon/Etsy. No Nimble shopping calls or merchant validation requests occur on selection. This is external visual search navigation, not an embedded Google Images results feed. Nimble remains the event research provider.

Google Images component queries now use the component headline plus buy, without retailer restrictions. Links open Google-ranked visual results; the app does not retrieve or rank sponsored listings itself.

## Direct Google Images results
Component sourcing uses SerpApi's google_images engine with headline + buy, unrestricted retailers, three concurrent component requests and a 120-second socket timeout. Shopping cards appear first and are labeled Sponsored, followed by organic results marked as products. Return up to six thumbnail cards with merchant links and prices when supplied. Successful queries cache in SQLite for 24 hours across looks; failures remain retryable. Demo mode makes no product requests. Requires server-only SERPAPI_API_KEY; missing credentials are reported per piece. Google Custom Search is closed to new customers, so it is not used. Merchant availability and links are not claimed to be verified.

## Direct extraction replaces SerpApi
Product sourcing now uses google_products.py and an isolated headless Chromium browser to read Google Images cards directly, with no API key or SerpApi requests. Searches are serialized with a two-second minimum spacing; 24-hour SQLite caching uses a new namespace. Blocked searches trigger a five-minute cooldown and explicit per-piece errors. No CAPTCHA bypass or stealth plugins. Cards require a merchant link and product path/price/ad evidence; missing links are skipped. Sponsored status comes only from visible labels or ad card markers. Prices/availability remain unverified. Install requirements.txt and Playwright Chromium, and launch with .venv/bin/python server.py.

Validation: 10 unit/integration tests and Python/JavaScript syntax checks pass. Live Chromium search for geometric pattern bodysuit reached Google’s automated traffic block; no live cards were obtained through the app browser. The same query showed product cards in the user’s in-app browser. Direct scraping remains subject to Google blocking.

## Piece crops for reverse image search
/api/crops uses a saved generated image (flat lay preferred, then studio/party), Gemini vision gemini-3.8-flash, and normalized [ymin,xmin,ymax,xmax] boxes. One vision request locates all components; validated boxes cache per saved costume and preserve originals. The frontend creates PNG crops with canvas without regenerating images. Low-confidence/absent pieces are flagged for review. A slider editor previews and persists manual boxes via /api/crops/adjust. Crop downloads and a Google Lens link enable user-driven upload; no image is sent to Lens automatically. Crops begin when a look page is open or its first saved image becomes available.

The piece page assumes all components will be purchased. Removed the My plan Buy/Owned/Borrow/DIY selector and its source-hiding behavior.

## User-triggered Google Lens search
Removed automatic Google scraping and its Playwright dependency/module. /api/pieces now returns the costume pieces immediately, with no product provider requests. Removed empty sources and bot-block errors from the UI. Each crop offers Search this image: a user-triggered multipart browser form posts encoded_image to https://lens.google.com/v3/upload in a new tab, uploading only the selected local PNG. No public hosting or server-side Google calls. This undocumented endpoint may change; download remains available as fallback.

Direct browser form upload was tested and Google returned HTTP 403. Removed the failed shortcut. Current UI offers crop download plus the Google Images page; direct URL search awaits public crop hosting approval/configuration.

## Public crop hosting for direct Lens links
User authorized public accessibility after previously preferring local-only. A separate read-only HTTP server on loopback port 3001 serves only SHA-256-named PNG crops. A Cloudflare quick tunnel exposes that image server; the app, API routes, keys, and SQLite history are not served by this handler. Public base URL is stored in ignored .cache/public-crop-url. /api/crops publishes validated crops using Pillow and returns publicUrl per piece. Google Lens uploadbyurl links pass these reachable URLs. Adjusted crops produce new hash URLs. The quick tunnel lasts only while its process and local server are running; restarting it may change the public URL.

Verified public PNG returned HTTP 200 image/png, public /api/history returned 404, and Google Lens uploadbyurl navigated to a visual-search session with the hosted crop. Nine existing tests pass.

## SerpApi Lens visual product matches
After crops are ready the UI requests /api/lens per piece, independently of the crop preview. Server uses engine=google_lens, type=visual_matches, public crop URL, hl=en, country=us and server-only SERPAPI_API_KEY. Three provider calls run concurrently; 120-second socket timeout. Results retain Lens order, deduplicate merchant URLs, exclude social/editorial results without product evidence, and return up to six thumbnail/title/store/price cards. Successful results cache 24 hours by crop content hash; changing a crop starts a new search. Failed requests stay retryable. Direct Lens links remain available.

Validation: live SerpApi search returned six filtered matches for the saved bodysuit crop; cards verified in the app. Eleven tests pass. Crop identity guard prevents older in-flight searches repainting a newly adjusted crop.

### After-dark visual redesign
Homepage replaces the illustrated poster with public/costume-collage.png, generated with the built-in imagegen tool. Prompt: lavish high-fashion costume collage, four adult models in chrome disco armor, violet feather cape, coral ruffles and celestial jeweled headdress; photographic cut-paper montage on midnight black with acid-lime, ultraviolet and pink accents; no text or logos. Server explicitly serves the PNG. Dark palette applies across forms, progress, history, costume cards, styling chat and Lens product cards, with responsive mobile layout and reduced-motion support.
