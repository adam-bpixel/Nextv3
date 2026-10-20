# Bot Feature Analysis

- Bot ID `1406664019741249586`, prefix `&`, help command `&help`
- Probed in 4088.9s
- Commands found (help's list, mentions in answers, and any you added): 220; answered: 177; silent: 43; not reached before the time limit: 0
- Every one of them has its own file in the replica (silent / unreached ones are empty stubs)
- Help menu pages recorded: 2 (15 clicks)
- Per-command explanations (`&help <command>`): none — not supported by this bot, or turned off before this run
- Commands with explored buttons/menus: 28; run with sample arguments: 34
- Bare run gave a usage notice: 59; a permission notice: 7

## Other

| Command | Aliases | Usage | What it does | Answers with | Notes |
| --- | --- | --- | --- | --- | --- |
| `&help` |  |  |  | buttons/menus | 2 button/menu states explored |
| `&avatar` |  |  |  | buttons/menus |  |
| `&avatarserver` |  |  |  | buttons/menus |  |
| `&banner` |  |  |  | buttons/menus |  |
| `&botinfo` |  |  |  | buttons/menus |  |
| `&channel-info` |  |  |  | buttons/menus |  |
| `&check-vanity` |  |  |  | text |  |
| `&emojiinfo` |  |  |  | text |  |
| `&firstmsg` |  |  |  | buttons/menus |  |
| `&getinvite` |  |  |  | text |  |
| `&invimage` |  |  |  | buttons/menus |  |
| `&inviteinfo` |  | `&inviteinfo <invite>` |  | text | bare run gave a usage notice; sample run `&inviteinfo test` |
| `&membercount` |  |  |  | buttons/menus |  |
| `&ping` |  |  |  | buttons/menus |  |
| `&roleinfo` |  | `&roleinfo <role>` |  | text | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&roles` |  |  |  | buttons/menus | 8 button/menu states explored |
| `&serverinfo` |  |  |  | buttons/menus |  |
| `&tag` |  |  |  | text |  |
| `&userinfo` |  |  |  | buttons/menus |  |
| `&vc` |  |  |  | buttons/menus |  |
| `&sus` |  |  |  | buttons/menus |  |
| `&topverif` |  |  |  | buttons/menus |  |
| `&vb` |  |  |  | buttons/menus |  |
| `&veriflogs` |  |  |  | buttons/menus |  |
| `&verifpanel` |  |  |  | buttons/menus | 1 button/menu states explored |
| `&verify` |  |  |  | buttons/menus |  |
| `&vg` |  |  |  | buttons/menus |  |
| `&clearwarns` |  | `&clearwarns <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&unwarn` |  | `&unwarn <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&warn` |  | `&warn <user mention or ID> [reason]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&warnings` |  | `&warnings <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&warnings {{mention}}` |
| `&warnlogs` |  | `&warnlogs <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&warnlogs {{mention}}` |
| `&add` |  | `&add <user or role mention/ID>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&addemoji` |  | `&addemoji <emoji or image URL> [name]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&addgame` |  | `&addgame <role mention or ID> <alias>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&alias` |  | `&alias <add\|remove\|list> [command] [alias]` |  | buttons/menus | bare run gave a usage notice; sample run `&alias test` |
| `&blacklistedchannel` |  | `&blacklistedchannel <add\|remove\|list> [channel mention or ID]` |  | buttons/menus | bare run gave a usage notice; sample run `&blacklistedchannel test` |
| `&boosters` |  |  |  | buttons/menus |  |
| `&clear` |  |  |  | - | did not answer when run |
| `&cleardata` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&config` |  |  |  | buttons/menus |  |
| `&deny` |  | `&deny <user or role mention/ID>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&disabledcmd` |  | `&disabledcmd <disable\|enable\|list> [command name]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&embed` |  | `&embed , please provide JSON data from a tool like discohook.org.` |  | buttons/menus | bare run gave a usage notice |
| `&hide` |  |  |  | buttons/menus |  |
| `&hsetup` |  | `&hsetup limits for this server.` |  | buttons/menus | bare run gave a usage notice |
| `&list` |  |  |  | buttons/menus |  |
| `&listgames` |  |  |  | buttons/menus |  |
| `&lock` |  |  |  | buttons/menus |  |
| `&perminall` |  | `&perminall <role ID>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&poll` |  | `&poll <on\|off> OR &poll <poll question>` |  | buttons/menus | bare run gave a usage notice; sample run `&poll test test` |
| `&pushdatabase` |  |  |  | text |  |
| `&removegame` |  | `&removegame Usage: &clear [amount (0-99)] or &clear <user mention or ID> [amount (0-99)]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&setmoverole` |  | `&setmoverole <role>` |  | buttons/menus | needs arguments - not run with them (unsafe or not fakeable) |
| `&setmuted` |  | `&setmuted <role>` |  | buttons/menus | needs arguments - not run with them (unsafe or not fakeable) |
| `&setmutelogs` |  | `&setmutelogs <channel>` |  | buttons/menus | needs arguments - not run with them (unsafe or not fakeable) |
| `&setmuterole` |  | `&setmuterole <role>` |  | buttons/menus | needs arguments - not run with them (unsafe or not fakeable) |
| `&setroleslogs` |  | `&setroleslogs <channel>` |  | buttons/menus | needs arguments - not run with them (unsafe or not fakeable) |
| `&show` |  |  |  | buttons/menus |  |
| `&setup` |  |  |  | text |  |
| `&timelock` |  | `&timelock <duration> (e.g., 1h, 30m, 7d)` |  | buttons/menus | bare run gave a usage notice; sample run `&timelock 1m` |
| `&unlock` |  |  |  | buttons/menus |  |
| `&unperminall` |  | `&unperminall <role ID>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&voicecount` |  | `&voicecount <on\|off\|channel> [channel mention or ID]` |  | buttons/menus | bare run gave a usage notice; sample run `&voicecount <#1510578707008585738>` |
| `&24` |  |  |  | - | did not answer when run |
| `&addbot` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&announecement` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&killbot` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&listbots` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&removebot` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&usebot` |  |  |  | buttons/menus | bare run gave a permission notice |
| `&8ball` |  | `&8ball <your question>` |  | buttons/menus | bare run gave a usage notice; sample run `&8ball test` |
| `&afk` |  |  |  | buttons/menus |  |
| `&anagram` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&cat` |  |  |  | buttons/menus |  |
| `&coinflip` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&cringe` |  |  |  | buttons/menus |  |
| `&cry` |  |  |  | buttons/menus |  |
| `&cuddle` |  |  |  | buttons/menus |  |
| `&cups` |  |  |  | buttons/menus | 4 button/menu states explored |
| `&dance` |  |  |  | buttons/menus |  |
| `&dicebattle` |  |  |  | buttons/menus | 2 button/menu states explored |
| `&emojiquiz` |  |  |  | buttons/menus | 10 button/menu states explored |
| `&fasttype` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&gendre` |  | `&gendre set <gender>` |  | buttons/menus | sample run `&gendre test` |
| `&guessnumber` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&hack` |  | `&hack <user mention>` |  | buttons/menus | bare run gave a usage notice; sample run `&hack {{mention}}` |
| `&happy` |  |  |  | buttons/menus |  |
| `&higherlower` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&howgay` |  |  |  | buttons/menus |  |
| `&hug` |  |  |  | buttons/menus |  |
| `&kill` |  |  |  | buttons/menus |  |
| `&kiss` |  |  |  | buttons/menus |  |
| `&love` |  |  |  | buttons/menus |  |
| `&luckybutton` |  |  |  | buttons/menus | 5 button/menu states explored |
| `&minesafe` |  |  |  | buttons/menus | 6 button/menu states explored |
| `&missyou` |  |  |  | buttons/menus |  |
| `&oddoneout` |  |  |  | buttons/menus | 7 button/menu states explored |
| `&quickmath` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&riddle` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&roll` |  |  |  | buttons/menus |  |
| `&rps` |  |  |  | buttons/menus | 4 button/menu states explored |
| `&rpsls` |  |  |  | buttons/menus | 6 button/menu states explored |
| `&safebox` |  |  |  | buttons/menus | 5 button/menu states explored |
| `&sequence` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&slape` |  |  |  | buttons/menus |  |
| `&slotrush` |  |  |  | buttons/menus | 2 button/menu states explored |
| `&smile` |  |  |  | buttons/menus |  |
| `&sumup` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&targettap` |  |  |  | buttons/menus | 5 button/menu states explored |
| `&tictactoe` |  |  |  | buttons/menus | 10 button/menu states explored |
| `&trapdoor` |  |  |  | buttons/menus | 4 button/menu states explored |
| `&treasuremap` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&trivia` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&wordscramble` |  |  |  | buttons/menus | 3 button/menu states explored |
| `&jail` |  |  |  | buttons/menus |  |
| `&jailinfo` |  |  |  | buttons/menus |  |
| `&jaillogs` |  |  |  | buttons/menus |  |
| `&unjail` |  |  |  | buttons/menus |  |
| `&activity` |  | `&activity <enable\|disable> [channel]` |  | buttons/menus | bare run gave a usage notice; sample run `&activity test` |
| `&audituser` |  | `&audituser <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&audituser {{mention}}` |
| `&ban` |  | `&ban <user mention or ID> [reason]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&banlogs` |  | `&banlogs <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&banlogs {{mention}}` |
| `&cam` |  | `&cam <enable\|disable> [channel]` |  | buttons/menus | bare run gave a usage notice; sample run `&cam test` |
| `&find` |  | `&find <member>` |  | buttons/menus | bare run gave a usage notice; sample run `&find {{mention}}` |
| `&fmove` |  | `&fmove <member> <voice channel>` |  | buttons/menus | bare run gave a usage notice; sample run `&fmove {{mention}} <#1510578707008585738>` |
| `&kick` |  | `&kick <user mention or ID> [reason]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&kicklogs` |  | `&kicklogs <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&kicklogs {{mention}}` |
| `&move` |  | `&move <member> [voice channel]` |  | buttons/menus | bare run gave a usage notice; sample run `&move {{mention}}` |
| `&moveall` |  | `&moveall <from voice channel> <to voice channel>` |  | buttons/menus | bare run gave a usage notice; sample run `&moveall <#1510578707008585738> <#1510578707008585738>` |
| `&mute` |  | `&mute <user mention or ID> <duration> <reason> (e.g., 1h spam, 30m being loud)` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&nick` |  | `&nick <user mention or ID> <new nickname\|reset>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&role` |  | `&role <user mention or ID> <role ID or role name>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&sb` |  | `&sb <enable\|disable> [channel]` |  | buttons/menus | bare run gave a usage notice; sample run `&sb test` |
| `&slowmode` |  | `&slowmode <seconds\|off> [channel mention or ID]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&softban` |  | `&softban <user mention or ID> [delete days 0-7] [reason]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&timeout` |  | `&timeout <user mention or ID> <duration> [reason] (e.g., 1h, 30m, 7d)` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&timeoutlogs` |  | `&timeoutlogs <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&timeoutlogs {{mention}}` |
| `&unban` |  | `&unban <user ID> [reason]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&unmute` |  | `&unmute <user mention or ID> [reason]` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&vclist` |  |  |  | buttons/menus |  |
| `&vdeafen` |  | `&vdeafen <member>` |  | buttons/menus | bare run gave a usage notice; sample run `&vdeafen {{mention}}` |
| `&vkick` |  | `&vkick <user mention or ID> [reason]` |  | buttons/menus | bare run gave a usage notice; sample run `&vkick {{mention}}` |
| `&vmute` |  | `&vmute <user mention or ID> <duration> <reason> (e.g., 1h being loud, 30m mic spam)` |  | buttons/menus | bare run gave a usage notice; sample run `&vmute {{mention}} 1m test` |
| `&voiceclean` |  | `&voiceclean [voice channel mention or ID]` |  | buttons/menus | bare run gave a usage notice |
| `&voicelogs` |  | `&voicelogs <user mention or ID>` |  | buttons/menus | bare run gave a usage notice; sample run `&voicelogs {{mention}}` |
| `&vundeafen` |  | `&vundeafen <member>` |  | buttons/menus | bare run gave a usage notice; sample run `&vundeafen {{mention}}` |
| `&vunmute` |  | `&vunmute <member>` |  | buttons/menus | bare run gave a usage notice; sample run `&vunmute {{mention}}` |
| `&autoplay` |  |  |  | buttons/menus |  |
| `&backward` |  |  |  | buttons/menus |  |
| `&clearqueue` |  |  |  | buttons/menus |  |
| `&filter` |  |  |  | buttons/menus |  |
| `&forward` |  |  |  | buttons/menus |  |
| `&loop` |  |  |  | buttons/menus |  |
| `&lyrics` |  |  |  | buttons/menus |  |
| `&movi` |  |  |  | buttons/menus |  |
| `&nowplaying` |  |  |  | buttons/menus |  |
| `&npsource` |  |  |  | buttons/menus |  |
| `&pause` |  |  |  | buttons/menus |  |
| `&play` |  |  |  | buttons/menus |  |
| `&preferences` |  |  |  | buttons/menus |  |
| `&queue` |  |  |  | buttons/menus |  |
| `&remove` |  |  |  | buttons/menus |  |
| `&resetprefs` |  |  |  | buttons/menus |  |
| `&resume` |  |  |  | buttons/menus |  |
| `&seek` |  |  |  | buttons/menus |  |
| `&shuffle` |  |  |  | buttons/menus |  |
| `&skip` |  |  |  | buttons/menus |  |
| `&stop` |  |  |  | buttons/menus |  |
| `&volume` |  |  |  | buttons/menus |  |
| `&autoreply-remove` |  | `&autoreply-remove <trigger>` |  | buttons/menus | bare run gave a usage notice; sample run `&autoreply-remove test` |
| `&autoreply` |  | `&autoreply <trigger> <response>` |  | buttons/menus | bare run gave a usage notice; sample run `&autoreply test test` |
| `&autoreplyrole` |  | `&autoreplyrole <role mention/ID> <allow/disallow>` |  | buttons/menus | bare run gave a usage notice; needs arguments - not run with them (unsafe or not fakeable) |
| `&reply-list` |  |  |  | buttons/menus |  |
| `&reply-reset` |  |  |  | buttons/menus |  |
| `&antibots` |  | `&antibots <on\|off>` |  | buttons/menus | bare run gave a usage notice; sample run `&antibots test` |
| `&antilink` |  | `&antilink <on\|off>` |  | buttons/menus | bare run gave a usage notice; sample run `&antilink test` |
| `&autorole` |  | `&autorole <roleMentionOrID>` |  | buttons/menus | needs arguments - not run with them (unsafe or not fakeable) |
| `&jointracker` |  | `&jointracker <on\|off\|channel> [channel]` |  | buttons/menus | bare run gave a usage notice; sample run `&jointracker <#1510578707008585738>` |
| `&remind` |  | `&remind <duration> <reminder text> (e.g., 1h call mom, 30m take a break)` |  | buttons/menus | bare run gave a usage notice; sample run `&remind 1m test` |
| `&addcategorie` |  |  |  | - | did not answer when run |
| `&addqeustion` |  |  |  | - | did not answer when run |
| `&cancelapply` |  |  |  | - | did not answer when run |
| `&cmdtimeout` |  |  |  | - | did not answer when run |
| `&jail-setup` |  |  |  | - | did not answer when run |
| `&removebutton` |  |  |  | - | did not answer when run |
| `&removecategorie` |  |  |  | - | did not answer when run |
| `&removequestion` |  |  |  | - | did not answer when run |
| `&resetapplies` |  |  |  | - | did not answer when run |
| `&selfolressections` |  |  |  | - | did not answer when run |
| `&selfrolebuttons` |  |  |  | - | did not answer when run |
| `&selfroleslogs` |  |  |  | - | did not answer when run |
| `&sendapplypanel` |  |  |  | - | did not answer when run |
| `&sendsection` |  |  |  | - | did not answer when run |
| `&setapply` |  |  |  | - | did not answer when run |
| `&setapplylogs` |  |  |  | - | did not answer when run |
| `&setapplymanagers` |  |  |  | - | did not answer when run |
| `&tempchannel` |  |  |  | - | did not answer when run |
| `&updatesection` |  |  |  | - | did not answer when run |
| `&verif-setup` |  |  |  | - | did not answer when run |
| `&warn-setup` |  |  |  | - | did not answer when run |
| `&1490716829373567116` |  |  |  | - | did not answer when run |
| `&1490717627784364065` |  |  |  | - | did not answer when run |
| `&1505004562556260524` |  |  |  | - | did not answer when run |
| `&1505736582316167188` |  |  |  | - | did not answer when run |
| `&1497237138998169680` |  |  |  | - | did not answer when run |
| `&1490716829373567112` |  |  |  | - | did not answer when run |
| `&1504189206761832689` |  |  |  | - | did not answer when run |
| `&1490716829373567115` |  |  |  | - | did not answer when run |
| `&1490716829373567114` |  |  |  | - | did not answer when run |
| `&1507111675638190260` |  |  |  | - | did not answer when run |
| `&1506017602760081528` |  |  |  | - | did not answer when run |
| `&1505287656345702651` |  |  |  | - | did not answer when run |
| `&1505685566631575552` |  |  |  | - | did not answer when run |
| `&1491143875392176268` |  |  |  | - | did not answer when run |
| `&1506021172654116986` |  |  |  | - | did not answer when run |
| `&1490716829344075780` |  |  |  | - | did not answer when run |
| `&1490716829373567110` |  |  |  | - | did not answer when run |
| `&1490716829361111151` |  |  |  | - | did not answer when run |
| `&1491548475005862040` |  |  |  | - | did not answer when run |
| `&1513525119413391461` |  |  |  | - | did not answer when run |

## Slash & context-menu commands

31 found, 13 answered. A chat-input (slash) command was run once with values for its required options, and again with its optional ones filled too when it had any safe to fake; a user/message right-click command has no options at all, so running it IS the action - it was run once on the account's own owner (user commands) or the target bot's own message (message commands), never a stranger. Commands that need a role/file or act on people/the server were not run.

| Command | Options | What it does | Answers with | Notes |
| --- | --- | --- | --- | --- |
| `/addcategorie` | `name`* | Add a new apply category to this server. | - | not run (needs a role/file, or acts on people/the server) |
| `/addqeustion` | `categorie`*, `question`*, `question_2`, `question_3`, `question_4`, `question_5`, `question_6` | Add one or more questions to an apply category. | - | not run (needs a role/file, or acts on people/the server) |
| `/cancelapply` |  | Cancel your currently pending application. | buttons/menus | run as `/cancelapply` |
| `/cmdtimeout set` | `scope`*, `command`*, `limit`*, `window`* | Create or update a command usage limit. | - | not run (needs a role/file, or acts on people/the server) |
| `/cmdtimeout remove` | `scope`*, `command`* | Remove a command usage limit. | - | not run (needs a role/file, or acts on people/the server) |
| `/cmdtimeout list` |  | List every configured command usage limit. | buttons/menus | run as `/cmdtimeout list` |
| `/cmdtimeout check` | `scope`*, `command`*, `user` | Check current usage for a user on a specific command. | buttons/menus | run as `/cmdtimeout check scope:prefix command:test`; also run with its optional options filled |
| `/cmdtimeout reset` | `scope`*, `command`, `user` | Reset usage counters for a command or an entire scope. | - | not run (needs a role/file, or acts on people/the server) |
| `/jail-setup` | `jailer_role`*, `jailed_role`*, `jail_logs_channel`* | Sets up the jail system for this server. | - | not run (needs a role/file, or acts on people/the server) |
| `/removecategorie` | `name`* | Remove an apply category from this server. | - | not run (needs a role/file, or acts on people/the server) |
| `/removequestion` | `categorie`*, `number`* | Remove a question from an apply category. | - | not run (needs a role/file, or acts on people/the server) |
| `/sendapplypanel` |  | Send the apply panel with category buttons into this channel. | buttons/menus | run as `/sendapplypanel` |
| `/setapply` | `json`, `file` | Save the apply panel JSON template for this server. | buttons/menus | run as `/setapply` |
| `/setapplylogs` | `channel`* | Set the channel used for application review logs. | - | not run (needs a role/file, or acts on people/the server) |
| `/setapplymanagers` | `role_1`*, `role_2`, `role_3`, `role_4`, `role_5` | Set one or more roles that can review applications. | - | not run (needs a role/file, or acts on people/the server) |
| `/tempchannel create` | `trigger_channel`*, `channel_name`*, `role_to_mention`, `notify_channel`, `user_limit`, `bitrate` | Create a temporary voice channel trigger. | - | not run (needs a role/file, or acts on people/the server) |
| `/tempchannel edit` | `trigger_channel`*, `channel_name`, `role_to_mention`, `notify_channel`, `user_limit`, `bitrate`, `clear_role`, `clear_notify_channel` | Edit an existing temporary voice channel trigger. | - | not run (needs a role/file, or acts on people/the server) |
| `/tempchannel delete` | `trigger_channel`*, `delete_active_channels` | Delete a temporary voice channel trigger. | - | not run (needs a role/file, or acts on people/the server) |
| `/tempchannel list` |  | List configured temporary voice channel triggers and active rooms. | buttons/menus | run as `/tempchannel list` |
| `/tempchannel cleanup` |  | Delete stale empty temporary rooms and orphaned records. | buttons/menus | run as `/tempchannel cleanup` |
| `/verif-setup` | `verified_role`*, `verified_female_role`*, `unverified_role`*, `verificator_role`*, `verif_logs_channel`* | Sets up the verification system for this server. | - | not run (needs a role/file, or acts on people/the server) |
| `/warn-setup` | `first_warn_role`*, `second_warn_role`*, `last_warn_role`*, `warner_role`*, `warn_logs_channel`* | Sets up the warn system for this server. | - | not run (needs a role/file, or acts on people/the server) |
| `/removebutton` | `section`*, `buttonname`* | Remove a self-role button mapping. | - | not run (needs a role/file, or acts on people/the server) |
| `/selfolressections list` |  | List all self-role sections. | text | run as `/selfolressections list` |
| `/selfolressections new` | `name`* | Create a new self-role section. | text | run as `/selfolressections new name:test` |
| `/selfolressections remove` | `name`* | Remove an existing self-role section. | - | not run (needs a role/file, or acts on people/the server) |
| `/selfrolebuttons` | `section`*, `buttonname`*, `roletogive`* | Add a button mapping to a self-role section. | - | not run (needs a role/file, or acts on people/the server) |
| `/selfroleslogs` | `channelid`* | Set the log channel for self-role actions. | text | run as `/selfroleslogs channelid:1510578707008585738` |
| `/sendsection` | `sectionname`*, `channelid`* | Send a configured self-role section to a channel. | text, embed | run as `/sendsection sectionname:test channelid:1510578707008585738` |
| `/updatesection` | `section`*, `mode`, `newname`, `newjson` | Update an existing self-role section. | text | run as `/updatesection section:test`; also run with its optional options filled |
| `/resetapplies` |  | Cancel every pending application in this server. | buttons/menus | run as `/resetapplies` |

\* = required option

- Custom emoji in the recording: 5 (0 uploaded, 5 already on your bot, 0 failed)

## Silent commands (empty stubs)

Listed by the help but never answered - usually owner-only, permission-gated, or needing a setup:

`&clear`, `&24`, `&addcategorie`, `&addqeustion`, `&cancelapply`, `&cmdtimeout`, `&jail-setup`, `&removebutton`, `&removecategorie`, `&removequestion`, `&resetapplies`, `&selfolressections`, `&selfrolebuttons`, `&selfroleslogs`, `&sendapplypanel`, `&sendsection`, `&setapply`, `&setapplylogs`, `&setapplymanagers`, `&tempchannel`, `&updatesection`, `&verif-setup`, `&warn-setup`, `&1490716829373567116`, `&1490717627784364065`, `&1505004562556260524`, `&1505736582316167188`, `&1497237138998169680`, `&1490716829373567112`, `&1504189206761832689`, `&1490716829373567115`, `&1490716829373567114`, `&1507111675638190260`, `&1506017602760081528`, `&1505287656345702651`, `&1505685566631575552`, `&1491143875392176268`, `&1506021172654116986`, `&1490716829344075780`, `&1490716829373567110`, `&1490716829361111151`, `&1491548475005862040`, `&1513525119413391461`

## Needs arguments, not tried with them

Their usage shows required arguments, but they either act on people/the server or need something that can't be faked (a role, a file, a link):

`&add`, `&addemoji`, `&addgame`, `&autoreplyrole`, `&autorole`, `&ban`, `&clearwarns`, `&deny`, `&disabledcmd`, `&kick`, `&mute`, `&nick`, `&perminall`, `&removegame`, `&role`, `&roleinfo`, `&setmoverole`, `&setmuted`, `&setmutelogs`, `&setmuterole`, `&setroleslogs`, `&slowmode`, `&softban`, `&timeout`, `&unban`, `&unmute`, `&unperminall`, `&unwarn`, `&warn`

## ⚠️ Action-style buttons that were pressed

Buy/sell/delete/confirm/pay/reset-style buttons are explored like any other button, so these really happened in the original bot while recording — whatever they did there is real and permanent:

| Command | Buttons pressed |
| --- | --- |
| `&anagram` | `anagram:cancel` |
| `&fasttype` | `fasttype:cancel` |
| `&guessnumber` | `guessnumber:cancel` |
| `&quickmath` | `quickmath:cancel` |
| `&riddle` | `riddle:cancel` |
| `&sequence` | `sequence:cancel` |
| `&sumup` | `sumup:cancel` |
| `&trivia` | `trivia:cancel` |
| `&wordscramble` | `wordscramble:cancel` |

## Modals (popup forms)

A button or menu of these commands popped up a form — its shape is recorded and the clone shows the same one, but it's never filled in or submitted while probing:

| Command | Title | Fields |
| --- | --- | --- |
| `&verifpanel` | Verify User as Male | `User ID` |
| `&verifpanel` | Verify User as Female | `User ID` |

## Voice-channel commands

These answered "join a voice channel first"; the account joined **🔗・Discord.gg/thetriangle** and ran them again there. The replica answers them only for users sitting in a voice channel, and shows the original notice to everyone else:

`&autoplay`, `&backward`, `&clearqueue`, `&filter`, `&forward`, `&loop`, `&movi`, `&pause`, `&play`, `&remove`, `&resume`, `&seek`, `&shuffle`, `&skip`, `&stop`, `&volume`

## Direct messages

Tried in the bot's DM: 0 prefix commands. Commands that only make sense in a server (ranks, moderation, music, settings...) weren't tried and stay server-only.

Slash commands that worked in DMs - offered as a user-installed app ("external app", usable in any DM): `/cancelapply`, `/cmdtimeout list`, `/cmdtimeout check`, `/sendapplypanel`, `/setapply`, `/tempchannel list`, `/tempchannel cleanup`, `/selfolressections list`, `/selfolressections new`, `/updatesection`, `/resetapplies`

Stopped trying DMs: CaptchaRequired: 400 Bad Request (error code: -1): Captcha required

## Random answers

Run several times; every different answer was kept and the replica picks one at random:

`&cat` (2), `&cuddle` (2), `&hug` (2), `&kill` (2), `&kiss` (2), `&roll` (2)

## What this analysis cannot tell you

Anything the bot does behind its answers: how it computes values, what it stores, permissions it checks, cooldowns, random outcomes. Only what its answers show is recorded.
