import db from '../../core/db';
import { COLLECTION, getGuildSetup, type GuildSetup, type OpenTicket, type PanelText, type TicketCategory, type TicketSettings } from './setup.model.core';

export const MAX_TICKET_CATEGORIES = 10;

export async function addTicketCategory(guildId: string, category: TicketCategory): Promise<TicketCategory[]> {
  const setup = await getGuildSetup(guildId);
  const categories = setup.ticketCategories ?? [];
  if (categories.length >= MAX_TICKET_CATEGORIES) throw new Error(`You can add up to ${MAX_TICKET_CATEGORIES} ticket categories.`);
  const ticketCategories = [...categories, category];
  await db.set(COLLECTION, guildId, { ...setup, ticketCategories });
  return ticketCategories;
}

export async function removeTicketCategory(guildId: string, categoryId: string): Promise<TicketCategory[]> {
  const setup = await getGuildSetup(guildId);
  const ticketCategories = (setup.ticketCategories ?? []).filter((category) => category.id !== categoryId);
  await db.set(COLLECTION, guildId, { ...setup, ticketCategories });
  return ticketCategories;
}

export async function editTicketCategory(guildId: string, categoryId: string, patch: Omit<TicketCategory, 'id'>): Promise<TicketCategory[]> {
  const setup = await getGuildSetup(guildId);
  const categories = setup.ticketCategories ?? [];
  const index = categories.findIndex((category) => category.id === categoryId);
  if (index === -1) throw new Error('That category no longer exists.');
  const ticketCategories = categories.map((category, i) => (i === index ? { id: categoryId, ...patch } : category));
  await db.set(COLLECTION, guildId, { ...setup, ticketCategories });
  return ticketCategories;
}

export async function saveTicketSettings(guildId: string, data: TicketSettings): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), ticket: data });
}

export async function saveTicketPanelText(guildId: string, data: PanelText): Promise<void> {
  await db.set(COLLECTION, guildId, { ...(await getGuildSetup(guildId)), ticketPanelText: data });
}

export function findOpenTicket(setup: GuildSetup, userId: string, categoryId: string): OpenTicket | undefined {
  return (setup.openTickets ?? []).find((ticket) => ticket.userId === userId && ticket.categoryId === categoryId);
}

export async function addOpenTicket(guildId: string, ticket: OpenTicket): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const openTickets = [...(setup.openTickets ?? []), ticket];
  await db.set(COLLECTION, guildId, { ...setup, openTickets });
}

export async function removeOpenTicketByChannel(guildId: string, channelId: string): Promise<void> {
  const setup = await getGuildSetup(guildId);
  const openTickets = (setup.openTickets ?? []).filter((ticket) => ticket.channelId !== channelId);
  await db.set(COLLECTION, guildId, { ...setup, openTickets });
}
