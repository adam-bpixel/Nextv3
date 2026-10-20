import { selfRoleButtonRoutes } from './setup.routes.selfrole.buttons';
import { selfRoleMemberRoutes } from './setup.routes.selfrole.member';
import { selfRolePanelRoutes } from './setup.routes.selfrole.panel';
import { selfRoleSectionRoutes } from './setup.routes.selfrole.sections';

export const selfRoleRoutes = [...selfRoleSectionRoutes, ...selfRoleButtonRoutes, ...selfRolePanelRoutes, ...selfRoleMemberRoutes];
