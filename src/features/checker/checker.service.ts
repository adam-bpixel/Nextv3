import { permissionBit, type PermissionName } from '../../core/permissions';

export const DANGEROUS_PERMISSIONS: readonly PermissionName[] = [
  'administrator',
  'manage_guild',
  'manage_roles',
  'manage_channels',
  'kick_members',
  'ban_members',
  'manage_messages',
  'manage_webhooks',
  'manage_guild_expressions',
  'manage_threads',
  'moderate_members',
  'mention_everyone',
  'view_audit_log',
];

export interface PermissionsLike {
  has(bit: bigint, checkAdmin?: boolean): boolean;
}

export function dangerousPermissionsOf(permissions: PermissionsLike): PermissionName[] {
  return DANGEROUS_PERMISSIONS.filter((permission) => permissions.has(permissionBit(permission), false));
}
