import db from '../../core/db';
import {
  COLLECTION,
  getGuildSetup,
  type SelfRoleButton,
  type SelfRoleMode,
  type SelfRolePanelInteraction,
  type SelfRolePanelStyle,
  type SelfRoleSection,
  type SelfRoleSettings,
} from './setup.model.core';

export const MAX_SELFROLE_SECTIONS = 10;
export const MAX_SELFROLE_BUTTONS = 5;

export async function addSelfRoleSection(guildId: string, section: SelfRoleSection): Promise<SelfRoleSection[]> {
  const setup = await getGuildSetup(guildId);
  const sections = setup.selfRoleSections ?? [];
  if (sections.length >= MAX_SELFROLE_SECTIONS) throw new Error(`You can add up to ${MAX_SELFROLE_SECTIONS} self-role sections.`);
  const selfRoleSections = [...sections, section];
  await db.set(COLLECTION, guildId, { ...setup, selfRoleSections });
  return selfRoleSections;
}

export async function removeSelfRoleSection(guildId: string, sectionId: string): Promise<SelfRoleSection[]> {
  const setup = await getGuildSetup(guildId);
  const selfRoleSections = (setup.selfRoleSections ?? []).filter((section) => section.id !== sectionId);
  await db.set(COLLECTION, guildId, { ...setup, selfRoleSections });
  return selfRoleSections;
}

export async function editSelfRoleSection(
  guildId: string,
  sectionId: string,
  patch: { name: string; mode: SelfRoleMode; description?: string; color?: string; imageURL?: string },
): Promise<SelfRoleSection[]> {
  const setup = await getGuildSetup(guildId);
  const sections = setup.selfRoleSections ?? [];
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) throw new Error('That section no longer exists.');
  const existing = sections[index];
  if (!existing) throw new Error('That section no longer exists.');
  const selfRoleSections = sections.map((section, i) => (i === index ? { ...existing, ...patch } : section));
  await db.set(COLLECTION, guildId, { ...setup, selfRoleSections });
  return selfRoleSections;
}

export async function saveSelfRolePanelMeta(
  guildId: string,
  sectionIds: readonly string[],
  channelId: string,
  panelStyle: SelfRolePanelStyle,
  panelInteraction: SelfRolePanelInteraction,
): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const ids = new Set(sectionIds);
  const selfRoleSections = (setup.selfRoleSections ?? []).map((section) =>
    ids.has(section.id) ? { ...section, channelId, panelStyle, panelInteraction } : section,
  );
  await db.set(COLLECTION, guildId, { ...setup, selfRoleSections });
}

export async function addSelfRoleButton(guildId: string, sectionId: string, button: SelfRoleButton): Promise<SelfRoleSection> {
  const setup = await getGuildSetup(guildId);
  const sections = setup.selfRoleSections ?? [];
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) throw new Error('That section no longer exists.');
  const section = sections[index];
  if (!section) throw new Error('That section no longer exists.');
  if (section.buttons.some((candidate) => candidate.roleId === button.roleId)) throw new Error('That role is already in this section.');
  if (section.buttons.length >= MAX_SELFROLE_BUTTONS) throw new Error(`You can add up to ${MAX_SELFROLE_BUTTONS} roles per section.`);
  const updated: SelfRoleSection = { ...section, buttons: [...section.buttons, button] };
  const selfRoleSections = sections.map((candidate, i) => (i === index ? updated : candidate));
  await db.set(COLLECTION, guildId, { ...setup, selfRoleSections });
  return updated;
}

export async function removeSelfRoleButton(guildId: string, sectionId: string, roleId: string): Promise<SelfRoleSection> {
  const setup = await getGuildSetup(guildId);
  const sections = setup.selfRoleSections ?? [];
  const index = sections.findIndex((section) => section.id === sectionId);
  if (index === -1) throw new Error('That section no longer exists.');
  const section = sections[index];
  if (!section) throw new Error('That section no longer exists.');
  const updated: SelfRoleSection = { ...section, buttons: section.buttons.filter((button) => button.roleId !== roleId) };
  const selfRoleSections = sections.map((candidate, i) => (i === index ? updated : candidate));
  await db.set(COLLECTION, guildId, { ...setup, selfRoleSections });
  return updated;
}

export async function saveSelfRoleSettings(guildId: string, data: SelfRoleSettings): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), selfRole: data });
}
