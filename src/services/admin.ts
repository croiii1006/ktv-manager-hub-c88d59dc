import { request } from '@/services/http';
import type { ApiResult } from '@/types/api';
import type {
  StoreResp,
  StoreReq,
  PageResultStoreResp,
  StaffResp,
  StaffCreateReq,
  StaffUpdateReq,
  PageResultStaffResp,
  MemberResp,
  MemberReq,
  PageResultMemberResp,
  RechargeResp,
  PageResultRechargeResp,
  RechargeApplyCreateReq,
  ConsumeRecordResp,
  PageResultConsumeRecordResp,
  PageResultRoomResp,
  ReservationResp,
  ReservationCreateReq,
  ReservationCancelReq,
  PageResultReservationResp,
  RoomScheduleResp,
} from '@/models';

const ADMIN = '/api/admin';

export const StoresApi = {
  list: (query?: { page?: number; size?: number; keyword?: string }) =>
    request<ApiResult<PageResultStoreResp>>(`${ADMIN}/stores`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<StoreResp>>(`${ADMIN}/stores/${id}`, { method: 'GET' }),
  create: (body: StoreReq) => request<ApiResult<StoreResp>>(`${ADMIN}/stores`, { method: 'POST', body }),
  update: (id: number, body: StoreReq) => request<ApiResult<StoreResp>>(`${ADMIN}/stores/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<void>>(`${ADMIN}/stores/${id}`, { method: 'DELETE' }),
};

export const TeamLeadersApi = {
  list: (query?: { page?: number; size?: number; keyword?: string }) =>
    request<ApiResult<PageResultStaffResp>>(`${ADMIN}/staffs`, { 
      method: 'GET', 
      query: { ...query, role: 'TEAM_LEADER' } 
    }),
  detail: (id: number) => request<ApiResult<StaffResp>>(`${ADMIN}/staffs/${id}`, { method: 'GET' }),
  create: (body: StaffCreateReq) => request<ApiResult<StaffResp>>(`${ADMIN}/staffs`, { method: 'POST', body }),
  update: (id: number, body: StaffUpdateReq) => request<ApiResult<StaffResp>>(`${ADMIN}/staffs/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<void>>(`${ADMIN}/staffs/${id}`, { method: 'DELETE' }),
};

export const SalespersonsApi = {
  list: (query?: { page?: number; size?: number; keyword?: string; shop?: string }) =>
    request<ApiResult<PageResultStaffResp>>(`${ADMIN}/staffs`, { 
      method: 'GET', 
      query: { ...query, role: 'SALESMAN' } 
    }),
  detail: (id: number) => request<ApiResult<StaffResp>>(`${ADMIN}/staffs/${id}`, { method: 'GET' }),
  create: (body: StaffCreateReq) => request<ApiResult<StaffResp>>(`${ADMIN}/staffs`, { method: 'POST', body }),
  update: (id: number, body: StaffUpdateReq) => request<ApiResult<StaffResp>>(`${ADMIN}/staffs/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<void>>(`${ADMIN}/staffs/${id}`, { method: 'DELETE' }),
};

export const MembersApi = {
  list: (query?: { page?: number; size?: number; keyword?: string; salesId?: number }) =>
    request<ApiResult<PageResultMemberResp>>(`${ADMIN}/members`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<MemberResp>>(`${ADMIN}/members/${id}`, { method: 'GET' }),
  create: (body: MemberReq) => request<ApiResult<MemberResp>>(`${ADMIN}/members`, { method: 'POST', body }),
  update: (id: number, body: MemberReq) => request<ApiResult<MemberResp>>(`${ADMIN}/members/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<ApiResult<void>>(`${ADMIN}/members/${id}`, { method: 'DELETE' }),
  recharge: (id: number, body: RechargeApplyCreateReq) => request<ApiResult<void>>(`${ADMIN}/recharge-applies`, { method: 'POST', body }),
};

export const RechargesApi = {
  list: (query?: { page?: number; size?: number; memberId?: string; salesId?: number; shop?: string }) =>
    request<ApiResult<PageResultRechargeResp>>(`${ADMIN}/recharge-applies`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<RechargeResp>>(`${ADMIN}/recharge-applies/${id}`, { method: 'GET' }),
};

export const ConsumesApi = {
  list: (query?: { page?: number; size?: number; memberId?: string; salesId?: number; shop?: string }) =>
    request<ApiResult<PageResultConsumeRecordResp>>(`${ADMIN}/consume-records`, { method: 'GET', query }),
  detail: (id: number) => request<ApiResult<ConsumeRecordResp>>(`${ADMIN}/consume-records/${id}`, { method: 'GET' }),
};

export const RoomsApi = {
  list: (query?: { page?: number; size?: number; shop?: string }) =>
    request<ApiResult<PageResultRoomResp>>(`${ADMIN}/rooms`, { method: 'GET', query }),
};

export const BookingsApi = {
  list: (query?: { page?: number; size?: number; date?: string; shop?: string }) =>
    request<ApiResult<PageResultReservationResp>>(`${ADMIN}/reservations`, { method: 'GET', query }),
  create: (body: ReservationCreateReq) => request<ApiResult<ReservationResp>>(`${ADMIN}/reservations`, { method: 'POST', body }),
  update: (id: number, body: ReservationCreateReq) => request<ApiResult<ReservationResp>>(`${ADMIN}/reservations/${id}`, { method: 'PUT', body }),
  cancel: (id: number, body: ReservationCancelReq) => request<ApiResult<void>>(`${ADMIN}/reservations/${id}/cancel`, { method: 'POST', body }),
};

export const RoomSchedulesApi = {
  list: (query: { storeId: number; startDate: string; endDate: string }) =>
    request<ApiResult<RoomScheduleResp>>(`${ADMIN}/room-schedules`, { method: 'GET', query }),
};

export const AuthApi = {
  h5Login: (body: { phone: string; password: string }) =>
    request<ApiResult<{ token: string }>>(`/api/auth/h5/login`, { method: 'POST', body }),
  adminLogin: (body: { username: string; password: string }) =>
    request<ApiResult<{ token: string }>>(`/api/auth/admin/login`, { method: 'POST', body }),
  logout: () => request<ApiResult<void>>(`/api/auth/logout`, { method: 'POST' }),
  refresh: (body: unknown) => request<ApiResult<{ token: string }>>(`/api/auth/refresh`, { method: 'POST', body }),
};
