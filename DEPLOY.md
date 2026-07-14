# Deploying Zyra Blog Studio to Vercel

This is an **internal tool with live API keys**. Treat the deployment as private.

## Plan requirement — read first

The blog **write** and **image** routes run for up to **120 seconds** (Claude
writes a full article; image gen is slow). Vercel's function limits:

| Plan | Max function duration |
|------|-----------------------|
| Hobby (free) | 60s → **write/image will fail to build or time out** |
| **Pro** | 300s → **required for reliable writing** |

Deploy on **Vercel Pro**. On Hobby, research works but long article writes and
image generation will break.

## 1. Connect the repo

1. Go to [vercel.com/new](https://vercel.com/new) and import
   `toolsatZyra/Blog-studio` from GitHub.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults —
   `next build`, no special settings.
3. Do **not** deploy yet — add environment variables first (step 2).

## 2. Add environment variables

In the import screen (or Project → Settings → Environment Variables), add every
key from [`.env.example`](.env.example) that you use, with its **real** value.
Set them for **Production** (and Preview if you want preview deploys to work).

Minimum for the full pipeline:

- `ANTHROPIC_API_KEY`, `CLAUDE_MODEL_WRITER`
- `OPENAI_API_KEY`, `OPENAI_MODEL_CHEAP`, `OPENAI_IMAGE_MODEL`
- `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`  (SERP + Reddit topics)
- `TWITTERAPI_KEY`  (X questions)
- `GITHUB_TOKEN`, `PUBLISH_REPO`, `PUBLISH_BASE_BRANCH`, `PUBLISH_BLOG_DATA_PATH`  (publishing)
- Google Ads keys (optional — volumes stay null until Basic access is approved)

Copy the values from your local `.env`. **Never** paste secrets into chat or commit them.

## 3. Lock it down (important)

Because the deployment carries live keys and can spend money + open PRs:

- Project → Settings → **Deployment Protection** → enable **Vercel Authentication**
  (free; restricts access to your Vercel team). Or **Password Protection** (Pro).
- Without this, anyone with the URL can run the pipeline and burn your API credit.

## 4. Deploy + verify

1. Click **Deploy**. Wait for the build.
2. On the live URL, open the app and click **Check writer connection** — expect
   both Claude + OpenAI green.
3. Hit the debug endpoints to confirm each provider live (POST):
   `/api/llm-check`, `/api/serp-check`, `/api/reddit-check`, `/api/x-check`,
   `/api/ads-check`, `/api/publish-check`.
4. Run a research → write → export cycle end to end.

## Notes

- **Redeploys:** every push to `main` auto-deploys (Vercel's Git integration).
- **`.env` is never uploaded** — Vercel only uses the env vars you set in its
  dashboard. Keep `.env` local.
- **Region:** default is fine; DataForSEO is pinned to India (location_code 2356)
  in code regardless of where the function runs.
