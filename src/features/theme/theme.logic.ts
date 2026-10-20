import { fail, requireGuild } from '../../core/replies';
import type { CommandHandler } from '../../core/types';
import { successReply } from '../../core/usage-replies';
import { parseColor, resetGuildColor, setGuildColor } from './theme.model';

export const themeLogic = {
  async themePrefix(ctx) {
    const guild = await requireGuild(ctx);
    if (!guild) return 'skipped';
    const [input] = ctx.args;
    if (!input) {
      return fail(
        ctx,
        `Use: \`${ctx.prefix}theme <hex color>\` to set the color.\nExample: \`${ctx.prefix}theme #ffd700\`.\nUse: \`${ctx.prefix}theme reset\` to restore the default color.`,
      );
    }
    if (input.toLowerCase() === 'reset') {
      await resetGuildColor(guild.id);
      await ctx.send(successReply(ctx, "Reset to the bot's default embed color."));
      return 'completed';
    }
    const color = parseColor(input);
    if (color === null) {
      return fail(
        ctx,
        `Give a valid hex color.\nUse: \`${ctx.prefix}theme <hex color>\` to set the color.\nExample: \`${ctx.prefix}theme #ffd700\`.\nUse: \`${ctx.prefix}theme reset\` to restore the default color.`,
      );
    }
    await setGuildColor(guild.id, color);
    await ctx.send(successReply(ctx, `Embed color updated to \`#${color.toString(16).padStart(6, '0')}\`.`));
    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
