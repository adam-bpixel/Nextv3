export const ARROW_LEFT_GOLD = { id: '1560754447720648825', name: 'arrow_left_gold', animated: true } as const;
export const ARROW_RIGHT_GOLD = { id: '1560754445397262489', name: 'arrow_right_gold', animated: true } as const;
export const TOPMA_ICON = '<:imageremovebgpreview31:1560807209821020270>';
export const FULLCHECK_ICON = '<:fullcheck_gold:1561016269162156146>';
export const CHECKROLES_ICON = '<:checkroles_gold:1561016271137411163>';
export const SERVERS_ICON = '<a:694016yellowplanet:1561028784340078622>';
export const APPLY_ACCEPT_ICON = '<:apply_accept:1561425406840537163>';
export const APPLY_REJECT_ICON = '<:apply_reject:1561425408774242454>';
export const AUTOREPLY_ADD_ICON = '<:autoreply_add:1561442006037700708>';
export const AUTOREPLY_REMOVE_ICON = '<:autoreply_remove:1561442008847880284>';
export const AUTOREPLY_LIST_ICON = '<:autoreply_list:1561442011905523802>';
export const INVENTORY_HEADER_ICON = '<:inventory_header_gray:1561821788315586572>';
export const INVENTORY_PROFILES_ICON = '<:inventory_profiles_gray:1561821797048131677>';
export const INVENTORY_BALANCE_ICON = '<:inventory_balance_gray:1561821805436739758>';
export const INVENTORY_BOOST_ICON = '<:inventory_boost_gray:1561821820645015642>';
export const GAMEFINDER_ICON = '<:gamefinder_icon:1561738679305773168>';
export const GAMEFINDER_PLAYER_ICON = '<:gamefinder_player:1561738683781226608>';
export const GAMEFINDER_JOIN_ICON = { id: '1561738685706281141', name: 'gamefinder_join' } as const;
export const VOICECHECK_MUTE_ICON = '<:voicecheck_mute:1561744564979634300>';
export const VOICECHECK_DEAFEN_ICON = '<:voicecheck_deafen:1561744567831625738>';
export const VOICECHECK_MIC_ICON = '<:voicecheck_mic:1561747616994431099>';
export const PREMIUM_DIAMOND_GRAY_ICON = '<:premium_diamond_gray:1561814803553460255>';
export const PREMIUM_DIAMOND_BLUE_ICON = '<:premium_diamond_blue:1561814805294227499>';

export const HELP_CATEGORY_ICONS: Readonly<Record<string, string>> = {
  Checker: '<:help_checker:1561803056377626735>',
  moderation: '<:help_moderation:1561803059284283504>',
  admin: '<:help_admin:1561803063390634025>',
  games: '<:help_fun:1561803066922238063>',
  social: '<:help_fun:1561803066922238063>',
  Verification: '<:help_verification:1561803071099637881>',
  Information: '<:help_information:1561803083699462326>',
  owner: '<:help_owner:1561803085981032450>',
  Profile: '<:help_profile:1561803088992407602>',
  Top: '<:help_top:1561803091622502483>',
  premium: '<:help_premium:1561803094977679410>',
  Warning: '<:help_warning:1561803097657974846>',
  Levels: '<:help_levels:1561803100937916456>',
  security: '<:help_security:1561803103907348532>',
  setup: '<:help_setup:1561803109297291344>',
  utility: '<:help_utility:1561803112140902572>',
  Jail: '<:help_jail:1561803118252130465>',
  economy: '<:help_economy:1561909342028963941>',
  clan_commands: '<:help_clans:1561803121036894218>',
  setup_slash_commands: '<:help_slash:1561803124614635680>',
};

export const NUMBER_EMOJIS: Readonly<Record<number, string>> = {
  0: '<:num_0_gray:1561821833274204330>',
  1: '<:num_1_gray:1561821844103757944>',
  2: '<:num_2_gray:1561821854208106567>',
  3: '<:num_3_gray:1561821863246569604>',
  4: '<:num_4_gray:1561821872658579487>',
  5: '<:num_5_gray:1561821883366768672>',
  6: '<:num_6_gray:1561821893156413560>',
  7: '<:num_7_gray:1561821903260356680>',
  8: '<:num_8_gray:1561821915201667123>',
  9: '<:num_9_gray:1561821928413601946>',
};

export function numberEmoji(value: number): string {
  return String(Math.max(0, value)).split('').map((digit) => NUMBER_EMOJIS[Number(digit)]).join('');
}
