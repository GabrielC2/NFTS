# MonkeyGen — NFT Variation Studio

Generate NFT variations powered by **gpt-image-1** (OpenAI's best image model).

## How it works

1. Upload your base NFT image
2. Select traits to vary (background, hat, glasses, fur color, etc.)
3. Click Generate → backend calls OpenAI API with proper multipart handling
4. Download your variations

## Stack

- **Next.js 14** (App Router)
- **gpt-image-1** via OpenAI edits endpoint
- **GPT-4o Vision** to analyze base image style
- Deployed on **Vercel**

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Luis901702/monkey-nft-gen
cd monkey-nft-gen
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
OPENAI_API_KEY=sk-proj-your-key-here
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add environment variable: `OPENAI_API_KEY` = your key
4. Deploy!

## Cost

- ~$0.04 per image (gpt-image-1 standard 1024x1024)
- GPT-4o vision analysis: ~$0.001 (run once per session)

## Requirements

Your OpenAI account needs access to:
- `gpt-image-1` (available to verified org accounts)
- `gpt-4o` (standard API access)
