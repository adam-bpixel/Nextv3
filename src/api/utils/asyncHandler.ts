import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (route: AsyncRoute): RequestHandler => (req, res, next) => {
  route(req, res, next).catch(next);
};
