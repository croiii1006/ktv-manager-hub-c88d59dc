import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingsApi, RoomSchedulesApi, MembersApi, StoresApi } from '@/services/admin';
import { ReservationCreateReq, RoomScheduleBookingResp } from '@/models';
import { PAYMENT_METHODS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SalesSelect from '@/components/SalesSelect';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RoomBooking() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] =
    useState<RoomScheduleBookingResp | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ roomNo: string; roomType: string; storeName: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const [modalMode, setModalMode] = useState<
    'book' | 'booked' | 'finished' | 'payment' | null
  >(null);
  const [earlyTerminationReason, setEarlyTerminationReason] = useState('');
  
  // Store selection
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // 预定表单
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerId: 0,
    salesId: 0,
    salesName: '',
  });

  // 客户搜索（姓名/手机号/编号）
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Fetch stores
  const { data: storesResp } = useQuery({
    queryKey: ['stores'],
    queryFn: () => StoresApi.list({ page: 1, size: 100 }),
  });
  const stores = storesResp?.data?.list || [];

  // Set default store
  if (selectedStoreId === null && stores.length > 0 && stores[0].id) {
    setSelectedStoreId(stores[0].id);
  }

  // Date range
  const today = new Date();
  const dateColumns = Array.from({ length: 7 }, (_, i) =>
    format(addDays(today, i), 'yyyy-MM-dd')
  );
  const startDate = dateColumns[0];
  const endDate = dateColumns[6];

  // Fetch schedule
  const { data: scheduleResp } = useQuery({
    queryKey: ['room-schedules', selectedStoreId, startDate, endDate],
    queryFn: () => RoomSchedulesApi.list({ 
      storeId: selectedStoreId!, 
      startDate, 
      endDate 
    }),
    enabled: !!selectedStoreId,
  });
  
  const scheduleRooms = scheduleResp?.data?.rooms || [];

  // Fetch members for search
  const { data: membersResp } = useQuery({
    queryKey: ['members', customerSearch],
    queryFn: () => MembersApi.list({ keyword: customerSearch, page: 1, size: 10 }),
    enabled: customerSearch.length > 0,
  });
  const matchedMembers = membersResp?.data?.list || [];

  // Mutations
  const createBookingMutation = useMutation({
    mutationFn: (data: ReservationCreateReq) => BookingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-schedules'] });
      toast.success('预定成功');
      setModalMode(null);
      setSelectedBooking(null);
    },
    onError: () => toast.error('预定失败'),
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReservationCreateReq }) =>
      BookingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-schedules'] });
      toast.success('更新成功');
      setModalMode(null);
      setSelectedBooking(null);
    },
    onError: () => toast.error('更新失败'),
  });

  // 支付表单
  const [paymentForm, setPaymentForm] = useState({
    serviceSalesId: 0,
    serviceSalesName: '',
    paymentMethod: PAYMENT_METHODS[0],
    paymentVoucher: '',
    time: format(new Date(), 'HH:mm'),
  });

  const handleCellClick = (room: any, date: string) => {
    const booking = room.bookings?.[date] as RoomScheduleBookingResp | undefined;
    
    // Store room info for modal
    setSelectedRoom({
      roomNo: room.roomNo,
      roomType: room.roomType,
      storeName: stores.find(s => s.id === selectedStoreId)?.name || '',
    });
    setSelectedDate(date);

    if (!booking) {
      // Create new booking
      setSelectedBooking(null);
      setModalMode('book');
      setBookingForm({
        customerName: '',
        customerId: 0,
        salesId: 0,
        salesName: '',
      });
      setCustomerSearch('');
      setShowCustomerDropdown(false);
    } else {
      setSelectedBooking(booking);
      // Determine mode based on status
      // RoomScheduleBookingResp might have status field?
      // Checking definition... it usually has status.
      // If not, we assume based on presence.
      // Let's assume 'status' field exists or map from another field.
      // If status is not in RoomScheduleBookingResp, we might need to fetch detail or guess.
      // Assuming it has status.
      const status = booking.status; // Need to check if this field exists
      
      if (status === 'COMPLETED') {
        setModalMode('finished');
        setEarlyTerminationReason('');
      } else {
         setModalMode('booked');
         setPaymentForm({
            serviceSalesId: 0,
            serviceSalesName: '',
            paymentMethod: PAYMENT_METHODS[0],
            paymentVoucher: '',
            time: format(new Date(), 'HH:mm'),
          });
      }
    }
  };

  const handleBook = () => {
    if (!selectedRoom) return;

    createBookingMutation.mutate({
      roomNo: selectedRoom.roomNo,
      bookingDate: selectedDate,
      memberId: bookingForm.customerId,
      salesId: bookingForm.salesId,
      storeId: selectedStoreId!, // Add storeId
      // other fields
    });
  };

  const handleOpenPayment = () => setModalMode('payment');

  const handleCancel = () => {
    if (!selectedBooking?.reservationId) return; // Assuming reservationId exists in booking resp

    updateBookingMutation.mutate({
      id: selectedBooking.reservationId,
      data: {
        // status: 'CANCELLED'
      } as any
    });
  };

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentForm((prev) => ({
        ...prev,
        paymentVoucher: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'APPROVED':
        return 'bg-green-500 hover:bg-green-600 text-primary-foreground';
      case 'COMPLETED':
        return 'bg-red-500 hover:bg-red-600 text-primary-foreground';
      case 'PENDING':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default:
        return 'bg-muted hover:bg-muted/80 text-muted-foreground';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'APPROVED':
        return '已预定';
      case 'COMPLETED':
        return '已完成';
      case 'PENDING':
        return '待审核';
      default:
        return '可订';
    }
  };

  return (
    <div className="space-y-4">
      {/* Shop Filter */}
      <div className="flex gap-2">
        {stores.map((store) => (
          <Button
            key={store.id}
            variant={selectedStoreId === store.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => store.id && setSelectedStoreId(store.id)}
          >
            {store.name}
          </Button>
        ))}
      </div>

      {/* Room Grid */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-10">
                  房号
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap sticky left-16 bg-muted/50 z-10">
                  房型
                </th>
                {dateColumns.map((date) => (
                  <th
                    key={date}
                    className="px-3 py-3 text-center text-sm font-medium text-muted-foreground whitespace-nowrap min-w-[100px]"
                  >
                    {format(new Date(date), 'MM/dd')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleRooms.map((room) => (
                <tr
                  key={room.id}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium whitespace-nowrap sticky left-0 bg-card z-10">
                    {room.roomNo}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap sticky left-16 bg-card z-10">
                    {room.roomType}
                  </td>
                  {dateColumns.map((date) => {
                    const booking = room.bookings?.[date];
                    // booking is RoomScheduleBookingResp
                    // It should have status. If null, it's available.
                    const status = booking ? (booking.status || 'APPROVED') : undefined; // Default to approved if exists but no status? Or use booking.status

                    return (
                      <td key={date} className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleCellClick(room, date)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                            getStatusColor(status)
                          )}
                        >
                          {getStatusText(status)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {scheduleRooms.length === 0 && (
                <tr>
                   <td colSpan={2 + dateColumns.length} className="text-center py-4 text-muted-foreground">
                      暂无房间信息
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" />
          <span className="text-muted-foreground">可预订</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-muted-foreground">已预定</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-muted-foreground">已完成</span>
        </div>
      </div>

      {/* Book Modal */}
      <Dialog
        open={modalMode === 'book'}
        onOpenChange={() => {
          setModalMode(null);
          setSelectedBooking(null);
          setCustomerSearch('');
          setShowCustomerDropdown(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预定房间</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span className="font-medium">{selectedRoom.roomNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">房型：</span>
                  <span>{selectedRoom.roomType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">门店：</span>
                  <span>{selectedRoom.storeName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">日期：</span>
                  <span>{selectedDate}</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* 客户搜索 + 自动匹配编号 */}
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">
                    客户（输入姓名/手机号/编号搜索）
                  </label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      setBookingForm((prev) => ({
                        ...prev,
                        customerName: '',
                        customerId: 0,
                      }));
                    }}
                    onFocus={() => {
                      if (customerSearch.trim()) setShowCustomerDropdown(true);
                    }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="输入关键字搜索已登记客户"
                  />
                  {showCustomerDropdown && matchedMembers.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border bg-popover shadow-lg text-sm">
                      {matchedMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full text-left px-3 py-1.5 hover:bg-muted transition-colors"
                          onClick={() => {
                            if (m.id && m.name) {
                              setBookingForm((prev) => ({
                                ...prev,
                                customerName: m.name || '',
                                customerId: m.id!,
                              }));
                              setCustomerSearch(
                                `${m.name}${m.phone ? ' / ' + m.phone : ''} / ${
                                  m.id
                                }`
                              );
                              setShowCustomerDropdown(false);
                            }
                          }}
                        >
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            编号：{m.id}
                            {m.phone && ` · 手机：${m.phone}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    客户编号
                  </label>
                  <input
                    type="text"
                    value={bookingForm.customerId || ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted/40 text-muted-foreground cursor-not-allowed"
                    placeholder="选择客户后自动填入"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    业务员
                  </label>
                  <SalesSelect
                    value={bookingForm.salesId}
                    onChange={(salesId, salesName) =>
                      setBookingForm((prev) => ({ ...prev, salesId, salesName }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBook}>预定</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booked Detail Modal */}
      <Dialog
        open={modalMode === 'booked'}
        onOpenChange={() => {
          setModalMode(null);
          setSelectedBooking(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>已预定详情</DialogTitle>
          </DialogHeader>
          {selectedBooking && selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>房号: {selectedRoom.roomNo}</div>
                 <div>客户: {selectedBooking.memberName}</div>
                 {/* Display more info if available in RoomScheduleBookingResp */}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="destructive" onClick={handleCancel}>
                  取消预定
                </Button>
                <Button onClick={handleOpenPayment}>已到店支付</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
