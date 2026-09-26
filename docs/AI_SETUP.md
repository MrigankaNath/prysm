# Prysm AI library: decisions, activation, and launch limits

Implemented September 26, 2026. **Disabled by default.** No new AI credentials are present in the development environment. Structural/security tests are not a substitute for a real-provider quality evaluation. Do not enable the public feature before completing the activation checklist below.

Verification at implementation: 51 regression/unit tests passed; root/client lint passed with existing warnings; production client build passed; both production dependency audits reported zero vulnerabilities. Rollback-only database checks exercised vector search, resource/selection writes, duplicate queue entries, budget reservations and access controls. The guarded reader successfully extracted the arXiv reference-page test; the Wikipedia HTML test fell back to metadata. Real Gemini/Cloudflare inference and the authenticated UI flow have **not** been verified without the new credentials/session. Three initial jobs—robotics, machine learning and system design—are queued, with no new provider calls made.

## What AI does—and what it does not

1. **Understands a learning goal.** Gemini Flash-Lite turns the full request into a subject, intent, constraints, and at most two complementary search queries. “What is robotics?” and “robotics over the years” get different selections. Only simple, deterministic paraphrases share a cache key; the system does not guess that every vaguely similar request means the same thing.
2. **Reuses the catalogue first.** PostgreSQL full-text retrieval, optionally combined with 384-dimensional Cloudflare embeddings, supplies existing candidates. Reciprocal-rank fusion combines lexical and semantic results. Embeddings run in the worker, not in the browser or on ordinary page requests. A new uncached request immediately gets provisional lexical/old-cache matches and joins the queue.
3. **Spends Tavily only on gaps.** No repeated beginner/intermediate/advanced search templates in AI mode. At most two explicit `basic` searches; `auto_parameters:false` prevents an automatic advanced-search upgrade. Query results are shared for 30 days. Existing high-confidence overview coverage can eliminate both searches. The old discovery pipeline stays unchanged while AI is disabled.
4. **Reads bounded public excerpts.** At most 12 candidates per selection, prioritised across reading categories. HTML/text only; no browser execution, paywall bypass, PDF download, or unofficial transcript scraping. The worker reads up to 6,000 extracted characters, not an entire book or paper. Blocked pages remain usable as metadata-only results.
5. **Assesses evidence.** Flash-Lite proposes document-level difficulty, prerequisites, useful summaries, goal relevance, and quality. Assessments must cite an exact excerpt from the supplied text. Metadata-only confidence is capped at 0.5 in code. Scores remain heuristics, not factual verification; provenance badges retain their original meaning.
6. **Builds a shared Prism.** Gemini Flash chooses only supplied, assessed resource IDs, arranges meaningful stages, and explains each inclusion. Validators reject unknown IDs and forward prerequisite references. Publication needs at least five resources, two stages, multiple domains, sufficient page-excerpt evidence, and confidence/quality floors. Thin coverage produces no AI Prism. This is preferable to padding a bundle. Explicit path order takes precedence over the old video-before-article heuristic.
7. **Serves the result repeatedly.** Explore, feeds, paths and AI Prisms read stored data. A two-minute, bounded process cache reduces repeat DB reads. Regular selections last 30 days; research selections last seven. Stale selections stay readable during refresh. No model call for bookmarks, progress, filters, feed visits, or personalisation. No account IDs, email, history, or bookmarks enter prompts.

The product promise should be **“carefully selected, evidence-grounded starting points”**, not “the objectively best content on the entire internet.” Search indexes have gaps; models can misjudge teaching quality. AI Prisms explicitly say “AI-selected … not human-verified.” Existing hand-curated Prisms remain separate and unchanged. Verified-party collections can be added later to that curated core.

## Provider decisions

| Job | Choice | Reason / tradeoff |
| --- | --- | --- |
| Planning and batch assessment | `gemini-3.5-flash-lite` | Suitable efficient first choice for structured extraction; one provider/key, bounded JSON output. Quality still needs evaluation on Prysm queries. |
| Shared Prism selection | `gemini-3.8-flash` | Stronger model reserved for the consequential ordering/coverage decision, at most one call per completed job. |
| Optional embeddings | Cloudflare `@cf/baai/bge-small-en-v1.5` | Small English embeddings, 384 dimensions, inexpensive inference; fits a small pgvector catalogue. Not a multilingual search promise. |
| Search | Existing Tavily basic | Controlled web discovery, not an LLM's invented reading list. Maximum two searches per job. |
| Storage, queue, search | Existing Supabase Postgres + pgvector | One durable system; no Redis, dedicated vector service, GPU server, or new paid infrastructure. |
| Scheduling | Local worker now; hosted scheduling requires approval | Keeps secrets on the existing machine until an explicitly approved worker host is configured. Render's free web service is not a dependable background worker. |

