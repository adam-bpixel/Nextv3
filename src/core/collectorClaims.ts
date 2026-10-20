
const claimedMessageIds = new Set<string>();

export function claimMessage(messageId: string): void {
  claimedMessageIds.add(messageId);
}

export function releaseMessage(messageId: string): void {
  claimedMessageIds.delete(messageId);
}

export function isMessageClaimed(messageId: string): boolean {
  return claimedMessageIds.has(messageId);
}
