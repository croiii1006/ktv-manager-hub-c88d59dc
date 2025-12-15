import { request } from '@/services/http';
import type { ApiResult, PageResp } from '@/types/api';

const ADMIN = '/api/admin';

export const StoresApi = {
  list: (query?: { page?: number; size?: number; keyword?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/stores`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/stores/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/stores`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/stores/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/stores/${id}`, { method: 'DELETE' }),
};

export const TeamLeadersApi = {
  list: (query?: { page?: number; size?: number; keyword?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/team-leaders`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/team-leaders/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/team-leaders`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/team-leaders/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/team-leaders/${id}`, { method: 'DELETE' }),
};

export const SalespersonsApi = {
  list: (query?: { page?: number; size?: number; keyword?: string; shop?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/salespersons`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/salespersons/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/salespersons`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/salespersons/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/salespersons/${id}`, { method: 'DELETE' }),
};

export const MembersApi = {
  list: (query?: { page?: number; size?: number; keyword?: string; salesId?: number }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/members`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/members`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}`, { method: 'DELETE' }),
  recharge: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}/recharge`, { method: 'POST', body }),
};

export const RechargesApi = {
  list: (query?: { page?: number; size?: number; memberId?: string; salesId?: number; shop?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/recharges`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/recharges/${id}`, { method: 'GET' }),
};

export const ConsumesApi = {
  list: (query?: { page?: number; size?: number; memberId?: string; salesId?: number; shop?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/consumes`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/consumes/${id}`, { method: 'GET' }),
};

export const RoomsApi = {
  list: (query?: { page?: number; size?: number; shop?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/rooms`, { method: 'GET', query }),
};

export const BookingsApi = {
  list: (query?: { page?: number; size?: number; date?: string; shop?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/bookings`, { method: 'GET', query }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/bookings`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/bookings/${id}`, { method: 'PUT', body }),
};

export const AuthApi = {
  h5Login: (body: { phone: string; password: string }) =>
    request<ApiResult<{ token: string }>>(`/api/auth/h5/login`, { method: 'POST', body }),
  adminLogin: (body: { username: string; password: string }) =>
    request<ApiResult<{ token: string }>>(`/api/auth/admin/login`, { method: 'POST', body }),
  logout: () => request<ApiResult<unknown>>(`/api/auth/logout`, { method: 'POST' }),
  refresh: (body: unknown) => request<ApiResult<{ token: string }>>(`/api/auth/refresh`, { method: 'POST', body }),
};
