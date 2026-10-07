# D&D AI Dungeon Master - Architecture & Implementation Plan

## Overview
A web-based D&D 5e AI Dungeon Master that leverages D&D Beyond integration and a two-AI architecture for efficient campaign preparation and runtime session management.

---

## Key Design Decisions

### 1. Two-AI Architecture (Recommended)
**Why:** Separates heavy prep work from fast runtime needs

#### Prep AI (Cloud-based)
- **Provider:** Groq (free tier) or Hugging Face Inference API
- **Purpose:** Campaign preparation, NPC generation, encounter design, story planning
- **Models:** Llama 3.1 8B (Groq), Mistral 7B (HF)
- **When used:** During campaign setup, between sessions
- **Benefits:** Powerful reasoning, comprehensive analysis, no hardware requirements

#### Runtime AI (Local)
- **Provider:** Ollama (local LLM runner)
- **Purpose:** Live session narration, NPC dialogue, rules adjudication
- **Models:** Llama 3.2, Phi-3, or Mistral 7B quantized
- **When used:** During active gameplay sessions
- **Benefits:** Fast response, privacy, unlimited usage, works offline
- **Requirements:** 8GB+ RAM, preferably with GPU

### 2. D&D Beyond Integration
**Why:** Leverage existing character sheets, dice rolling, and game data instead of rebuilding everything

#### Available Features:
- **Character Service API:** `https://character-service.dndbeyond.com/character/v5/character/{id}`
  - Fetches full character data including stats, spells, inventory
  - Undocumented but widely used by tools like Beyond20, Avrae
- **Dice Rolling:** Local implementation (D&D Beyond doesn't expose dice API)
- **Rules Database:** Not directly accessible; use SRD/OGL content + AI knowledge

#### Limitations:
- No official public API (undocumented endpoints only)
- Character data is read-only
- Cannot create/modify characters on D&D Beyond
- May break if D&D Beyond changes endpoints

### 3. Tech Stack
- **Frontend:** Next.js 16 (React 19) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** SQLite with Prisma ORM (pending installation)
- **AI Integration:** Multi-provider support (Ollama, Groq, HuggingFace)
- **State Management:** React hooks + server actions
- **Deployment:** Vercel (for cloud deployment)

---

## Community Skills Found

### Relevant Qoder Skills:
1. **D&D Character Art Generator** (`dnd-character-skill`)
   - Generates D&D character artwork via Neta AI
   - Useful for visual character representation

2. **TRPG Session Framework** (`trpg-session`)
   - Multi-agent TRPG framework with DM and player agents
   - Discord/Feishu integration for group play
   - Memory and rulebook indexing
   - **Consider integrating or learning from this**

3. **Agent RPG Engine** (`agent-rpg`)
   - Converts agent into RPG GM with long-term memory
   - Supports multiple rule systems (D20, PbtA, freeform)
   - Game state file management

4. **Lobster RPG System** (`claw-rpg`)
   - D&D 3.5-based character system
   - Auto-generates character cards from memory files
   - XP tracking, reputation system, arena combat

**Recommendation:** Study TRPG Session Framework for multi-agent patterns and memory management approaches.

---

## Core Features Required

### Phase 1: Foundation (Week 1-2)
- [x] Next.js project setup
- [ ] D&D Beyond character import service
- [ ] Basic campaign creation UI
- [ ] Character sheet viewer (from D&D Beyond data)
- [ ] Simple AI chat interface (Ollama)

### Phase 2: Campaign Preparation (Week 2-3)
- [ ] Campaign concept generator (Prep AI)
- [ ] NPC generator with personality traits
- [ ] Encounter designer with CR balancing
- [ ] Location description generator
- [ ] Story arc planner
- [ ] Save prepared materials to database

### Phase 3: Session Runner (Week 3-4)
- [ ] Real-time narrative display
- [ ] Dice roller (1d20, 2d6, etc.)
- [ ] Combat tracker with initiative
- [ ] NPC dialogue system (Runtime AI)
- [ ] Rules adjudication assistant
- [ ] Session recap generator

### Phase 4: Polish & Testing (Week 4-5)
- [ ] Responsive UI improvements
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] User testing and feedback
- [ ] Documentation

---

## Data Models

