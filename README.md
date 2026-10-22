# Next v3

> A comprehensive, production-ready Discord bot built with discord.js and TypeScript
>
> **Features:** Moderation · Security · Leveling · Economy · Clans · Verification · Jail System · Voice Tools · Premium Customization · Utilities & Games

An all-in-one Discord bot designed for professional server management. Features a unified component-based interface, REST API integration, MongoDB persistence, and support for both prefix and slash commands with advanced permission handling.

## Core Features

**🛡️ Moderation & Safety**
Ban, kick, timeout, softban, warnings, slowmode, lock/unlock, channel purge, audit logging, and alt-account detection. All toggleable per server with comprehensive logging.

**🔒 Security Systems**
Anti-bot protection, invite-link filtering, webhook abuse detection, and a dynamic blacklist system. Real-time threat detection with per-guild configuration.

**📊 Leveling & Economy**
Chat and voice XP with visual rank announcements, a currency system with daily/work rewards, and a profile customization shop with background cards.

**🔍 Advanced Checker Tools**
Real-time member analysis: roles, dangerous permissions, mutual servers, voice activity, and presence data. Image-based card rendering (`topma`, `checkvoice`, `fullcheck`, `checkroles`, `activity`).

**👥 Clans System**
Member-run clans with hierarchical roles (leaders, co-leaders), invite management, warning system, and dedicated voice channels.

**✅ Verification & Jail**
Fully configurable verification flows, jail/mute system with detailed logs, and role-based access control.

**⭐ Premium Features**
Per-server bot customization (nickname, avatar, banner, bio), temporary voice channel management, and user-level premium unlocks managed by bot owner.

**🔄 Auto-replies, Self-roles & Applications**
Configurable trigger-based auto-replies, button-driven self-role panels, and a review system for user applications.

**🎮 Games & Entertainment**
Trivia, word games, dice, coin flips, and more. Unified card styling across all game interfaces.

**⚙️ Owner Tools**
Remote user blacklist management, currency/XP grants, profile background administration, and centralized bot control.

**Command Types:**
- **Prefix commands:** `&command` (configurable prefix in `config.json`)
- **Slash commands:** `/command` (auto-registered globally on startup)
- **User-installed apps:** Available for DM-compatible commands

## Quick Start

### Prerequisites
- **Node.js** 18.18+ (v20+ recommended)
- **MongoDB** Atlas or self-hosted instance
- **Discord Developer Portal** bot token with Message Content Intent enabled

### Installation

```bash
# 1. Clone and install
git clone <repository-url>
cd next-ts
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your tokens and MongoDB URI

# 3. Start the bot
npm start

# Production build
npm run build
npm run start:prod

# Verify everything
npm run check  # typecheck, lint, build, tests
```

### Configuration

**Required environment variables:**
- `DISCORD_TOKEN` — Your bot token from the Developer Portal
- `MONGODB_URI` — MongoDB connection string (Atlas or self-hosted)

**Discord setup:**
1. Go to **Developer Portal** → **Bot** tab
2. Enable **Message Content Intent** (required for prefix commands)
3. Copy the token to `.env` as `DISCORD_TOKEN`
4. Invite the bot with scopes: `bot` and `applications.commands`
5. Set `OWNER_ID` in `.env` to your user ID for owner-only commands

All runtime data persists exclusively in MongoDB. Database name defaults to the `slug` from `config.json` or the `MONGODB_DB` environment variable.

### All Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DISCORD_TOKEN` | ✅ | Bot token from Developer Portal |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `OWNER_ID` | — | User ID for owner-only commands |
| `PREFIX` | — | Command prefix (default: `&`) |
| `MONGODB_DB` | — | Database name (defaults to `slug` from config.json) |
| `SELFBOT_TOKEN` | — | Extra account(s) for voice/presence data in unreachable servers. Separate several tokens with commas |
| `SUPPORT_SERVER_URL` | — | Support server link in help menu |
| `WEBHOOK_URL` | — | Webhook for hosting generated images |
| `API_PORT` | — | REST API port (requires `API_KEY` to enable) |
| `API_KEY` | — | REST API authentication key |
| `EMOJIS` | `false` | `true` uploads the bot's custom emojis to the bot itself (application emojis) on startup |

### Discord Intents

| Intent | Purpose |
|--------|---------|
| `Guilds` | Guild, channel, and role caching |
| `GuildMessages` + `MessageContent` | Prefix command parsing and @mention replies |
| `GuildVoiceStates` | Voice commands, temp channels, voice XP tracking |
| `DirectMessages` | DM-compatible commands |

## Architecture

### Command Pipeline

Every command flows through a consistent validation pipeline (`src/core/pipeline.ts`):

```
Input (Message / Interaction)
    ↓
1. Scope Check — DM-only or server-only validation
    ↓
2. Permission Check — owner-only, required permissions
    ↓
3. Voice Check — voice channel requirement (if applicable)
    ↓
4. Cooldown Check — per-user, per-command rate limiting
    ↓
5. Handler — feature logic executes and replies
    ↓
Output ('completed' or 'skipped')
```

### Command Structure

- **Prefix commands:** `src/commands/prefix/<category>/<name>.ts` — Command metadata and routing
- **Slash commands:** `src/commands/slash/<name>.ts` — Slash-specific schema and options
- **Feature handlers:** `src/features/<feature>/<feature>.logic.ts` — Actual business logic
- **Services:** `src/features/<feature>/<feature>.service.ts` — Reusable operations (shared by commands, buttons, APIs)
- **Models:** `src/features/<feature>/<feature>.model.ts` — Database access layer with validation
- **UI:** `src/features/<feature>/<feature>.ui.ts` — Embeds, components, modals (pure rendering, no I/O)

