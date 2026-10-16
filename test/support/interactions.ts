import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ComponentType,
  InteractionType,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  type BaseInteraction,
  type Client,
} from 'discord.js';

const USER = { id: '200000000000000001', username: 'tester', discriminator: '0', avatar: null, global_name: null };
const CHANNEL_ID = '400000000000000001';

const MESSAGE = {
  id: '500000000000000001',
  channel_id: CHANNEL_ID,
  author: USER,
  content: '',
  timestamp: new Date(0).toISOString(),
  edited_timestamp: null,
  tts: false,
  mention_everyone: false,
  mentions: [],
  mention_roles: [],
  attachments: [],
  embeds: [],
  pinned: false,
  type: 0,
};

const BASE = {
  id: '700000000000000001',
  application_id: '300000000000000001',
  token: 'offline-test-token',
  version: 1,
  channel_id: CHANNEL_ID,
  user: USER,
  locale: 'en-US',
  app_permissions: '0',
  entitlements: [],
  authorizing_integration_owners: {},
  attachment_size_limit: 1,
};

function ensure<T extends BaseInteraction>(built: unknown, isKind: (value: unknown) => value is T, kindName: string): T {
  if (!isKind(built)) throw new Error(`Could not build a ${kindName}`);
  return built;
}

export function fakeButton(client: Client, customId: string): ButtonInteraction {
  return ensure(
    Reflect.construct(ButtonInteraction, [client, {
      ...BASE,
      type: InteractionType.MessageComponent,
      data: { custom_id: customId, component_type: ComponentType.Button },
      message: MESSAGE,
    }]),
    (value): value is ButtonInteraction => value instanceof ButtonInteraction,
    'ButtonInteraction',
  );
}

export function fakeStringSelect(client: Client, customId: string, values: string[]): StringSelectMenuInteraction {
  return ensure(
    Reflect.construct(StringSelectMenuInteraction, [client, {
      ...BASE,
      type: InteractionType.MessageComponent,
      data: { custom_id: customId, component_type: ComponentType.StringSelect, values },
      message: MESSAGE,
    }]),
    (value): value is StringSelectMenuInteraction => value instanceof StringSelectMenuInteraction,
    'StringSelectMenuInteraction',
  );
}

export function fakeModalSubmit(client: Client, customId: string): ModalSubmitInteraction {
  return ensure(
    Reflect.construct(ModalSubmitInteraction, [client, {
      ...BASE,
      type: InteractionType.ModalSubmit,
      data: { custom_id: customId, components: [] },
    }]),
    (value): value is ModalSubmitInteraction => value instanceof ModalSubmitInteraction,
    'ModalSubmitInteraction',
  );
}

export function fakeChatInput(client: Client, name: string): ChatInputCommandInteraction {
  return ensure(
    Reflect.construct(ChatInputCommandInteraction, [client, {
      ...BASE,
      type: InteractionType.ApplicationCommand,
      data: { id: '800000000000000001', name, type: 1, options: [] },
    }]),
    (value): value is ChatInputCommandInteraction => value instanceof ChatInputCommandInteraction,
    'ChatInputCommandInteraction',
  );
}
