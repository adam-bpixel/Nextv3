import { SimpleShardingStrategy, type WebSocketManager } from '@discordjs/ws';
import type { Client } from 'discord.js';

export interface DeviceInfo {
  readonly label: string;
  readonly emoji: string;
  readonly aliases?: readonly string[];
  readonly properties: { readonly browser: string; readonly device: string };
}

export const DEVICES: Readonly<Record<string, DeviceInfo>> = {
  desktop: { label: 'Desktop', emoji: '🖥️', properties: { browser: 'Discord Client', device: 'Discord Client' } },
  mobile: { label: 'Mobile', emoji: '📱', aliases: ['android', 'ios', 'phone'], properties: { browser: 'Discord Android', device: 'Discord Android' } },
  web: { label: 'Web', emoji: '🌐', aliases: ['browser'], properties: { browser: 'Discord Web', device: '' } },
  vr: { label: 'VR', emoji: '🥽', aliases: ['oculus'], properties: { browser: 'Discord VR', device: 'Desktop' } },
  opera: { label: 'Opera', emoji: '🧭', aliases: ['operagx'], properties: { browser: 'Discord Opera', device: 'Desktop' } },
};

export const DEFAULT_DEVICE = 'desktop';

let currentDevice = DEFAULT_DEVICE;

export function getDeviceKey(): string {
  return currentDevice;
}

export function setDeviceKey(key: string): void {
  currentDevice = DEVICES[key] ? key : DEFAULT_DEVICE;
}

export function resolveDevice(input: string | null | undefined): (DeviceInfo & { key: string }) | null {
  const key = input?.trim().toLowerCase();
  if (!key) return null;
  const direct = DEVICES[key];
  if (direct) return { key, ...direct };
  const found = Object.entries(DEVICES).find(([, device]) => device.aliases?.includes(key));
  return found ? { key: found[0], ...found[1] } : null;
}

function identifyProperties(key: string): { os: string; browser: string; device: string } {
  const device = DEVICES[key] ?? DEVICES[DEFAULT_DEVICE];
  return { os: process.platform, browser: device?.properties.browser ?? '', device: device?.properties.device ?? '' };
}

export function buildShardingStrategy(manager: WebSocketManager): SimpleShardingStrategy {
  manager.options.identifyProperties = identifyProperties(currentDevice);
  return new SimpleShardingStrategy(manager);
}

interface ClientWithGateway {
  ws?: { _ws?: WebSocketManager };
}

export async function applyDeviceLive(client: Client): Promise<boolean> {
  try {
    const manager = (client as unknown as ClientWithGateway).ws?._ws;
    if (!manager) return false;
    manager.options.identifyProperties = identifyProperties(currentDevice);
    await manager.connect();
    return true;
  } catch (error) {
    console.error('Applying the bot device live failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}
