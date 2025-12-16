import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { StoresApi, RoomSchedulesApi, BookingsApi, MembersApi, SalespersonsApi } from '@/services/admin';
import { RoomScheduleResp, RoomScheduleRoomResp, AdminDirectReservationReq } from '@/models';
import ShopSelect from '@/components/ShopSelect';
import SalesSelect from '@/components/SalesSelect';
import MemberSelect from '@/components/MemberSelect';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RoomBooking() {
  const queryClient = useQueryClient();
  const [selectedStore, setSelectedStore] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const dateColumns = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => format(addDays(startDate, i), 'yyyy-MM-dd'));
  }, [startDate]);

  const [selectedSlot, setSelectedSlot] = useState<{ room: RoomScheduleRoomResp; date: string } | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<number | undefined>(undefined);
  const [memberId, setMemberId] = useState<number | undefined>(undefined);
  const [applyStaffId, setApplyStaffId] = useState<number | undefined>(undefined);
  const [guestCount, setGuestCount] = useState<number | undefined>(undefined);
  const [remark, setRemark] = useState<string>('');

  const { data: storesResp } = useQuery({
    queryKey: ['stores'],
    queryFn: () => StoresApi.list({ page: 1, size: 100 }),
  });

  const { data: scheduleResp, isLoading } = useQuery({
    queryKey: ['room-schedules', selectedStore, dateColumns[0], dateColumns[dateColumns.length - 1]],
    queryFn: () =>
      RoomSchedulesApi.list({
        storeId: selectedStore!,
        startDate: dateColumns[0],
        endDate: dateColumns[dateColumns.length - 1],
      }),
    enabled: !!selectedStore,
  });
  const storeList = storesResp?.data?.list || [];
  const storeMap = new Map(storeList.map((s) => [s.id, s.name]));
  const storeIds = storeList.map((s) => s.id).filter((id): id is number => typeof id === 'number');
  const schedulesAll = useQueries({
    queries: storeIds.map((id) => ({
      queryKey: ['room-schedules', id, dateColumns[0], dateColumns[dateColumns.length - 1]],
      queryFn: () =>
        RoomSchedulesApi.list({
          storeId: id,
          startDate: dateColumns[0],
          endDate: dateColumns[dateColumns.length - 1],
        }),
      enabled: !selectedStore && storeIds.length > 0,
    })),
  });
  const roomsAll = schedulesAll.flatMap((q) => ((q.data as RoomScheduleResp | undefined)?.data?.rooms || [])) as RoomScheduleRoomResp[];
  const rooms = (selectedStore ? (scheduleResp?.data?.rooms || []) : roomsAll) as RoomScheduleRoomResp[];
  const loadingAll = schedulesAll.length > 0 && schedulesAll.some((q) => q.isLoading);
  const loading = selectedStore ? isLoading : loadingAll;

  const adminDirectMutation = useMutation({
    mutationFn: async (body: AdminDirectReservationReq) => {
      const resp = await BookingsApi.adminDirect(body);
      if (!resp.success) {
        const error = new Error(resp.message || '预定失败');
        throw error;
      }
      return resp.data;
    },
    onSuccess: () => {
      toast.success('预定成功（免审核）');
      queryClient.invalidateQueries({ queryKey: ['room-schedules'] });
      setSelectedSlot(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '预定失败';
      toast.error(msg);
      console.error(err);
    },
  });

  const getStatusColor = (state?: string) => {
    switch (state) {
      case 'BOOKED':
        return 'bg-green-500 hover:bg-green-600 text-primary-foreground';
      case 'FINISHED':
        return 'bg-red-500 hover:bg-red-600 text-primary-foreground';
      case 'PENDING':
        return 'bg-amber-500 hover:bg-amber-600 text-primary-foreground';
      default:
        return 'bg-muted hover:bg-muted/80 text-muted-foreground';
    }
  };

  const getStatusText = (state?: string) => {
    switch (state) {
      case 'BOOKED':
        return '已预定';
      case 'FINISHED':
        return '已完成';
      case 'PENDING':
        return '待审核';
      default:
        return '可订';
    }
  };

  const { data: reservationDetailResp, isLoading: detailLoading } = useQuery({
    queryKey: ['reservation-detail', selectedReservationId],
    queryFn: () => BookingsApi.detail(selectedReservationId!),
    enabled: !!selectedReservationId,
  });

  const memberDetailEnabled = !!reservationDetailResp?.data?.memberId && !!selectedReservationId;
  const staffDetailEnabled = !!reservationDetailResp?.data?.staffId && !!selectedReservationId;

  const { data: memberDetailResp } = useQuery({
    queryKey: ['member-detail', reservationDetailResp?.data?.memberId],
    queryFn: () => MembersApi.detail(reservationDetailResp!.data!.memberId!),
    enabled: memberDetailEnabled,
  });

  const { data: staffDetailResp } = useQuery({
    queryKey: ['staff-detail', reservationDetailResp?.data?.staffId],
    queryFn: () => SalespersonsApi.detail(reservationDetailResp!.data!.staffId!),
    enabled: staffDetailEnabled,
  });

  const getReservationStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 rounded text-xs bg-amber-500 text-primary-foreground">待审核</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 rounded text-xs bg-green-500 text-primary-foreground">已通过</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 rounded text-xs bg-red-500 text-primary-foreground">已拒绝</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">已取消</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">未知</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-64">
            <ShopSelect value={selectedStore} returnId={true} onChange={setSelectedStore} className="w-full" />
          </div>
          <span className="text-sm text-muted-foreground">{dateColumns[0]} 至 {dateColumns[dateColumns.length - 1]}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setStartDate(addDays(startDate, -7))}>上一周</Button>
          <Button variant="outline" size="sm" onClick={() => setStartDate(addDays(startDate, 7))}>下一周</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-10">店铺</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap sticky left-20 bg-muted/50 z-10">房号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">房型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">价格</th>
                {dateColumns.map((date) => (
                  <th key={date} className="px-3 py-3 text-center text-sm font-medium text-muted-foreground whitespace-nowrap min-w-[100px]">
                    {format(new Date(date), 'MM/dd')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3 + dateColumns.length} className="px-4 py-6 text-center text-sm text-muted-foreground">加载中...</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={3 + dateColumns.length} className="px-4 py-6 text-center text-sm text-muted-foreground">暂无房态数据</td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap sticky left-0 bg-card z-10">{storeMap.get(room.storeId as number) || room.storeId}</td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap sticky left-20 bg-card z-10">{room.roomNo}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{room.roomType}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">¥{room.price}</td>
                    {dateColumns.map((date) => {
                      const b = room.bookings?.[date];
                      const state = b?.state || 'AVAILABLE';
                      return (
                        <td key={date} className="px-3 py-2 text-center">
                          <button
                            onClick={() => {
                              if (state === 'AVAILABLE') {
                                setSelectedSlot({ room, date });
                              } else if ((state === 'BOOKED' || state === 'PENDING') && b?.reservationId) {
                                setSelectedReservationId(b.reservationId);
                              }
                            }}
                            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', getStatusColor(state))}
                          >
                            {getStatusText(state)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-muted" /><span className="text-muted-foreground">可预订</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-500" /><span className="text-muted-foreground">待审核</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500" /><span className="text-muted-foreground">已预定</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500" /><span className="text-muted-foreground">已完成</span></div>
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>后台直接预定（免审核）</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                <div><span className="text-muted-foreground">房号：</span><span className="font-medium">{selectedSlot.room.roomNo}</span></div>
                <div><span className="text-muted-foreground">房型：</span><span>{selectedSlot.room.roomType}</span></div>
                <div><span className="text-muted-foreground">价格：</span><span className="font-medium text-green-600">¥{selectedSlot.room.price}</span></div>
                <div><span className="text-muted-foreground">日期：</span><span>{selectedSlot.date}</span></div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">选择会员</label>
                  <MemberSelect value={memberId} onChange={(id) => setMemberId(id)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">申请业务员（可选）</label>
                  <SalesSelect value={applyStaffId} onChange={(id) => setApplyStaffId(id)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">预计人数（可选）</label>
                  <input
                    type="number"
                    value={guestCount ?? ''}
                    onChange={(e) => setGuestCount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="填写预计人数"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">备注（可选）</label>
                  <input
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="备注信息"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSlot(null)}>取消</Button>
                <Button
                  onClick={() => {
                    if (!selectedSlot || !memberId) {
                      toast.error('请选择会员');
                      return;
                    }
                    const body: AdminDirectReservationReq = {
                      storeId: selectedStore ?? (selectedSlot.room.storeId as number),
                      roomId: selectedSlot.room.id!,
                      memberId: memberId,
                      staffId: applyStaffId,
                      reserveDate: selectedSlot.date,
                      guestCount: guestCount,
                      remark: remark || undefined,
                    };
                    adminDirectMutation.mutate(body);
                  }}
                  disabled={adminDirectMutation.isPending}
                >
                  {adminDirectMutation.isPending ? '处理中...' : '确认预定'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedReservationId} onOpenChange={() => setSelectedReservationId(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预定详情</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">加载中...</div>
          ) : (
            <div className="space-y-4">
              {reservationDetailResp?.data ? (
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                  <div><span className="text-muted-foreground">预订单号：</span><span className="font-medium">{reservationDetailResp.data.reserveNo}</span></div>
                  <div><span className="text-muted-foreground">状态：</span>{getReservationStatusBadge(reservationDetailResp.data.status)}</div>
                  <div><span className="text-muted-foreground">会员：</span><span className="font-medium">{memberDetailResp?.data?.name ?? '-'}</span></div>
                  <div><span className="text-muted-foreground">业务员：</span><span className="font-medium">{staffDetailResp?.data?.name ?? '-'}</span></div>
                  <div><span className="text-muted-foreground">预定日期：</span><span>{reservationDetailResp.data.reserveDate ? format(new Date(reservationDetailResp.data.reserveDate), 'yyyy-MM-dd') : '-'}</span></div>
                  <div><span className="text-muted-foreground">人数：</span><span>{reservationDetailResp.data.guestCount ?? '-'}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">备注：</span><span>{reservationDetailResp.data.remark ?? '-'}</span></div>
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">未找到预定详情</div>
              )}
              <DialogFooter>
                <Button onClick={() => setSelectedReservationId(undefined)} variant="outline">关闭</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
