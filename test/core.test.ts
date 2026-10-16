import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import { fillTemplate, parseConfig } from '../src/core/config';
import { JsonStore } from '../src/core/db';
import { formatDuration, parseDuration } from '../src/core/format';
import { InvalidDataError, parseJsonText, toJsonObject } from '../src/core/json';
import { isPermissionName, permissionBit, toSnakeCase, type PermissionName } from '../src/core/permissions';
import { optionDefinition } from '../src/core/slash';
import { toTopLevelComponent } from '../src/features/recordings/components.schema';
import { parseRecording } from '../src/features/recordings/recording.model';
import { buildModal, fill, type Tokens } from '../src/features/recordings/recordings.ui';

const TOKENS: Tokens = { mention: '<@42>', username: 'neo', displayName: 'Neo', userId: '42', avatar: 'https://cdn.example/42.png', guild: 'Zion' };

describe('permissions', () => {
  it('maps every discord.js permission flag to a snake_case name and back', () => {
    for (const [flagName, bit] of Object.entries(PermissionFlagsBits)) {
      const name = toSnakeCase(flagName);
      assert.ok(isPermissionName(name), name);
      assert.equal(permissionBit(name), bit);
    }
  });

  it('types the names used in command files', () => {
    const used: PermissionName[] = ['ban_members', 'kick_members', 'manage_channels', 'manage_guild', 'manage_messages', 'moderate_members'];
    assert.ok(used.every(isPermissionName));
    assert.equal(isPermissionName('ban_member'), false);
  });
});

describe('durations', () => {
  it('parses units with minutes as the default', () => {
    assert.equal(parseDuration('10', 0), 600000);
    assert.equal(parseDuration('10s', 0), 10000);
    assert.equal(parseDuration('2w', 0), 1209600000);
    assert.ok(Number.isNaN(parseDuration('soon', Number.NaN)));
  });

  it('formats durations like the original bot', () => {
    assert.equal(formatDuration(0), '0s');
    assert.equal(formatDuration(90061000), '1d 1h 1m 1s');
  });
});

describe('config', () => {
  const file = toJsonObject(
    {
      prefix: '&', botName: 'Bot', slug: 'bot', color: 1,
      economy: { currency: 'coins', daily: 250, work: [50, 200] },
      levels: { enabled: false, announce: true, xpPerMessage: [15, 25], cooldownSeconds: 60 },
      messages: { serverOnly: 's', ownerOnly: 'o', missingPermission: 'need {permission}', joinVoice: 'j', cooldown: 'wait {time}', error: 'e', noAnswer: 'n', notRecorded: 'r' },
    },
    'test',
  );

  it('reads config.json with environment overrides', () => {
    const config = parseConfig(file, { PREFIX: '!', DISCORD_TOKEN: 'token', MONGODB_URI: 'mongodb://x' });
    assert.equal(config.prefix, '!');
    assert.equal(config.token, 'token');
    assert.equal(config.mongoDb, 'bot');
    assert.deepEqual(config.economy.work, [50, 200]);
  });

  it('rejects a config with a missing message', () => {
    const broken = toJsonObject({ ...file, messages: { serverOnly: 's' } }, 'test');
    assert.throws(() => parseConfig(broken, {}), InvalidDataError);
  });

  it('fills message templates', () => {
    assert.equal(fillTemplate('need {permission}', { permission: 'ban members' }), 'need ban members');
    assert.equal(fillTemplate('keep {unknown}', {}), 'keep {unknown}');
  });
});

describe('recordings', () => {
  it('replaces user tokens everywhere except custom ids', () => {
    const filled = fill({ content: 'hi {{mention}} in {{guild}}', custom_id: 'x{{userId}}' }, TOKENS);
    assert.deepEqual(filled, { content: 'hi <@42> in Zion', custom_id: 'x{{userId}}' });
  });

  it('validates recorded components into Discord API types', () => {
    const container = toTopLevelComponent(parseJsonText('{"type":17,"accent_color":1,"spoiler":false,"components":[{"type":10,"content":"hi"}]}', 'test'), 'test');
    assert.equal(container.type, 17);
    assert.throws(() => toTopLevelComponent(parseJsonText('{"type":17,"components":[{"type":99}]}', 'test'), 'test'), InvalidDataError);
    assert.throws(() => toTopLevelComponent(parseJsonText('{"type":10,"content":"x","surprise":true}', 'test'), 'test'), InvalidDataError);
  });

  it('treats a null recording as empty and rejects unknown fields', () => {
    assert.equal(parseRecording(null, 'mention.json').replies.length, 0);
    assert.throws(() => parseRecording(parseJsonText('{"replies":[],"oops":1}', 'x'), 'x'), InvalidDataError);
  });

  it('builds modals without empty fields', () => {
    const modal = toJsonObject(
      { title: 'Verify {{username}}', custom_id: 'm', components: [{ type: 1, components: [{ type: 4, custom_id: 'f', style: 1, label: 'ID', placeholder: '', min_length: 0, required: true }] }] },
      'test',
    );
    assert.deepEqual(buildModal(modal, TOKENS), {
      title: 'Verify neo',
      custom_id: 'm',
      components: [{ type: 1, components: [{ type: 4, custom_id: 'f', style: 1, label: 'ID', min_length: 0, required: true }] }],
    });
  });
});

describe('slash options', () => {
  it('keeps choices and numeric bounds only where Discord accepts them', () => {
    assert.deepEqual(optionDefinition({ name: 'n', type: ApplicationCommandOptionType.Integer, required: true, min_value: 1, max_value: null }), {
      name: 'n', description: 'n', required: true, type: ApplicationCommandOptionType.Integer, min_value: 1,
    });
    assert.deepEqual(optionDefinition({ name: 's', description: 'x'.repeat(150), type: ApplicationCommandOptionType.String, choices: [{ name: 'A', value: 'a' }] }), {
      name: 's', description: 'x'.repeat(100), required: false, type: ApplicationCommandOptionType.String, choices: [{ name: 'A', value: 'a' }],
    });
  });
});

describe('json store', () => {
  const temporaryFile = (): string => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bot-store-')), 'db.json');

  it('writes atomically and reads back after flush', async () => {
    const file = temporaryFile();
    const store = new JsonStore(file);
    await store.connect();
    await store.set('economy', '1', { wallet: 5, bank: 0, total: 5 });
    await store.flush();
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { economy: { '1': { wallet: 5, bank: 0, total: 5 } } });
    assert.equal(fs.existsSync(`${file}.tmp`), false);
  });

  it('keeps a corrupt file aside instead of overwriting it', async () => {
    const file = temporaryFile();
    fs.writeFileSync(file, '{"economy": {"1": ');
    const store = new JsonStore(file);
    await store.connect();
    const backups = fs.readdirSync(path.dirname(file)).filter((name) => name.startsWith('db.json.corrupt-'));
    assert.equal(backups.length, 1);
    assert.equal(await store.get('economy', '1'), undefined);
  });

  it('ranks entries by a numeric field', async () => {
    const store = new JsonStore(temporaryFile());
    await store.connect();
    await store.set('economy', 'a', { total: 1 });
    await store.set('economy', 'b', { total: 9 });
    await store.set('economy', 'c', { total: 'nope' });
    assert.deepEqual((await store.top('economy', 'total', 5)).map((entry) => entry.key), ['b', 'a']);
    await store.flush();
  });
});
