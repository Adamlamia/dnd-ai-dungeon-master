# D&D AI Dungeon Master - Setup & Deployment Guide

## Quick Start (Cloud Deployment)

This app is designed to work on **any device** - phones, tablets, and computers. Deploy to Vercel for instant mobile access.

### Option 1: Deploy to Vercel (Recommended)

1. **Get a Groq API Key** (free):
   - Visit https://console.groq.com
   - Sign up and create an API key
   - Free tier: ~500 requests/day

2. **Deploy**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   
   # Set environment variables in Vercel dashboard
   # Add GROQ_API_KEY to your project settings
   ```

3. **Access from any device**:
   - Your app will be at `https://your-app.vercel.app`
   - Works on phones, tablets, anywhere with internet

### Option 2: Local Development

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# For Runtime AI (local - recommended for MVP)
RUNTIME_AI_PROVIDER=ollama
RUNTIME_AI_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434/api/chat

# For Prep AI (cloud - optional)
PREP_AI_PROVIDER=groq
PREP_AI_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_groq_api_key_here

# Alternative: Hugging Face
# PREP_AI_PROVIDER=huggingface
# HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
# HUGGINGFACE_API_KEY=your_hf_token_here
```

### 3. Install Ollama (for local AI)

Download from [ollama.ai](https://ollama.ai) and pull a model:

```bash
ollama pull llama3.2
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Features

### ✅ Implemented
- Campaign creation and management
- Character import from D&D Beyond
- Dice rolling (all standard dice)
- Session tracking with narrative log
- AI-powered narration (requires Ollama or cloud AI)
- Responsive web interface

### 🚧 In Progress
- Combat tracker
- Multi-player support
- Voice integration
- Advanced AI preparation tools

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── campaigns/     # Campaign CRUD + AI prep
│   │   ├── characters/    # Character management
│   │   ├── sessions/      # Session management
│   │   ├── dice/          # Dice rolling
│   │   └── ai/            # AI narration
│   └── page.tsx           # Landing page
├── lib/                   # Utilities
│   ├── dndbeyond.ts      # D&D Beyond API client
│   ├── ai-service.ts     # AI provider abstraction
│   └── dice.ts           # Dice rolling logic
├── services/             # Business logic
│   ├── campaignService.ts
│   ├── characterService.ts
│   └── sessionService.ts
├── types/                # TypeScript definitions
└── components/           # React components
```

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/prepare` - Generate AI materials

### Characters
- `GET /api/characters` - List all characters
- `POST /api/characters` - Import from D&D Beyond or create
- `PATCH /api/characters/:id` - Update character

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create/start/end session
- `POST /api/sessions/:id/narrative` - Add narrative entry

### Dice
- `POST /api/dice/roll` - Roll dice (various actions)

### AI
- `POST /api/ai/narrate` - Get AI narration/dialogue/rules

## Data Storage

Currently uses JSON files in `data/` directory. This will migrate to SQLite/Prisma in future versions.

## Troubleshooting

### Ollama Connection Error
Make sure Ollama is running:
```bash
ollama serve
```

### AI Not Responding
Check that:
1. Ollama is running and the model is pulled
2. The model name in `.env.local` matches what you pulled
3. For cloud AI, API keys are valid

### Build Errors
Try:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

This is an MVP project. Contributions welcome! See ARCHITECTURE_PLAN.md for technical details.
