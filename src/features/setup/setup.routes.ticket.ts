import { ticketCategoryRoutes } from './setup.routes.ticket.categories';
import { ticketLifecycleRoutes } from './setup.routes.ticket.lifecycle';
import { ticketPanelRoutes } from './setup.routes.ticket.panel';

export const ticketRoutes = [...ticketCategoryRoutes, ...ticketPanelRoutes, ...ticketLifecycleRoutes];
