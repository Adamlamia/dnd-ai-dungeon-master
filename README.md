# D&D AI Dungeon Master

An AI-powered Dungeon Master that prepares and manages Dungeons & Dragons campaigns, handling both short and long campaigns just like a real DM would.

## Features

- **Campaign Preparation**: Generate campaign settings, storylines, NPCs, and encounters
- **Session Management**: Run game sessions with dynamic storytelling and rule adjudication
- **Character Integration**: Support for player characters with stats, backstories, and progression
- **Flexible Campaign Length**: Handle one-shots, short campaigns, or epic long-term adventures
- **Rules Knowledge**: Comprehensive understanding of D&D 5e (or other edition) rules
- **Dynamic Storytelling**: Adapt to player choices and create engaging narratives

## Tech Stack

- **Backend**: Node.js/Python (to be determined)
- **AI Integration**: LLM API integration for narrative generation
- **Data Storage**: Database for campaign state, characters, and session history
- **Interface**: Web-based or CLI interface for gameplay

## Getting Started

### Prerequisites

- Node.js (v18+) or Python (3.9+)
- API key for your chosen LLM provider
- Git

### Installation

```bash
git clone https://github.com/Adamlamia/dnd-ai-dungeon-master.git
cd dnd-ai-dungeon-master
npm install  # or pip install -r requirements.txt
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your API keys and configuration
3. Start the application

## Project Structure

```
dnd-ai-dungeon-master/
├── src/
│   ├── core/           # Core DM logic
│   ├── ai/             # AI integration and prompts
│   ├── campaigns/      # Campaign management
│   ├── characters/     # Character handling
│   └── sessions/       # Session management
├── docs/               # Documentation
├── tests/              # Test suite
└── README.md
```

## Roadmap

- [ ] Basic campaign creation
- [ ] NPC generation system
- [ ] Encounter builder
- [ ] Session runner with AI narration
- [ ] Character sheet integration
- [ ] Save/load campaign state
- [ ] Multi-player support
- [ ] Voice/text interface options

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Dungeons & Dragons is a trademark of Wizards of the Coast LLC
- This project is a fan creation and not affiliated with Wizards of the Coast
- Special thanks to the D&D community for inspiration