### Campaign
```typescript
{
  id: string
  name: string
  theme: string
  levelRange: { min: number, max: number }
  tone: 'serious' | 'comedic' | 'horror' | 'epic'
  preparedMaterials: {
    storyline: string
    npcs: NPC[]
    locations: Location[]
    encounters: Encounter[]
  }
}
```

### Character (from D&D Beyond)
```typescript
{
  id: string
  dndbeyondId: string
  name: string
  race: string
  classType: string
  level: number
  abilityScores: { str, dex, con, int, wis, cha }
  hitPoints: { current, maximum, temp }
  armorClass: number
  skills: Record<string, { value, proficient }>
  spells?: SpellList
  backstory?: string
}
```

### Session
```typescript
{
  id: string
  campaignId: string
  sessionNumber: number
  narrativeLog: NarrativeEntry[]
  diceRolls: DiceRoll[]
  combatLog?: CombatEntry[]
  recap?: string
}
```

---

## AI Prompts Strategy

### Prep AI Prompts
1. **Campaign Concept:** Theme + level range → story arcs, major NPCs, hooks
2. **NPC Generation:** Role/race/class → personality, motivations, secrets, dialogue
3. **Encounter Design:** Party level + difficulty → balanced enemies, tactics, rewards
4. **Location Creation:** Type + atmosphere → sensory descriptions, interactive elements

### Runtime AI Prompts
1. **Scene Narration:** Prepared materials + player actions → dynamic narrative
2. **NPC Dialogue:** Character personality + player input → in-character responses
3. **Rules Adjudication:** Situation description → fair ruling with explanation
4. **Session Recap:** Session events → "Previously On..." summary

---

## File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── campaigns/         # Campaign management pages
│   │   ├── page.tsx       # Campaign list
│   │   └── [id]/          # Campaign detail
│   ├── characters/        # Character management
│   │   └── [id]/          # Character sheet view
│   └── sessions/          # Session runner
│       └── [id]/          # Active session
├── lib/                   # Utilities
│   ├── dndbeyond.ts      # D&D Beyond API client
│   ├── ai-service.ts     # AI provider abstraction
│   └── dice.ts           # Dice rolling logic
├── services/             # Business logic
│   ├── campaignService.ts
│   ├── characterService.ts
│   └── sessionService.ts
├── types/                # TypeScript definitions
│   └── index.ts
├── components/           # React components
│   ├── ui/              # Base UI components
│   ├── CharacterSheet.tsx
│   ├── DiceRoller.tsx
│   ├── NarrativeDisplay.tsx
│   └── SessionControls.tsx
└── hooks/               # Custom React hooks
    ├── useDnDBeyond.ts
    ├── useAI.ts
    └── useDice.ts
```

---

## Environment Variables
```env
# AI Configuration
PREP_AI_PROVIDER=groq
PREP_AI_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_key_here

RUNTIME_AI_PROVIDER=ollama
RUNTIME_AI_MODEL=llama3.2
OLLAMA_URL=http://localhost:11434/api/chat

# Alternative: Hugging Face
# PREP_AI_PROVIDER=huggingface
# HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
# HUGGINGFACE_API_KEY=your_key_here

# Database
DATABASE_URL="file:./dev.db"
```

---

## Next Steps

1. **Complete Prisma Setup** (blocked on npm install hanging)
   - Alternative: Use JSON file storage temporarily
   - Or try: `npm install --force` or use yarn/pnpm

2. **Build D&D Beyond Integration**
   - Test character fetch with known character ID
   - Parse and display character data
   - Create character import UI

3. **Implement Basic AI Service**
   - Start with Ollama only (simplest setup)
   - Add Groq/HF later when ready for Prep AI

4. **Create Core UI Components**
   - Campaign dashboard
   - Character sheet viewer
   - Simple chat interface for sessions

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| D&D Beyond API changes | High | Cache character data locally; build fallback manual entry |
| Ollama performance slow | Medium | Use smaller models; optimize prompts; add streaming |
| Free AI tier limits | Medium | Implement request queuing; cache AI responses |
| Complex D&D 5e rules | High | Focus on core mechanics first; expand gradually |
| Scope creep | High | Stick to MVP features; defer advanced features |

---

## Success Criteria for MVP
- ✅ Import character from D&D Beyond
- ✅ Create basic campaign with AI assistance
- ✅ Run live session with AI narration
- ✅ Roll dice and track results
- ✅ Save/load session state
- ⏳ Responsive, usable web interface

---

*Last Updated: 2026-10-07*