## API Architecture

The bot includes an **optional built-in REST API** (`src/api/`, enabled when `API_KEY` is set). The API and Discord bot **share the same Node.js process**, client instance, and MongoDB connection — no round-trips, no duplicate state:

```
          Discord                                    HTTP
   &topma / &checkvoice / ...                GET /api/v1/checker/...
            │                                           │
            ▼                                           ▼
   checker.logic.ts                          checker.controller.ts
  (src/features/checker)                       (src/api/controllers)
            │                                           │
            └───────────────────┬───────────────────────┘
                                 ▼
                     features/checker/*.ts
          (voiceActivity.ts, mutualGuilds.ts, adminAudit.ts, ...)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
        discord.js caches                     MongoDB
    (guilds, voice states,              (guildSecurity, premium,
     presences — live, same               prefixes, ...)
         BotClient)
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                     same data, two replies:
        a Discord message/component            a JSON response
            (`ctx.send(...)`)                  (`res.json(ok(...))`)
```

In short: the API doesn't call the bot, and the bot doesn't call the API — they're the same
program. A `checker` endpoint only *reads* whatever the bot already has in memory (plus
MongoDB); it never performs a Discord action. An endpoint that changes something (e.g. under
`/moderation`) still just calls the same `BotClient` directly, in-process, exactly like a
command would.

## Project Structure

```
src/
  ├── index.ts                    Entry point: client initialization, startup
  ├── core/                       Shared infrastructure, no feature logic
  │   ├── types.ts               Type definitions (PrefixCommand, SlashCommand, etc.)
  │   ├── client.ts              BotClient with command/event/route loaders
  │   ├── loader.ts              Auto-discovery of commands, events, routes
  │   ├── pipeline.ts            Command execution pipeline
  │   ├── router.ts              Interaction routing for buttons/menus/forms
  │   ├── context.ts             Unified Ctx object for all command types
  │   └── [config, db, state, permissions, etc.]
  ├── commands/
  │   ├── prefix/<category>/<name>.ts    Prefix command definitions
  │   └── slash/<name>.ts                Slash command definitions
  ├── events/                     Discord event handlers (defineEvent)
  ├── features/                   Feature modules
  │   ├── <feature>/
  │   │   ├── <feature>.logic.ts         Command handlers
  │   │   ├── <feature>.service.ts       Reusable business logic
  │   │   ├── <feature>.model.ts         Database operations
  │   │   ├── <feature>.ui.ts            UI rendering (pure functions)
  │   │   └── index.ts                   Route definitions (optional)
  │   └── [moderation, economy, clans, checker, premium, ...]
  ├── api/                        REST API (optional, requires API_KEY)
  │   ├── controllers/            Endpoint handlers
  │   └── routes.ts               API route definitions
  └── test/                       Test suites (npm test)

## Advanced Command Types

**Slash Commands:** Auto-registered globally on startup (Discord may take up to 15 minutes to propagate). Full type-safety with TypeScript schema validation.

**User-Installed Apps:** DM-compatible commands can be registered as user-installable apps. Members add the bot to their personal account via the Developer Portal (Installation → User Install toggle).

**Interaction Routes:** Button clicks, select menus, and modal submissions are routed via `src/core/router.ts` with automatic acknowledgment of unhandled interactions.

---

## Performance & Caching

- **Message Cache:** Small, bounded cache with hourly sweep — no historical message lookups
- **Guild/Role/User Caches:** Automatic discord.js caching with configurable limits
- **In-Process State:** Discord.js client and MongoDB connection are shared between bot and API
- **MongoDB Connection Pooling:** Automatic pooling for efficient multi-request handling
- **Image Generation:** Asynchronous card rendering for checker commands

---

## Development

### Project Quality Standards

- **Type Safety:** No `any`, `@ts-ignore`, or unchecked casts
- **Code Size:** Feature files capped at 400 lines (enforced by tests)
- **Testing:** Run `npm run check` before every commit (typecheck, lint, build, tests)
- **Error Handling:** Validated input at system boundaries; trust framework guarantees internally
- **Names Over Comments:** Code is self-documenting; comments explain the *why*, not the *what*

### Adding New Features

| Task | Location | Registration |
|------|----------|--------------|
| Prefix command | `src/commands/prefix/<category>/<name>.ts` | Automatic via loader |
| Slash command | `src/commands/slash/<name>.ts` | Automatic on startup |
| Event handler | `src/events/<name>.ts` (use `defineEvent`) | Automatic |
| Button/Menu handler | `src/features/<feature>/index.ts` (use `defineRoute`) | Automatic |
| Command logic | `src/features/<feature>/<feature>.logic.ts` | Import in feature file |
| Reusable logic | `src/features/<feature>/<feature>.service.ts` | Import where needed |

All new additions are automatically discovered by `src/core/loader.ts` with validation and duplicate detection.

---

## Deployment

### Local Development
```bash
npm install
cp .env.example .env
# Fill in .env
npm start
```

### Production
```bash
npm run build
npm run start:prod
```

For serverless or containerized deployments, the bot works with:
- Docker (build `dist/` and run as a Node.js app)
- PM2 (run `start:prod` script)
- Systemd (point to the compiled `dist/index.js`)

---

## Support & Contribution

For bugs, feature requests, or questions, please open an issue on the repository.

The codebase is designed to be maintainable and extensible. See the Development section above for guidelines on adding new features or fixing existing ones.

---

## License

This project is proprietary software. All rights reserved.

---

**Built with discord.js 14 and TypeScript. Production-ready for servers of any size.**
