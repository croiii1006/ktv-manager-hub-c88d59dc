export type ApiResult<T> = {
  code?: number;
  message?: string;
  msg?: string;
  success?: boolean;
  data?: T;
};

export type PageResp<T> = {
  total: number;
  list: T[];
};
