import db from '../../core/db';
import { type ApplyCategory, type ApplySettings, COLLECTION, getGuildSetup, type GuildSetup, type PanelText, type PendingApply } from './setup.model.core';

export const MAX_APPLY_CATEGORIES = 10;
export const MAX_APPLY_QUESTIONS = 5;

export async function addApplyCategory(guildId: string, category: ApplyCategory): Promise<ApplyCategory[]> {
  const setup = await getGuildSetup(guildId);
  const categories = setup.applyCategories ?? [];
  if (categories.length >= MAX_APPLY_CATEGORIES) throw new Error(`You can add up to ${MAX_APPLY_CATEGORIES} apply categories.`);
  const applyCategories = [...categories, category];
  await db.set(COLLECTION, guildId, { ...setup, applyCategories });
  return applyCategories;
}

export async function removeApplyCategory(guildId: string, categoryId: string): Promise<ApplyCategory[]> {
  const setup = await getGuildSetup(guildId);
  const applyCategories = (setup.applyCategories ?? []).filter((category) => category.id !== categoryId);
  await db.set(COLLECTION, guildId, { ...setup, applyCategories });
  return applyCategories;
}

export async function editApplyCategory(
  guildId: string,
  categoryId: string,
  patch: Omit<ApplyCategory, 'id' | 'questions'>,
): Promise<ApplyCategory[]> {
  const setup = await getGuildSetup(guildId);
  const categories = setup.applyCategories ?? [];
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index === -1) throw new Error('That category no longer exists.');
  const existing = categories[index];
  if (!existing) throw new Error('That category no longer exists.');
  const applyCategories = categories.map((category, i) => (i === index ? { id: categoryId, questions: existing.questions, ...patch } : category));
  await db.set(COLLECTION, guildId, { ...setup, applyCategories });
  return applyCategories;
}

export async function addApplyQuestion(guildId: string, categoryId: string, question: string): Promise<ApplyCategory> {
  const setup = await getGuildSetup(guildId);
  const categories = setup.applyCategories ?? [];
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index === -1) throw new Error('That category no longer exists.');
  const category = categories[index];
  if (!category) throw new Error('That category no longer exists.');
  if (category.questions.length >= MAX_APPLY_QUESTIONS) throw new Error(`You can add up to ${MAX_APPLY_QUESTIONS} questions per category.`);
  const updated: ApplyCategory = { ...category, questions: [...category.questions, question] };
  const applyCategories = categories.map((candidate, i) => (i === index ? updated : candidate));
  await db.set(COLLECTION, guildId, { ...setup, applyCategories });
  return updated;
}

export async function removeApplyQuestion(guildId: string, categoryId: string, questionIndex: number): Promise<ApplyCategory> {
  const setup = await getGuildSetup(guildId);
  const categories = setup.applyCategories ?? [];
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index === -1) throw new Error('That category no longer exists.');
  const category = categories[index];
  if (!category) throw new Error('That category no longer exists.');
  const updated: ApplyCategory = { ...category, questions: category.questions.filter((_, i) => i !== questionIndex) };
  const applyCategories = categories.map((candidate, i) => (i === index ? updated : candidate));
  await db.set(COLLECTION, guildId, { ...setup, applyCategories });
  return updated;
}

export async function saveApplySettings(guildId: string, data: ApplySettings): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), apply: data });
}

export async function saveApplyPanelText(guildId: string, data: PanelText): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), applyPanelText: data });
}

export function findPendingApply(setup: GuildSetup, userId: string): PendingApply | undefined {
  return (setup.pendingApplies ?? []).find((pending) => pending.userId === userId);
}

export function findPendingApplyByMessage(setup: GuildSetup, messageId: string): PendingApply | undefined {
  return (setup.pendingApplies ?? []).find((pending) => pending.messageId === messageId);
}

export async function addPendingApply(guildId: string, pending: PendingApply): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const pendingApplies = [...(setup.pendingApplies ?? []).filter((candidate) => candidate.userId !== pending.userId), pending];
  await db.set(COLLECTION, guildId, { ...setup, pendingApplies });
}

export async function removePendingApplyByUser(guildId: string, userId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const pendingApplies = (setup.pendingApplies ?? []).filter((pending) => pending.userId !== userId);
  await db.set(COLLECTION, guildId, { ...setup, pendingApplies });
}

export async function removeAllPendingApplies(guildId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  await db.set(COLLECTION, guildId, { ...setup, pendingApplies: [] });
}
