export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string): HttpError => new HttpError(400, message);
export const unauthorized = (message: string): HttpError => new HttpError(401, message);
export const notFound = (message: string): HttpError => new HttpError(404, message);
