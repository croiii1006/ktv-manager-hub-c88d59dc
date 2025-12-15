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

export const StaffsApi = {
  list: (query?: { page?: number; size?: number; keyword?: string; role?: 'ADMIN' | 'TEAM_LEADER' | 'SALESMAN' }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/staffs`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/staffs/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/staffs`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/staffs/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/staffs/${id}`, { method: 'DELETE' }),
};

export const MembersApi = {
  list: (query?: { page?: number; size?: number; keyword?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/members`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/members`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/members/${id}`, { method: 'DELETE' }),
  rechargeRecords: (memberId: number, query?: { page?: number; size?: number }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/members/${memberId}/recharge-records`, { method: 'GET', query }),
  consumeRecords: (memberId: number, query?: { page?: number; size?: number }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/members/${memberId}/consume-records`, { method: 'GET', query }),
};

export const RechargeAppliesApi = {
  list: (query?: { page?: number; size?: number; storeId?: number; staffId?: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/recharge-applies`, { method: 'GET', query }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/recharge-applies`, { method: 'POST', body }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/recharge-applies/${id}`, { method: 'GET' }),
  approve: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/recharge-applies/approve`, { method: 'POST', body }),
  reject: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/recharge-applies/reject`, { method: 'POST', body }),
};

export const ConsumeAppliesApi = {
  list: (query?: { page?: number; size?: number; storeId?: number; staffId?: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/consume-applies`, { method: 'GET', query }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/consume-applies`, { method: 'POST', body }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/consume-applies/${id}`, { method: 'GET' }),
  approve: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/consume-applies/approve`, { method: 'POST', body }),
  reject: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/consume-applies/reject`, { method: 'POST', body }),
};

export const ConsumeRecordsApi = {
  list: (query?: { page?: number; size?: number; storeId?: number; staffId?: number; memberId?: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'VOID' }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/consume-records`, { method: 'GET', query }),
};

export const RoomsApi = {
  list: (query?: { page?: number; size?: number; storeId?: number; keyword?: string }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/rooms`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/rooms/${id}`, { method: 'GET' }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/rooms`, { method: 'POST', body }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/rooms/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/rooms/${id}`, { method: 'DELETE' }),
};

export const ReservationsApi = {
  list: (query?: { page?: number; size?: number; storeId?: number; roomId?: number; staffId?: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/reservations`, { method: 'GET', query }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/reservations`, { method: 'POST', body }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/reservations/${id}`, { method: 'GET' }),
  approve: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/reservations/approve`, { method: 'POST', body }),
  reject: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/reservations/reject`, { method: 'POST', body }),
  cancel: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/reservations/cancel`, { method: 'POST', body }),
};

export const RoomSchedulesApi = {
  get: (query: { storeId: number; startDate: string; endDate: string }) =>
    request<ApiResult<unknown>>(`${ADMIN}/room-schedules`, { method: 'GET', query }),
};

export const MemberBindingsApi = {
  list: (query?: { page?: number; size?: number; memberId?: number; storeId?: number; staffId?: number }) =>
    request<ApiResult<PageResp<unknown>>>(`${ADMIN}/member-bindings`, { method: 'GET', query }),
  create: (body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/member-bindings`, { method: 'POST', body }),
  detail: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/member-bindings/${id}`, { method: 'GET' }),
  update: (id: number, body: unknown) => request<ApiResult<unknown>>(`${ADMIN}/member-bindings/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<unknown>>(`${ADMIN}/member-bindings/${id}`, { method: 'DELETE' }),
};

export const AuthApi = {
  h5Login: (body: { phone: string; password: string }) =>
    request<ApiResult<{ token: string }>>(`/api/auth/h5/login`, { method: 'POST', body }),
  adminLogin: (body: { username: string; password: string }) =>
    request<ApiResult<{ token: string }>>(`/api/auth/admin/login`, { method: 'POST', body }),
  logout: () => request<ApiResult<unknown>>(`/api/auth/logout`, { method: 'POST' }),
  refresh: (body: unknown) => request<ApiResult<{ token: string }>>(`/api/auth/refresh`, { method: 'POST', body }),
};
