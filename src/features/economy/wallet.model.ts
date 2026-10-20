import db, { type Entry } from '../../core/db';
import { isRecord } from '../../core/json';

export interface Wallet {
  wallet: number;
  bank: number;
  total: number;
}

const ECONOMY_COLLECTION = 'economy';
const TOTAL_FIELD = 'total';

export function parseWallet(value: unknown): Wallet {
  if (!isRecord(value)) return { wallet: 0, bank: 0, total: 0 };
  const read = (key: keyof Wallet): number => {
    const amount = value[key];
    return typeof amount === 'number' ? amount : 0;
  };
  return { wallet: read('wallet'), bank: read('bank'), total: read('total') };
}

export async function loadWallet(userId: string): Promise<Wallet> {
  return parseWallet(await db.get(ECONOMY_COLLECTION, userId));
}

export async function saveWallet(userId: string, wallet: Wallet): Promise<void> {
  await db.set(ECONOMY_COLLECTION, userId, { ...wallet, total: wallet.wallet + wallet.bank });
}

export async function richest(limit: number): Promise<{ userId: string; wallet: Wallet }[]> {
  const entries: Entry[] = await db.top(ECONOMY_COLLECTION, TOTAL_FIELD, limit);
  return entries.map((entry) => ({ userId: entry.key, wallet: parseWallet(entry.value) }));
}


export async function richestFull(): Promise<{ userId: string; wallet: Wallet }[]> {
  const entries = await db.all(ECONOMY_COLLECTION);
  return entries
    .map((entry) => ({ userId: entry.key, wallet: parseWallet(entry.value) }))
    .sort((a, b) => b.wallet.total - a.wallet.total);
}
