# NextGen vPro (replica)

A discord.js (TypeScript) bot rebuilt from what NextGen vPro answered to its commands (prefix
`&`), recorded through a probing account. **ANALYSIS.md** is the detailed write-up of what
was found.

## Run it

1. Install Node.js 18.18 or newer (20+ recommended).
2. `npm install`
3. Copy `.env.example` to `.env` and put your bot's token in it.
4. `npm start` runs the TypeScript directly with tsx. `npm run build` compiles to `dist/` and
   `npm run start:prod` runs the compiled bot.
5. Before every commit: `npm run check` (typecheck + lint + build + tests). None of it needs a
   token, a database or a network connection.

In the Developer Portal's Bot tab, turn on **Message Content Intent** (privileged; prefix commands
need it), then invite the bot with the `bot` and `applications.commands` scopes.

Storage (economy, levels, warnings, cooldowns, button state): set `MONGODB_URI` in `.env` to use
MongoDB; without it everything is kept in `data/db.json`. The variable is `MONGODB_URI`, not
`MONGO_URI`: the bot prints a warning when only `MONGO_URI` is set. The JSON store batches writes
for 500 ms, writes through a temporary file (a crash can't leave half a file), saves pending
writes on Ctrl+C / SIGTERM, and moves an unreadable `db.json` to `db.json.corrupt-<time>` instead
of overwriting it.

### Environment variables

| Variable | Meaning |
| --- | --- |
| `DISCORD_TOKEN` | Bot token (required). |
| `OWNER_ID` | User allowed to run owner-only commands (overrides `config.json`). |
| `PREFIX` | Prefix for message commands (overrides `config.json`, default `&`). |
| `MONGODB_URI` | Use MongoDB instead of `data/db.json`. |
| `MONGODB_DB` | MongoDB database name (default: the `slug` from `config.json`). |

### Gateway intents

| Intent | Used by |
| --- | --- |
| `Guilds` | Everything (guild, channel and role caches). |
| `GuildMessages` + `MessageContent` | Prefix commands and the @mention reply. |
| `GuildVoiceStates` | Voice-only commands check that the user sits in a voice channel. |
| `DirectMessages` (+ `Partials.Channel`) | Prefix commands in DMs. No prefix command has `dm: true` today, so this intent is unused until one does. |

The client keeps at most 50 messages per channel in cache and sweeps cached messages older than
30 minutes every hour: nothing in the bot reads old messages.

## How a command answers

Every command goes through `src/core/pipeline.ts`, in this order:

1. **Where:** commands that didn't work in the original bot's DM (or make no sense there, like
   rank or ban) are ignored in DMs.
2. **Who:** owner-only commands (`OWNER_ID` in `.env`) and member permissions the original asked
   for. Someone without them gets the original's own refusal message.
3. **Voice:** commands that needed a voice channel answer only users sitting in one.
4. **Cooldown:** per user, as long as the original's ("try again in 23h").
5. **The answer:** your own `execute` if you add one to the command file, else a **real
   implementation** (`logic`: a handler from `src/features/*/<feature>.logic.ts` such as ping,
   avatar, userinfo, ban, kick, purge, economy, levels...), else **AI-written** logic
   (`src/features/ai/scripts/<name>.ts`, review before relying on it), else the **recorded
   answer** of the original bot (text, embeds, buttons, menus, files, reactions).

A handler returns `'completed'` or `'skipped'`; `'skipped'` means "wrong usage, nothing happened"
and starts no cooldown. A custom `execute` may return `'skipped'` for the same effect.

Commands with several recorded answers (coinflip, 8ball, jokes...) pick one at random. Buttons
and menus keep working after a restart.

Each prefix command is one file: `src/commands/prefix/<category>/<name>.ts`; slash commands:
`src/commands/slash/<name>.ts` (a `__` in the file name stands for the space in `/group sub`).
Their recordings are in `data/recordings/` (`recordingFile` in the command file). Change `logic`
in a command file to switch between the real implementation (`"ban"`, `"purge"`...) and the
recording (`null`), or add an `execute` to write your own. A misspelled `logic` name is a compile
error and the bot refuses to start with it.

### What `kind` means in a command file

| `kind` | Meaning |
| --- | --- |
| `ok` | The original answered; the recorded answer is replayed. |
| `usage` | The original answered with a usage/help text when run without arguments. |
| `permission` | The probing account wasn't allowed to run it, so only a refusal was recorded. Whoever passes the permission check gets the "not recorded" message instead of that refusal. |
| `silent` | The original never answered: an empty stub until you add code. |
| `skipped` | Slash command that was never run while recording: an empty stub. |

## Details of the recording

- Every command was run bare (no arguments). When its usage showed required arguments and the
  command is safe to run with them, it was also run once with sample values (numbers = 1, a user =
  the account owner who ran this probe, never a stranger); the replica answers with that sample
  whenever a user passes arguments. Commands that act on people or the server (ban, kick, pay,
  set...) were never run with arguments.
- Buttons and menus were explored click by click, including buy/sell/delete/confirm-style ones. A
  game therefore replays the screens seen while playing. A button that popped up a form (modal) has
  its shape recorded and the replica shows the same form.
- The probing account's own name, mention and avatar were replaced by placeholders
  (`{{mention}}`, `{{username}}`, `{{displayName}}`, `{{userId}}`, `{{avatar}}`, `{{guild}}`) so
  each user sees their own; `custom_id` values are never changed. No recorded message had an
  attachment, so there is no `assets/` folder.
- Buttons and menus only work where a click was recorded; every other button is shown disabled.
- Some recorded images no longer exist (HTTP 404 when checked on 2026-10-16): the GIFs in
  `smile`, `love`, `kiss` (2), `slape`, `missyou` and `kill`, and the avatar in `ping`'s recording
  (unused: `ping` has a real implementation). Discord shows a broken image for them. Replace the URL
  in the recording with an image you host yourself (or a file you add as an attachment) rather than
  another link that can expire.
- The bot was also @mentioned with nothing else, to see if it replies to being tagged alone
  (`data/recordings/mention.json`).
- Commands that never answered (owner-only, permission-gated) or weren't reached before the time
  limit are empty stubs: they stay silent until you add logic (or have a real implementation).
- Silent when run (empty stubs): `&clear`, `&24`, `&addcategorie`, `&addqeustion`, `&cancelapply`, `&cmdtimeout`, `&jail-setup`, `&removebutton`, `&removecategorie`, `&removequestion`, `&resetapplies`, `&selfolressections`, `&selfrolebuttons`, `&selfroleslogs`, `&sendapplypanel`, `&sendsection`, `&setapply`, `&setapplylogs`, `&setapplymanagers`, `&tempchannel`, `&updatesection`, `&verif-setup`, `&warn-setup`, `&1490716829373567116`, `&1490717627784364065`, `&1505004562556260524`, `&1505736582316167188`, `&1497237138998169680`, `&1490716829373567112`, `&1504189206761832689`, `&1490716829373567115`, `&1490716829373567114`, `&1507111675638190260`, `&1506017602760081528`, `&1505287656345702651`, `&1505685566631575552`, `&1491143875392176268`, `&1506021172654116986`, `&1490716829344075780`, `&1490716829373567110`, `&1490716829361111151`, `&1491548475005862040`, `&1513525119413391461`
- ⚠️ 9 buy/sell/delete/confirm/pay/reset-style button press(es) really happened in the original bot while recording: `anagram`, `fasttype`, `guessnumber`, `quickmath`, `riddle`, `sequence`, `sumup`, `trivia`, `wordscramble`. Whatever that did there (spent currency, deleted something, confirmed an action...) is real and wasn't undone.
- 5 of the original bot's 5 custom emoji were re-created on the bot whose token you gave the panel. **Run this replica with that same bot's token** so they show.

## Project layout

```
src/
  index.ts                 entry point: builds the client, loads everything, logs in
  core/                    shared plumbing, no feature logic
    types.ts               PrefixCommand, SlashCommand, BotEvent, InteractionRoute, CommandOutcome
    client.ts              BotClient (commands, aliases, slashCommands, routes), intents, cache limits
    loader.ts              the one loader: commands, events, feature routes (validated, duplicates throw)
    command-schema.ts      runtime validation of command files
    router.ts              sends every interaction to exactly one route; acks unrouted clicks/forms
    pipeline.ts            DM / owner / permission / voice / cooldown checks, then the answer
    context.ts             Ctx: one object for message, slash and button invocations
    slash.ts               slash/context-menu registration payload (typed Discord API JSON)
    config.ts json.ts permissions.ts format.ts replies.ts db.ts state.ts modules.ts
  commands/prefix/other/   one file per prefix command (data only)
  commands/slash/          one file per slash command (data only)
  events/                  one file per Discord event (defineEvent)
  features/
    logic.ts               the list of built-in logic groups (LogicName comes from here)
    <feature>/             info, fun, moderation, economy, levels, voice, recordings, ai
      <feature>.logic.ts     command handlers (parse input, call the service, send the UI)
      <feature>.service.ts   the actual work: checks and Discord actions
      <feature>.model.ts     database reads/writes with typed, validated documents
      <feature>.ui.ts        embeds/components/modals, no Discord calls and no database
      index.ts               optional: `export const routes = [defineRoute(...)]`
test/                      node:test suites, run with `npm test`
data/recordings/           what the original bot answered (data, never edited by code)
```

### Where a new thing goes

| Adding | Put it in | Registration |
| --- | --- | --- |
| Prefix command | `src/commands/prefix/<category>/<name>.ts` (a `Command` object) | automatic |
| Slash command | `src/commands/slash/<name>.ts` (`path: "group sub"`) | automatic; registered on startup |
| Event handler | `src/events/<name>.ts` with `export default defineEvent({ name: Events.X, ... })` | automatic |
| Button, menu or form handler | `src/features/<feature>/index.ts`: `export const routes = [defineRoute({ name, match, handle })]` | automatic |
| Real implementation of a command | a handler in `src/features/<feature>/<feature>.logic.ts`, then `logic: "<name>"` in the command file | a new feature group needs one line in `src/features/logic.ts` |
| Shared logic (e.g. a moderation action) | `src/features/<feature>/<feature>.service.ts` | import it |
| Shared types | `src/core/types.ts` | import them |

### Rules that keep features from breaking each other

- One implementation per action: prefix commands, slash commands and buttons call the same service
  function (ban, kick and timeout all go through `moderation.service.ts`, which also checks that
  the moderator's highest role is above the target's).
- Shared types only: commands are `Command`, events `defineEvent`, routes `defineRoute`. Data from
  JSON, the database or Discord is `unknown` until validated.
- Every customId belongs to exactly one route; give a feature's ids a unique prefix
  (`<feature>:...`). Never rename a customId that is already posted in a server. A test fails if
  two routes match the same id.
- Explicit named exports, no `export *` and no spreading handler objects together: a clash must be
  a compile error or a startup error, never a silent overwrite.
- Tables and builder functions instead of pasted JSON in code; recorded JSON stays in `data/`.
- Heavy libraries are loaded with `await import()` on first use (MongoDB already is), with
  `import type` for their types.
- No `any`, no `@ts-ignore`/`@ts-expect-error`, no non-null `!`.
- No comments in code: names, constants and types carry the meaning, explanations go here. A test
  fails on any comment except a shebang, `/// <reference>` or an unavoidable `eslint-disable`.
- Feature files stay under 400 lines (a test checks `src/features/` and `src/handlers/`).
- Run `npm run check` before every commit.

## Commands

| Command | How it answers | Notes | Description |
| --- | --- | --- | --- |
| `&help` | recorded |  |  |
| `&avatar` | real (`avatar`) |  |  |
| `&avatarserver` | recorded |  |  |
| `&banner` | recorded |  |  |
| `&botinfo` | recorded |  |  |
| `&channel-info` | recorded |  |  |
| `&check-vanity` | recorded |  |  |
| `&emojiinfo` | recorded |  |  |
| `&firstmsg` | recorded |  |  |
| `&getinvite` | recorded |  |  |
| `&invimage` | recorded |  |  |
| `&inviteinfo` | recorded |  |  |
| `&membercount` | real (`membercount`) |  |  |
| `&ping` | real (`ping`) |  |  |
| `&roleinfo` | recorded |  |  |
| `&roles` | recorded |  |  |
| `&serverinfo` | real (`serverinfo`) |  |  |
| `&tag` | recorded |  |  |
| `&userinfo` | real (`userinfo`) |  |  |
| `&checkroles` (`&cr`) | real (`checkroles`) |  | Check a member's roles and flag dangerous permissions. |
| `&fullcheck` (`&fc`) | real (`fullcheck`) |  | Full profile check: account age, join date, roles and dangerous permissions. |
| `&checkvoice` (`&cv`) | real (`checkvoice`) |  | Check which voice channel a member is in and who else is there. |
| `&topmembers` (`&topma`) | real (`topmembers`) |  | Leaderboard of the top members in this server by level/XP. |
| `&vc` | recorded |  |  |
| `&sus` | recorded |  |  |
| `&topverif` | recorded |  |  |
| `&vb` | recorded |  |  |
| `&veriflogs` | recorded |  |  |
| `&verifpanel` | recorded |  |  |
| `&verify` | recorded |  |  |
| `&vg` | recorded |  |  |
| `&clearwarns` | recorded |  |  |
| `&unwarn` | recorded |  |  |
| `&warn` | real (`warn`) | moderate_members |  |
| `&warnings` | real (`warnings`) | moderate_members |  |
| `&warnlogs` | recorded |  |  |
| `&add` | recorded |  |  |
| `&addemoji` | recorded |  |  |
| `&addgame` | recorded |  |  |
| `&alias` | recorded |  |  |
| `&blacklistedchannel` | recorded |  |  |
| `&boosters` | recorded |  |  |
| `&clear` | real (`purge`) | manage_messages |  |
| `&cleardata` | recorded | manage_guild |  |
| `&config` | recorded |  |  |
| `&deny` | recorded |  |  |
| `&disabledcmd` | recorded |  |  |
| `&embed` | recorded |  |  |
| `&hide` | recorded |  |  |
| `&hsetup` | recorded |  |  |
| `&list` | recorded |  |  |
| `&listgames` | recorded |  |  |
| `&lock` | real (`lock`) | manage_channels |  |
| `&perminall` | recorded |  |  |
| `&poll` | recorded |  |  |
| `&pushdatabase` | recorded |  |  |
| `&removegame` | recorded |  |  |
| `&setmoverole` | recorded |  |  |
| `&setmuted` | recorded |  |  |
| `&setmutelogs` | recorded |  |  |
| `&setmuterole` | recorded |  |  |
| `&setroleslogs` | recorded |  |  |
| `&show` | recorded |  |  |
| `&setup` | recorded |  |  |
| `&timelock` | recorded |  |  |
| `&unlock` | real (`unlock`) | manage_channels |  |
| `&unperminall` | recorded |  |  |
| `&voicecount` | recorded |  |  |
| `&24` | empty stub |  |  |
| `&addbot` | recorded | manage_guild |  |
| `&announecement` | recorded | manage_guild |  |
| `&killbot` | recorded | manage_guild |  |
| `&listbots` | recorded | manage_guild |  |
| `&removebot` | recorded | manage_guild |  |
| `&usebot` | recorded | manage_guild |  |
| `&8ball` | real (`8ball`) |  |  |
| `&afk` | recorded |  |  |
| `&anagram` | recorded |  |  |
| `&cat` | recorded |  |  |
| `&coinflip` | real (`coinflip`) |  |  |
| `&cringe` | recorded |  |  |
| `&cry` | recorded |  |  |
| `&cuddle` | recorded |  |  |
| `&cups` | recorded |  |  |
| `&dance` | recorded |  |  |
| `&dicebattle` | recorded |  |  |
| `&emojiquiz` | recorded |  |  |
| `&fasttype` | recorded |  |  |
| `&gendre` | recorded |  |  |
| `&guessnumber` | recorded |  |  |
| `&hack` | recorded |  |  |
| `&happy` | recorded |  |  |
| `&higherlower` | recorded |  |  |
| `&howgay` | recorded |  |  |
| `&hug` | recorded |  |  |
| `&kill` | recorded |  |  |
| `&kiss` | recorded |  |  |
| `&love` | recorded |  |  |
| `&luckybutton` | recorded |  |  |
| `&minesafe` | recorded |  |  |
| `&missyou` | recorded |  |  |
| `&oddoneout` | recorded |  |  |
| `&quickmath` | recorded |  |  |
| `&riddle` | recorded |  |  |
| `&roll` | real (`roll`) |  |  |
| `&rps` | recorded |  |  |
| `&rpsls` | recorded |  |  |
| `&safebox` | recorded |  |  |
| `&sequence` | recorded |  |  |
| `&slape` | recorded |  |  |
| `&slotrush` | recorded |  |  |
| `&smile` | recorded |  |  |
| `&sumup` | recorded |  |  |
| `&targettap` | recorded |  |  |
| `&tictactoe` | recorded |  |  |
| `&trapdoor` | recorded |  |  |
| `&treasuremap` | recorded |  |  |
| `&trivia` | recorded |  |  |
| `&wordscramble` | recorded |  |  |
| `&jail` | recorded |  |  |
| `&jailinfo` | recorded |  |  |
| `&jaillogs` | recorded |  |  |
| `&unjail` | recorded |  |  |
| `&activity` | recorded |  |  |
| `&audituser` | recorded |  |  |
| `&ban` | real (`ban`) | ban_members |  |
| `&banlogs` | recorded |  |  |
| `&cam` | recorded |  |  |
| `&find` | recorded |  |  |
| `&fmove` | recorded |  |  |
| `&kick` | real (`kick`) | kick_members |  |
| `&kicklogs` | recorded |  |  |
| `&move` | recorded |  |  |
| `&moveall` | recorded |  |  |
| `&mute` | real (`timeout`) | moderate_members |  |
| `&nick` | recorded |  |  |
| `&role` | recorded |  |  |
| `&sb` | recorded |  |  |
| `&slowmode` | real (`slowmode`) | manage_channels |  |
| `&softban` | recorded |  |  |
| `&timeout` | real (`timeout`) | moderate_members |  |
| `&timeoutlogs` | recorded |  |  |
| `&unban` | real (`unban`) | ban_members |  |
| `&unmute` | real (`untimeout`) | moderate_members |  |
| `&vclist` | recorded |  |  |
| `&vdeafen` | recorded |  |  |
| `&vkick` | recorded |  |  |
| `&vmute` | recorded |  |  |
| `&voiceclean` | recorded |  |  |
| `&voicelogs` | recorded |  |  |
| `&vundeafen` | recorded |  |  |
| `&vunmute` | recorded |  |  |
| `&autoplay` | recorded | voice |  |
| `&backward` | recorded | voice |  |
| `&clearqueue` | recorded | voice |  |
| `&filter` | recorded | voice |  |
| `&forward` | recorded | voice |  |
| `&loop` | recorded | voice |  |
| `&lyrics` | recorded |  |  |
| `&movi` | recorded | voice |  |
| `&nowplaying` | recorded |  |  |
| `&npsource` | recorded |  |  |
| `&pause` | recorded | voice |  |
| `&play` | recorded | voice |  |
| `&preferences` | recorded |  |  |
| `&queue` | recorded |  |  |
| `&remove` | recorded | voice |  |
| `&resetprefs` | recorded |  |  |
| `&resume` | recorded | voice |  |
| `&seek` | recorded | voice |  |
| `&shuffle` | recorded | voice |  |
| `&skip` | recorded | voice |  |
| `&stop` | recorded | voice |  |
| `&volume` | recorded | voice |  |
| `&autoreply-remove` | recorded |  |  |
| `&autoreply` | recorded |  |  |
| `&autoreplyrole` | recorded |  |  |
| `&reply-list` | recorded |  |  |
| `&reply-reset` | recorded |  |  |
| `&antibots` | recorded |  |  |
| `&antilink` | recorded |  |  |
| `&autorole` | recorded |  |  |
| `&jointracker` | recorded |  |  |
| `&remind` | recorded |  |  |
| `&addcategorie` | empty stub |  |  |
| `&addqeustion` | empty stub |  |  |
| `&cancelapply` | empty stub |  |  |
| `&cmdtimeout` | empty stub |  |  |
| `&jail-setup` | empty stub |  |  |
| `&removebutton` | empty stub |  |  |
| `&removecategorie` | empty stub |  |  |
| `&removequestion` | empty stub |  |  |
| `&resetapplies` | empty stub |  |  |
| `&selfolressections` | empty stub |  |  |
| `&selfrolebuttons` | empty stub |  |  |
| `&selfroleslogs` | empty stub |  |  |
| `&sendapplypanel` | empty stub |  |  |
| `&sendsection` | empty stub |  |  |
| `&setapply` | empty stub |  |  |
| `&setapplylogs` | empty stub |  |  |
| `&setapplymanagers` | empty stub |  |  |
| `&tempchannel` | empty stub |  |  |
| `&updatesection` | empty stub |  |  |
| `&verif-setup` | empty stub |  |  |
| `&warn-setup` | empty stub |  |  |
| `&1490716829373567116` | empty stub |  |  |
| `&1490717627784364065` | empty stub |  |  |
| `&1505004562556260524` | empty stub |  |  |
| `&1505736582316167188` | empty stub |  |  |
| `&1497237138998169680` | empty stub |  |  |
| `&1490716829373567112` | empty stub |  |  |
| `&1504189206761832689` | empty stub |  |  |
| `&1490716829373567115` | empty stub |  |  |
| `&1490716829373567114` | empty stub |  |  |
| `&1507111675638190260` | empty stub |  |  |
| `&1506017602760081528` | empty stub |  |  |
| `&1505287656345702651` | empty stub |  |  |
| `&1505685566631575552` | empty stub |  |  |
| `&1491143875392176268` | empty stub |  |  |
| `&1506021172654116986` | empty stub |  |  |
| `&1490716829344075780` | empty stub |  |  |
| `&1490716829373567110` | empty stub |  |  |
| `&1490716829361111151` | empty stub |  |  |
| `&1491548475005862040` | empty stub |  |  |
| `&1513525119413391461` | empty stub |  |  |

## Slash, context-menu and external-app commands

Registered globally when the bot starts (Discord can take a few minutes to show them). Commands
that worked in the original bot's DM are also registered as a **user-installed app**: turn on
*User Install* in the Developer Portal (Installation tab) and anyone can add the bot to their own
account and use those commands in any DM. The others stay server-only.

| Command | How it answers | Where | Description |
| --- | --- | --- | --- |
| `/addcategorie` | empty stub | servers | Add a new apply category to this server. |
| `/addqeustion` | empty stub | servers | Add one or more questions to an apply category. |
| `/cancelapply` | recorded | servers + DMs (external app) | Cancel your currently pending application. |
| `/cmdtimeout set` | empty stub | servers | Create or update a command usage limit. |
| `/cmdtimeout remove` | empty stub | servers | Remove a command usage limit. |
| `/cmdtimeout list` | recorded | servers + DMs (external app) | List every configured command usage limit. |
| `/cmdtimeout check` | recorded | servers + DMs (external app) | Check current usage for a user on a specific command. |
| `/cmdtimeout reset` | empty stub | servers | Reset usage counters for a command or an entire scope. |
| `/jail-setup` | empty stub | servers | Sets up the jail system for this server. |
| `/removecategorie` | empty stub | servers | Remove an apply category from this server. |
| `/removequestion` | empty stub | servers | Remove a question from an apply category. |
| `/sendapplypanel` | recorded | servers + DMs (external app) | Send the apply panel with category buttons into this channel. |
| `/setapply` | recorded | servers + DMs (external app) | Save the apply panel JSON template for this server. |
| `/setapplylogs` | empty stub | servers | Set the channel used for application review logs. |
| `/setapplymanagers` | empty stub | servers | Set one or more roles that can review applications. |
| `/tempchannel create` | empty stub | servers | Create a temporary voice channel trigger. |
| `/tempchannel edit` | empty stub | servers | Edit an existing temporary voice channel trigger. |
| `/tempchannel delete` | empty stub | servers | Delete a temporary voice channel trigger. |
| `/tempchannel list` | recorded | servers + DMs (external app) | List configured temporary voice channel triggers and active rooms. |
| `/tempchannel cleanup` | recorded | servers + DMs (external app) | Delete stale empty temporary rooms and orphaned records. |
| `/verif-setup` | empty stub | servers | Sets up the verification system for this server. |
| `/warn-setup` | empty stub | servers | Sets up the warn system for this server. |
| `/removebutton` | empty stub | servers | Remove a self-role button mapping. |
| `/selfolressections list` | recorded | servers + DMs (external app) | List all self-role sections. |
| `/selfolressections new` | recorded | servers + DMs (external app) | Create a new self-role section. |
| `/selfolressections remove` | empty stub | servers | Remove an existing self-role section. |
| `/selfrolebuttons` | empty stub | servers | Add a button mapping to a self-role section. |
| `/selfroleslogs` | recorded | servers | Set the log channel for self-role actions. |
| `/sendsection` | recorded | servers | Send a configured self-role section to a channel. |
| `/updatesection` | recorded | servers + DMs (external app) | Update an existing self-role section. |
| `/resetapplies` | recorded | servers + DMs (external app) | Cancel every pending application in this server. |
