# D&D AI Dungeon Master

**MVP COMPLETE ✅** - A fully functional web-based AI-powered Dungeon Master for D&D 5e campaigns.

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000

See [SETUP.md](docs/SETUP.md) for detailed instructions.

---

## Features

### ✅ Implemented (MVP Complete)

- **Campaign Management**: Create, view, and manage D&D campaigns with AI-assisted preparation
- **D&D Beyond Integration**: Import character sheets directly from D&D Beyond
- **Character Sheets**: Full character display with stats, skills, spells, inventory, and backstory
- **Dice Rolling**: Complete dice roller supporting all standard notation (1d20, 2d6+3, etc.)
- **Session Runner**: Live session interface with real-time AI narration
- **AI Dungeon Master**: Two-AI architecture (Prep AI + Runtime AI) for comprehensive storytelling
- **Narrative Tracking**: Persistent session logs with timestamped entries
- **Responsive UI**: Mobile-friendly web interface built with Next.js and Tailwind CSS

### 🎯 Core Capabilities

1. **Create Campaigns**: Set theme, level range, and tone
2. **Import Characters**: Fetch from D&D Beyond by URL or ID
3. **Prepare with AI**: Generate storylines, NPCs, encounters, and locations
4. **Run Sessions**: Interactive session runner with AI narration
5. **Roll Dice**: Built-in dice roller with advantage/disadvantage support
6. **Track Progress**: Session history and narrative logs persist between sessions

---

## Tech Stack

- **Framework**: Next.js 16 (React 19) with TypeScript
- **Styling**: Tailwind CSS
- **AI Providers**: Ollama (local), Groq Cloud, Hugging Face
- **Storage**: JSON files (migrating to SQLite/Prisma)
- **Integration**: D&D Beyond API (undocumented character service)

---

## Architecture

This project uses a **two-AI architecture**:

1. **Prep AI** (Cloud-based: Groq/HuggingFace)
   - Campaign concept generation
   - NPC creation with personalities
   - Encounter design with CR balancing
   - Location descriptions

2. **Runtime AI** (Local: Ollama)
   - Live session narration
   - NPC dialogue roleplay
   - Rules adjudication
   - Session recaps

See [ARCHITECTURE_PLAN.md](docs/ARCHITECTURE_PLAN.md) for technical details.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── campaigns/     # Campaign CRUD + AI prep
│   │   ├── characters/    # Character management
│   │   ├── sessions/      # Session tracking
│   │   ├── dice/          # Dice rolling
│   │   └── ai/            # AI narration
│   ├── campaigns/[id]/    # Campaign detail page
│   ├── characters/        # Character management page
│   └── page.tsx           # Landing/dashboard
├── lib/                   # Utilities
│   ├── dndbeyond.ts      # D&D Beyond API client
│   ├── ai-service.ts     # Multi-provider AI abstraction
│   └── dice.ts           # Dice rolling utilities
├── services/             # Business logic
│   ├── campaignService.ts
│   ├── characterService.ts
│   └── sessionService.ts
├── types/                # TypeScript definitions
└── components/           # React components
    ├── DiceRoller.tsx
    ├── CharacterSheet.tsx
    └── NarrativeDisplay.tsx
```

---

## Documentation

- **[SETUP.md](docs/SETUP.md)** - Installation and configuration guide
- **[ARCHITECTURE_PLAN.md](docs/ARCHITECTURE_PLAN.md)** - Technical architecture and design decisions
- **[MVP_COMPLETE.md](docs/MVP_COMPLETE.md)** - Complete feature list and testing checklist

---

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

---

## Configuration

Create `.env.local`:

```env
# Runtime AI (local - required for MVP)
RUNTIME_AI_PROVIDER=ollama
RUNTIME_AI_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434/api/chat

# Prep AI (cloud - optional)
PREP_AI_PROVIDER=groq
PREP_AI_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_groq_api_key_here
```

---

## Roadmap

### Completed ✓
- [x] Basic campaign creation
- [x] NPC generation system
- [x] Encounter builder
- [x] Session runner with AI narration
- [x] Character sheet integration
- [x] Save/load campaign state
- [x] D&D Beyond integration
- [x] Dice rolling system

### In Progress
- [ ] Combat tracker UI
- [ ] Prisma/SQLite migration
- [ ] User authentication

### Planned
- [ ] Multi-player support
- [ ] Voice/text interface options
- [ ] Spell reference database
- [ ] Monster stat block library
- [ ] Map/token visualization

---

## Contributing

Contributions are welcome! This is an open-source fan project.

**Ways to help:**
- Test with real D&D sessions and report bugs
- Improve AI prompts for better narration
- Add new features from the roadmap
- Enhance UI/UX
- Write tests

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- Dungeons & Dragons is a trademark of Wizards of the Coast LLC
- This project is a fan creation and not affiliated with Wizards of the Coast
- Special thanks to the D&D community for inspiration
- Built with Next.js, React, Tailwind CSS, Ollama, and D&D Beyond data

---

*Last Updated: October 7, 2026*  
*MVP Status: COMPLETE ✅*
