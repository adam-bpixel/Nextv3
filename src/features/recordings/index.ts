import type { MessageComponentInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { isRecordedCustomId } from './flows.model';
import { handleComponent } from './recordings.service';

export const routes = [
  defineRoute<MessageComponentInteraction>({
    name: 'recordings:component',
    match: (interaction): interaction is MessageComponentInteraction => interaction.isMessageComponent() && isRecordedCustomId(interaction.customId),
    handle: handleComponent,
  }),
];