The Gemini model IDs and free pricing above were checked against [Google's current pricing](https://ai.google.dev/gemini-api/docs/pricing). They are configurable, not hard-wired to a provider alias that can silently change. Actual RPM/TPM/RPD vary by project: [check AI Studio's active limits](https://ai.google.dev/gemini-api/docs/rate-limits) before enabling. No claim that one model is universally “best”; this is the initial cost/quality choice to evaluate.

I did not add Groq as a third inference vendor, a browser-downloaded transformer, a general-purpose agent framework, or live chat generation. None is necessary to address Prysm's measured weaknesses. Browser inference adds model download, memory and mobile latency without giving the browser the complete catalogue; the durable catalogue and goal-specific query/evidence work have higher leverage.

## Realistic free launch capacity

**Start with 50 invited heavy library readers. Target 100 only after measuring a week of real usage.** The earlier 100-user estimate is a provisional ceiling, not a load-test result or a provider guarantee.

Define “heavy” explicitly:

- 20 topic/selection opens and 10 feed visits per person per day, mostly to shared, prepared material.
- At most **two entirely new shared selections per account per calendar month**. Already prepared/queued selections and their refreshes do not spend another personal credit.
- Entirely new requests are asynchronous and can take hours or longer during bursts/quota pauses. This is not an instant arbitrary research service.

At 100 such users: 60,000 topic opens + 30,000 feed visits/month. If effective DB traffic averages 40 KB per topic and 30 KB per feed, that is approximately **3.3 GB/month before auth, other queries and overhead**. Those are target assumptions, not measurements of the AI catalogue. An uncached feed can fetch eight topics: 200 KB per cold feed would instead make feed traffic alone 6 GB. That is why the starting cap is 50, not a guarantee of 100. Per-topic feed caching (five minutes, at most 100 topics) and selection caching (two minutes) reduce repeat reads across users, but the actual hit rate must be measured. Supabase's [free plan](https://supabase.com/pricing) has 500 MB database storage and 5 GB ordinary egress; its “50,000 MAU” is an authentication allowance, not a guarantee this whole app can support that many heavy users. Current measured DB size at implementation: approximately 13.3 MB, 392 topic-cache rows across 94 topics, 8.2 KB average / 22.8 KB maximum raw cached JSON per topic. AI annotations and fuller coverage will increase that baseline.

The new-selection budget is tighter than the storage budget:

- 100 users × 2 novel requests = 200 jobs/month.
- Normally at most 400 Lite calls, 200 curator calls, and 400 Tavily credits for those jobs. Cache reuse can reduce this; failures/retries, prewarming and refreshes consume the same pools and reduce capacity.
- The 500-Lite-call cap permits roughly 250 fully new jobs/month before retries. The 220-curator cap and daily availability can bind earlier. Keep the balance for a small prewarmed core and refreshes; do not prewarm all 248 Spectrum topics immediately.
- **If “heavy” means five entirely new topics per day per person, the free allocation supports only about one such user reliably**, not 100. Ten new topics per day already exceeds the expected monthly new-job budget for one person. Shared interests and a finite curated catalogue are what make the 50–100-reader beta possible.

These numbers depend on the actual Gemini account allowance. If Flash-Lite only allows ten calls/day in your account, reduce `AI_LITE_REQUESTS_DAY` accordingly and lower the user cap. If daily capacity is below launch needs, do not switch billing on accidentally to make the queue faster.

Track provider usage, queue age, DB size/egress, and API latency. Freeze invitations at 70% of the monthly resource allowance, sustained queue age over 24 hours, or unacceptable response time. There is no justified promise of 50,000 heavy users at zero cost.

## App-side ceilings

| Resource | Default rolling 24 hours | Default rolling 30 days |
| --- | ---: | ---: |
| Gemini Flash-Lite requests | 18 | 500 |
| Gemini Flash requests | 8 | 220 |
| Tavily basic-search credits | 30 | 800 |
| YouTube searches (101 units each including enrichment) | 40 | 600 |
| Cloudflare embedding texts | 5,000 | 60,000 |

Additional conservative daily token reservations: Lite 1,000,000; curator 160,000; embeddings 1,000,000. These use input UTF-8 bytes as a deliberately generous token estimate, plus output headroom for Gemini. They are **our safety ceilings**, not published provider entitlements. A model's per-minute limit can still return 429; that defers the job without a tight retry loop.

Tavily reservations also count three credits for each topic charged by the legacy system this calendar month. At implementation this was 41 topics = 123 estimated credits. The estimate is deliberately conservative because the old meter charged before the call. Check the real Tavily dashboard for other applications/manual calls using the same project. Never share these budgets with an unmetered app.

Reservations commit in Postgres before a request is sent, under an advisory transaction lock. Failed/ambiguous attempts still count. Worker stages checkpoint completed work. One worker holds a database session lock; abandoned jobs have a 20-minute lease. A crash in the small interval after a provider replies but before its checkpoint can repeat a call, but both attempts consume the budget—this is not exactly-once execution. The queue allows 100 pending jobs, 300 newly created job keys per rolling month, three processing attempts, and a 5,000-resource catalogue ceiling. Configuration/quota errors defer rather than burn retries.

Budget exhaustion stops new enrichment, not cached browsing. None of these controls can prevent charges from a separately enabled paid provider plan or unrelated API-key usage. **For a real $0 ceiling, keep each provider on its free plan and do not attach paid billing/automatic recharge.** Tavily offers [1,000 free credits/month](https://docs.tavily.com/documentation/api-credits). Cloudflare offers [10,000 neurons/day on Workers Free](https://developers.cloudflare.com/workers-ai/platform/pricing/); this small embedding model uses 1,841 neurons per million input tokens. Stay on Workers Free.

## Exactly where to get and put credentials

Never paste secrets into chat, a commit, a screenshot, frontend code, a `VITE_*` variable, or a shell command containing their literal value. Only the existing Supabase public URL/anon key belong in the browser. The database connection and all provider keys are private.

### 1. Gemini (required for the worker)

1. Open [Google AI Studio API keys](https://aistudio.google.com/apikey).
2. Create/select a dedicated Prysm project on the **Free** tier, then create its API key. Do not connect a billed project or enable billing.
3. Use Google's Gemini-restricted key setup; review the current [API-key security instructions](https://ai.google.dev/gemini-api/docs/api-key). Restrict a standard key to the Generative Language API if that key type requires manual restrictions. Do not restrict it as a browser/referrer key—the worker is server-side.
4. Check that both configured models are available and inspect their actual rate limits in AI Studio. Lower the two daily request variables if necessary.
5. In your editor, add `GEMINI_API_KEY=...` to the **gitignored root `.env` used by the worker**. On this machine, the existing secret file is `/Users/mriganka/prysm/.env`. Do not edit `client/.env` for AI keys. Preserve existing database/auth settings.

Google's free tier may use submitted content to improve its products. This implementation sends the learning query and public excerpts/metadata—not private account data. Do not enter confidential information in learning queries. A stricter privacy commitment would need a provider/plan with appropriate data terms. “Public webpage” does not eliminate source copyright/terms obligations; do not turn this into a full-text republishing system.

### 2. Tavily (already used by Prysm)

1. Open [Tavily](https://app.tavily.com/) and use the existing free-plan project/key.
2. Keep it as `TAVILY_API_KEY` in the root worker `.env`.
3. Check remaining credits and keep pay-as-you-go/automatic recharge off. The worker never requests advanced search or paid extraction.

### 3. Cloudflare embeddings (optional)

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Workers AI → Use REST API**.
2. Choose **Create a Workers AI API Token**, review the prefilled scope, and copy the token and Account ID. Restrict access to this account, not all accounts. Do not use a global API key or a full-account token.
3. Add `CF_AI_API_TOKEN=...` and `CF_ACCOUNT_ID=...` to the same root worker `.env`.
4. Remain on **Workers Free**. The official [REST setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) says a manually created token needs Workers AI Read and Edit. The dashboard template is the simpler option.

Without these two values, the worker uses lexical retrieval; the rest of the AI flow still works. This avoids blocking activation on an optional provider.

### 4. Database and existing sources

Use the existing `DATABASE_URL` **Session Pooler** connection (IPv4), not the Supabase browser key. The worker needs no `SUPABASE_SERVICE_ROLE_KEY`, user JWT, or browser session. Its current connection has broad database authority, so keep it on a trusted host. A separate least-privilege database role should be provisioned before moving it to an untrusted/shared worker host; never publish the password. Existing `YOUTUBE_API_KEY` is optional for videos; its separate budget is not tied to Tavily. Missing video configuration never fabricates statistics/transcripts.

## Activate in stages

From a checkout containing this feature, with Node 22 and the root `.env` available:

```sh
npm ci --ignore-scripts
npm run ai -- migrate
npm run ai -- status
```

The production migration was already applied during implementation; it is idempotent. Six additive tables, pgvector, RLS on all six, and no `anon`/`authenticated` table or budget-sequence privileges. Existing app tables were not altered.

Set `AI_ENABLED=true` **only in the local worker environment** initially. Then:

```sh
npm run ai -- prewarm "robotics" "machine learning" "system design"
npm run ai -- work 1
npm run ai -- status
npm run ai -- review "robotics"
```

For this machine's separate deployment checkout, use the existing secret file without copying it:

```sh
DOTENV_CONFIG_PATH=/Users/mriganka/prysm/.env node -r dotenv/config scripts/ai.js status
```

Run that from the feature checkout (`/private/tmp/prysm-deploy-cards` in this session), with Node 22 selected. The same prefix works for `prewarm` and `work`. Commands never print key values. Do not commit `.env`; verify `git check-ignore .env` before adding credentials in another checkout.

Inspect the actual outputs in the database/preview before launch: beginner robotics, robotics history, a constrained practical request, a specialist research request, and an out-of-scope request. Compare with the legacy results using the same prompts. Check real links, prerequisites, author identity, relevance, diversity, hallucinated summaries, and whether the chosen sequence really teaches the goal. A five-query smoke review is a start, not a model benchmark; expand to at least 30 queries before claiming a quality improvement.

Once the worker is producing good selections reliably, open **Render → Prysm API service → Environment**, add **`AI_ENABLED=true`**, and redeploy. `AI_USER_NEW_REQUESTS_MONTH=2` may be set there explicitly. **No Gemini or Cloudflare key is needed on Render:** the API only reads and queues. No AI keys or AI flag are needed on Vercel. Keep the worker's flag separate from the API flag so initial prewarming does not change the public app.

Rollback is `AI_ENABLED=false` on Render. That restores the previous live-discovery flow; it does not delete the catalogue or disable a separately running worker. To stop spending too, disable the worker or set its flag false.

### Scheduling status

The persisted queue and bounded worker are implemented. The local commands are:

```sh
npm run ai -- refresh
npm run ai -- work 2
```

Run periodically on an approved host. `refresh` only queues up to three expired public Prisms; on-demand stale queries queue their own refresh. It does not recrawl the whole catalogue. A laptop worker stops when the machine sleeps or disconnects.

**An hourly GitHub Actions workflow is not installed yet.** Safety review requires explicit approval before giving GitHub-hosted repository code access to the database and provider credentials. General approval to continue implementation does not decide that trust boundary. If approved, use encrypted repository/environment secrets, trusted `main` code only, read-only GitHub permissions, no PR-triggered secret access, pinned actions, `npm ci --ignore-scripts` with no secrets available during installation, secrets scoped only to the worker step, and job/concurrency/time limits. GitHub scheduling is best-effort and can be delayed; it is not an instant-job SLA. No credential has been uploaded to GitHub as part of this work.

## Security and operational limits

- Every new public-facing path remains behind existing bearer authentication. User quota identity comes from `req.userId`, never request input. SQL is parameterized.
- Model output never supplies executable code, SQL, arbitrary tools, or new Prism URLs. JSON is validated; exact evidence checks are necessary but do **not** prove the model's interpretation is correct.
- The reader validates every redirect, checks all resolved addresses, pins the approved IP to the connection, rejects private/mapped/non-global destinations, permits only HTTP(S) standard ports with no URL credentials, and limits redirects, time and bytes. It cannot execute page JavaScript or read local files.
- Provider errors are sanitized. Request data and keys are not logged. The application never automatically retries within the provider call; persisted retries are budgeted.
- Source excerpts are transient; stored assessments retain a short supporting excerpt. Whole downloaded HTML is not stored. No attempt is made to access authenticated/private content.
- Only a narrow English STEM catalogue is targeted initially. Empty podcasts or a missing Prism are honest results, not errors to conceal with unrelated recommendations.
- Pending jobs, catalogue size, source caches, failure attempts and spend are bounded. Provider tokens are estimated conservatively, but provider dashboards are still the billing authority.
- Production dependency audits and regression tests must pass. Live provider behavior remains unverified until keys are configured. Free-tier services have availability, sleeping, and quota restrictions; a $0 deployment is not an uptime guarantee.
- Recheck hosting eligibility before public/commercial launch: [Vercel Hobby](https://vercel.com/docs/plans/hobby) is restricted to personal non-commercial use; [Render Free](https://render.com/docs/free) has idle spin-down and other limitations. Adding payments may require hosting upgrades independently of AI usage.
