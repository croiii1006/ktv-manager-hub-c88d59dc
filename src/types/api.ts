export type ApiResult<T> = {
  code?: number;
  message?: string;
  msg?: string;
  success?: boolean;
  timestamp?: number;
  data?: T;
};

export type PageResp<T> = {
  total: number;
  pages?: number;
  page?: number;
  size?: number;
  list: T[];
};
