# PoemForge — a tiny poetry kiosk

PoemForge is a creative app that turns a mood, a style, and (optionally) a topic word into a
fresh poem or micro-story. Built for the AWS **Build a Creative App** weekend challenge, it runs
on AWS Free Tier services — **Amazon Bedrock (Nova), Lambda, API Gateway, and S3** — while also
working fully offline thanks to a built-in deterministic poem engine.

It never breaks: if the AI path fails, times out, or has no credentials, the backend silently
falls back to the hand-crafted engine. A small badge on each poem tells you whether it was
"sparked by Nova" or "crafted by hand".

![stack: Vite + React frontend, Node Lambda/Express backend, Bedrock Nova + fallback engine](https://img.shields.io/badge/stack-Vite%20%2B%20React%20%2B%20Lambda%20%2B%20Bedrock-8a5cf6)

## What it does

Pick a **mood** (`happy`, `calm`, `curious`, `whimsical`, `melancholy`, `epic`), a **style**
(`haiku`, `free verse`, `rhyming`, `limerick`, `micro-story`) and a **length**, optionally add a
**topic** word, then hit **Generate**. The result animates in line by line and is saved to a
local history. Copy and share buttons are included.

## Repository layout

```
frontend/            Vite + React + TypeScript single-page app
  src/               components, styles, api client, tests
backend/             Node.js backend (shared generation module)
  src/engine.js      deterministic template engine (the fallback)
  src/bedrock.js     Amazon Bedrock (Nova) invocation wrapper
  src/generate.js    validation + Bedrock-first, engine-second flow
  src/handler.js     AWS Lambda handler
  src/server.js      Express dev server (port 3001)
  test/              node:test unit tests
infra/
  template.yaml      AWS SAM template (Lambda + API Gateway + IAM)
  samconfig.toml     sam deploy defaults
docs/                design spec
start.sh             runs backend + frontend for local development
```

## Run it locally

Requirements: Node.js 18+ (npm 9+).

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Start both services (backend on :3001, frontend on :5173)
./start.sh
```

Then open http://localhost:5173. The Vite dev server proxies `/api` to the backend.

- With valid AWS credentials in the environment (and Bedrock Nova enabled in `us-east-1`), the
  backend calls the real model.
- Without credentials, the backend uses the deterministic engine. Everything works either way.

### Run tests

```bash
cd backend && npm test      # node:test unit tests for the engine + validation
cd ../frontend && npm test  # Vitest component tests
```

## Deploy to AWS (Free Tier)

### Backend — SAM

From the `infra/` directory:

```bash
sam build
sam deploy --guided   # or: sam deploy
```

The CloudFormation stack creates:

- A `nodejs20.x` Lambda function with `bedrock:InvokeModel` permission (256 MB, 15 s timeout).
- An API Gateway REST API exposing `POST /api/generate` and `GET /health`.

The template outputs `PoemForgeApiUrl`. Note the model defaults to
`amazon.nova-micro-v1:0` in `us-east-1`; you can override both via the
`BedrockModelId` / `BedrockRegion` stack parameters. Make sure the chosen region has
**Bedrock model access enabled** for the model in the AWS console (Bedrock > Model access).

### Frontend — S3

```bash
cd frontend
npm run build
# serve dist/ from an S3 bucket (static website hosting enabled), or CloudFront
```

Point the built app at the deployed API. Since the static site may not share an origin with the
API Gateway, build with the API base URL baked in:

```bash
VITE_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod npm run build
```

The frontend appends `/api/generate` to `VITE_API_URL` (leave it unset for local dev, where the
Vite proxy is used).

### Cost notes

All services used qualify for AWS Free Tier (Lambda, API Gateway, S3). Bedrock pricing is
pay-per-token — a single `amazon.nova-micro-v1:0` generation costs a fraction of a cent, and
new accounts receive up to $200 in Free Tier credits. The fallback engine costs nothing at all.

## How generation works

1. The frontend posts `{ mood, style, length, topic }` to `/api/generate`.
2. The backend validates the payload, then tries Bedrock Runtime `InvokeModel` with a crafted
   prompt (5 s timeout). The model is asked to return strict JSON.
3. On success, the response is returned with `usedAi: true`.
4. On any failure — missing credentials, region not enabled, throttling, timeout, malformed
   output — the backend falls back to the deterministic engine (`src/engine.js`), a curated
   template system with per-mood word banks and a seeded PRNG, and returns `usedAi: false`.

Response shape:

```json
{
  "poem": "lines of generated text...",
  "title": "optional title",
  "usedAi": false
}
```

## Tests

- Backend (`node:test`): engine determinism, all mood/style/length combinations, topic weaving,
  haiku line counts, length scaling, and input validation (invalid enums -> 400).
- Frontend (Vitest + Testing Library): rendering, generation flow with a mocked fetch, AI badge,
  and error handling.

See `docs/superpowers/specs/2026-08-18-poemforge-design.md` for the full design doc.
