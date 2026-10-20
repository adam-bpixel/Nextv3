import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { claimMessage, releaseMessage } from '../../../core/collectorClaims';
import type { Ctx } from '../../../core/context';
import type { CommandOutcome } from '../../../core/types';
import { gameCard } from '../ui';

const TIMEOUT_MS = 45_000;

export interface ExpressionGameConfig {
  title: string;
  prompt: string;
  validate: (input: string) => boolean;
  hint: string;
}

function header(cfg: ExpressionGameConfig, extra: string): string {
  return `# ${cfg.title}\n${cfg.prompt}\n\n${extra}`;
}

function buttons(disabled: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('reveal').setLabel('Reveal').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

export async function playExpressionGame(ctx: Ctx, cfg: ExpressionGameConfig): Promise<CommandOutcome> {
  const idle = `Reply in this channel within ${TIMEOUT_MS / 1000} seconds or use the buttons below.`;
  const message = await ctx.send(gameCard(ctx, header(cfg, idle), [buttons(false)]));
  const channel = ctx.channel;
  if (!channel || !('createMessageCollector' in channel)) return 'completed';

  claimMessage(message.id);
  const buttonCollector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: TIMEOUT_MS });
  const messageCollector = channel.createMessageCollector({ time: TIMEOUT_MS, filter: (reply) => reply.author.id === ctx.user.id });
  buttonCollector.on('end', () => releaseMessage(message.id));
  let finished = false;

  const finish = (extra: string): void => {
    if (finished) return;
    finished = true;
    buttonCollector.stop();
    messageCollector.stop();
    message.edit(gameCard(ctx, header(cfg, extra), [buttons(true)])).catch(() => undefined);
  };

  messageCollector.on('collect', (reply) => {
    if (cfg.validate(reply.content)) {
      finish(`**${ctx.user.username}** solved it: \`${reply.content.trim()}\` = 24!`);
    }
  });

  buttonCollector.on('collect', (interaction) => {
    void (async () => {
      if (interaction.user.id !== ctx.user.id) {
        await interaction.reply({ content: "This isn't your game.", flags: MessageFlags.Ephemeral }).catch(() => undefined);
        return;
      }
      if (finished) return;
      finished = true;
      buttonCollector.stop();
      messageCollector.stop();
      const extra = interaction.customId === 'reveal' ? `You revealed a solution.\n${cfg.hint}` : 'Round cancelled. Start a new one whenever you want.';
      await interaction.update(gameCard(ctx, header(cfg, extra), [buttons(true)])).catch(() => undefined);
    })();
  });

  buttonCollector.on('end', () => finish(`Time's up.\n${cfg.hint}`));

  return 'completed';
}
