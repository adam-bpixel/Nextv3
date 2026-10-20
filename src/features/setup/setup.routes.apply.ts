import { applyApplicantRoutes } from './setup.routes.apply.applicant';
import { applyPanelRoutes } from './setup.routes.apply.panel';
import { applyQuestionRoutes } from './setup.routes.apply.questions';

export const applyRoutes = [...applyPanelRoutes, ...applyQuestionRoutes, ...applyApplicantRoutes];
