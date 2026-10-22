import type { User } from 'discord.js';
import { themedReplyFor } from '../../core/usage-replies';
import { NO_REASON } from './moderation.service';

const NO_REASON_TEXT = 'No reason was provided';

export function reasonLines(reason: string): string[] {
  return [`Reason: ${reason && reason !== NO_REASON ? reason : NO_REASON_TEXT}`];
}

export async function notifyMember(user: User, title: string, lines: readonly string[]): Promise<void> {
  await user.send(themedReplyFor(null, false, 'error', lines.join('\n'), { title, keepCode: true })).catch(() => undefined);
}
