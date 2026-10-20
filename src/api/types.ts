export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export const ok = <T>(data: T): ApiSuccess<T> => ({ ok: true, data });
export const fail = (error: string): ApiError => ({ ok: false, error });
