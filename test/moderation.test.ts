import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { timeoutRequest } from '../src/features/moderation/moderation.logic';
import {
  DISCORD_MAX_TIMEOUT_MS,
  REFUSALS,
  hierarchyRefusal,
  kickMember,
  removeTimeout,
  timeoutMember,
  type ModeratedMember,
  type RankedMember,
} from '../src/features/moderation/moderation.service';

const OWNER_ID = '9';

interface RecordedCall {
  action: 'kick' | 'timeout';
  durationMs?: number | null;
  reason?: string | undefined;
}

function ranked(id: string, position: number): RankedMember {
  return { id, user: { username: `user${id}` }, roles: { highest: { position } } };
}

function moderated(id: string, position: number, calls: RecordedCall[], botCanAct = true): ModeratedMember {
  return {
    ...ranked(id, position),
    guild: { ownerId: OWNER_ID },
    kickable: botCanAct,
    moderatable: botCanAct,
    kick: (reason) => {
      calls.push({ action: 'kick', reason });
      return Promise.resolve();
    },
    timeout: (durationMs, reason) => {
      calls.push({ action: 'timeout', durationMs, reason });
      return Promise.resolve();
    },
  };
}

describe('moderation service', () => {
  const guild = { ownerId: OWNER_ID };

  it('lets a higher moderator act on a lower member', () => {
    assert.equal(hierarchyRefusal(guild, ranked('1', 10), '2', ranked('2', 5)), null);
  });

  it('refuses equal or higher targets, self and the owner', () => {
    assert.equal(hierarchyRefusal(guild, ranked('1', 10), '2', ranked('2', 10)), REFUSALS.targetOutranksModerator);
    assert.equal(hierarchyRefusal(guild, ranked('1', 10), '2', ranked('2', 15)), REFUSALS.targetOutranksModerator);
    assert.equal(hierarchyRefusal(guild, ranked('1', 10), '1', ranked('1', 10)), REFUSALS.targetIsSelf);
    assert.equal(hierarchyRefusal(guild, ranked('1', 10), OWNER_ID, null), REFUSALS.targetIsOwner);
  });

  it('lets the owner act on anyone else and allows users who are not members', () => {
    assert.equal(hierarchyRefusal(guild, ranked(OWNER_ID, 0), '2', ranked('2', 50)), null);
    assert.equal(hierarchyRefusal(guild, ranked('1', 1), '77', null), null);
  });

  it('kicks with an audit reason naming the moderator', async () => {
    const calls: RecordedCall[] = [];
    assert.equal(await kickMember(moderated('2', 5, calls), ranked('1', 10), 'spam'), null);
    assert.deepEqual(calls, [{ action: 'kick', reason: 'user1: spam' }]);
  });

  it('does not kick when the bot cannot or the moderator is lower', async () => {
    const calls: RecordedCall[] = [];
    assert.equal(await kickMember(moderated('2', 5, calls, false), ranked('1', 10), 'spam'), REFUSALS.cannotKick);
    assert.equal(await kickMember(moderated('2', 15, calls), ranked('1', 10), 'spam'), REFUSALS.targetOutranksModerator);
    assert.deepEqual(calls, []);
  });

  it('caps timeouts at the Discord maximum', async () => {
    const calls: RecordedCall[] = [];
    await timeoutMember(moderated('2', 5, calls), ranked('1', 10), DISCORD_MAX_TIMEOUT_MS * 2, 'flood');
    assert.deepEqual(calls, [{ action: 'timeout', durationMs: DISCORD_MAX_TIMEOUT_MS, reason: 'user1: flood' }]);
  });

  it('applies the hierarchy to removing a timeout too', async () => {
    const calls: RecordedCall[] = [];
    assert.equal(await removeTimeout(moderated('2', 15, calls), ranked('1', 10)), REFUSALS.targetOutranksModerator);
    assert.equal(await removeTimeout(moderated('2', 5, calls), ranked('1', 10)), null);
    assert.deepEqual(calls, [{ action: 'timeout', durationMs: null, reason: undefined }]);
  });
});

describe('timeout arguments', () => {
  it('keeps the whole reason when no duration is given', () => {
    assert.deepEqual(timeoutRequest(['<@2>', 'being', 'rude']), { durationMs: 600000, reason: 'being rude' });
  });

  it('reads the duration when one is given', () => {
    assert.deepEqual(timeoutRequest(['<@2>', '5m', 'being', 'rude']), { durationMs: 300000, reason: 'being rude' });
    assert.deepEqual(timeoutRequest(['<@2>', '2h']), { durationMs: 7200000, reason: 'No reason given' });
  });
});
