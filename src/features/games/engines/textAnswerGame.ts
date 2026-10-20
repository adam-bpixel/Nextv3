import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';
import { claimMessage, releaseMessage } from '../../../core/collectorClaims';
import type { Ctx } from '../../../core/context';
import type { CommandOutcome } from '../../../core/types';
import { gameCard } from '../ui';

const TIMEOUT_MS = 25_000;

export interface TextAnswerGameConfig {
  title: string;
  prompt: string;
  answer: string;
}

function header(cfg: TextAnswerGameConfig, extra: string): string {
  return `# ${cfg.title}\n${cfg.prompt}\n\n${extra}`;
}

function buttons(disabled: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('reveal').setLabel('Reveal').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

export async function playTextAnswerGame(ctx: Ctx, cfg: TextAnswerGameConfig): Promise<CommandOutcome> {
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
    if (reply.content.trim().toLowerCase() === cfg.answer.trim().toLowerCase()) {
      finish(`**${ctx.user.username}** got it right!\nAnswer: **${cfg.answer}**`);
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
      const extra = interaction.customId === 'reveal' ? `You revealed the answer.\nAnswer: **${cfg.answer}**` : 'Round cancelled. Start a new one whenever you want.';
      await interaction.update(gameCard(ctx, header(cfg, extra), [buttons(true)])).catch(() => undefined);
    })();
  });

  buttonCollector.on('end', () => finish(`Time's up.\nAnswer: **${cfg.answer}**`));

  return 'completed';
}
