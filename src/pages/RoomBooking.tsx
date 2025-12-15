import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { useDataStore } from '@/contexts/DataStore';
import { RoomBooking as RoomBookingType, SHOPS, PAYMENT_METHODS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SalesSelect from '@/components/SalesSelect';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { ReservationsApi } from '@/services/admin';

export default function RoomBooking() {
  const {
    rooms,
    roomBookings,
    members,
    salespersons,
    consumeRecords,
    refreshReservations,
    refreshConsumeRecords,
  } = useDataStore();

  const [selectedBooking, setSelectedBooking] =
    useState<RoomBookingType | null>(null);
  const [modalMode, setModalMode] = useState<
    'book' | 'booked' | 'finished' | 'payment' | null
  >(null);
  const [earlyTerminationReason, setEarlyTerminationReason] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>(SHOPS[0]);

  // 预定表单
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerId: '',
    salesId: '',
    salesName: '',
  });

  // 客户搜索（姓名/手机号/编号）
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const matchedMembers = useMemo(() => {
    const kw = customerSearch.trim();
    if (!kw) return [];
    return members
      .filter((m) => {
        const name = m.name || '';
        const phone = m.phone || '';
        const id = m.memberId || '';
        return (
          name.includes(kw) ||
          phone.includes(kw) ||
          id.includes(kw)
        );
      })
      .slice(0, 10);
  }, [members, customerSearch]);

  // 支付表单
  const [paymentForm, setPaymentForm] = useState({
    serviceSalesId: '',
    serviceSalesName: '',
    paymentMethod: PAYMENT_METHODS[0],
    paymentVoucher: '',
    time: format(new Date(), 'HH:mm'),
  });

  const today = new Date();
  const dateColumns = Array.from({ length: 7 }, (_, i) =>
    format(addDays(today, i), 'yyyy-MM-dd')
  );

  const filteredRooms = useMemo(
    () => rooms.filter((room) => room.shop === selectedShop),
    [rooms, selectedShop]
  );

  const getBooking = (
    roomNumber: string,
    date: string
  ): RoomBookingType | undefined =>
    roomBookings.find(
      (b) => b.roomNumber === roomNumber && b.date === date
    );

  const handleCellClick = (roomNumber: string, date: string) => {
    const booking = getBooking(roomNumber, date);
    const room = rooms.find((r) => r.roomNumber === roomNumber);
    if (!room) return;

    if (!booking || booking.status === 'available') {
      const newBooking: RoomBookingType = booking || {
        id: `B-${roomNumber}-${date}`,
        roomNumber,
        roomType: room.roomType,
        shop: room.shop,
        date,
        status: 'available',
        price: room.price,
      };
      setSelectedBooking(newBooking);
      setModalMode('book');
      setBookingForm({
        customerName: '',
        customerId: '',
        salesId: '',
        salesName: '',
      });
      setCustomerSearch('');
      setShowCustomerDropdown(false);
    } else if (booking.status === 'booked') {
      setSelectedBooking(booking);
      setModalMode('booked');
      setPaymentForm({
        serviceSalesId: '',
        serviceSalesName: '',
        paymentMethod: PAYMENT_METHODS[0],
        paymentVoucher: '',
        time: format(new Date(), 'HH:mm'),
      });
    } else if (booking.status === 'finished') {
      setSelectedBooking(booking);
      setModalMode('finished');
      setEarlyTerminationReason('');
    }
  };

  const handleBook = async () => {
    if (!selectedBooking) return;

    try {
      await ReservationsApi.create({
        roomId: selectedBooking.roomNumber,
        roomType: selectedBooking.roomType,
        storeName: selectedBooking.shop,
        bookingDate: selectedBooking.date,
        customerName: bookingForm.customerName,
        customerId: bookingForm.customerId,
        salesId: bookingForm.salesId,
        salesName: bookingForm.salesName,
      });
      await refreshReservations();
    } catch (e) {
      console.error(e);
    }

    setSelectedBooking(null);
    setModalMode(null);
  };

  const handleOpenPayment = () => setModalMode('payment');

  const handleFinish = async () => {
    if (!selectedBooking) return;

    try {
      await ReservationsApi.approve({
        id: selectedBooking.id,
        serviceSalesId: paymentForm.serviceSalesId,
        serviceSalesName: paymentForm.serviceSalesName,
        paymentMethod: paymentForm.paymentMethod,
        paymentVoucher: paymentForm.paymentVoucher,
        time: paymentForm.time,
      });
      await refreshReservations();
      await refreshConsumeRecords();
    } catch (e) {
      console.error(e);
    }

    setSelectedBooking(null);
    setModalMode(null);
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;

    try {
      await ReservationsApi.cancel({ id: selectedBooking.id });
      await refreshReservations();
    } catch (e) {
      console.error(e);
    }

    setSelectedBooking(null);
    setModalMode(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-green-500 hover:bg-green-600 text-primary-foreground';
      case 'finished':
        return 'bg-red-500 hover:bg-red-600 text-primary-foreground';
      default:
        return 'bg-muted hover:bg-muted/80 text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked':
        return '已预定';
      case 'finished':
        return '已完成';
      default:
        return '可订';
    }
  };

  // “提前结束”=> 直接恢复可订，保留理由
  const handleEarlyTerminate = () => {
    if (!selectedBooking) return;
    if (!earlyTerminationReason.trim()) return;

    const updatedBooking: RoomBookingType = {
      ...selectedBooking,
      status: 'available' as const,
      customerName: undefined,
      customerId: undefined,
      salesId: undefined,
      salesName: undefined,
      serviceSalesId: undefined,
      serviceSalesName: undefined,
      paymentMethod: undefined,
      paymentVoucher: undefined,
      time: undefined,
      earlyTerminationReason: earlyTerminationReason.trim(),
    };

    setRoomBookings((prev) =>
      prev.map((b) =>
        b.id === updatedBooking.id ? updatedBooking : b
      )
    );

    setSelectedBooking(null);
    setModalMode(null);
    setEarlyTerminationReason('');
  };

  return (
    <div className="space-y-4">
      {/* Shop Filter */}
      <div className="flex gap-2">
        {SHOPS.map((shop) => (
          <Button
            key={shop}
            variant={selectedShop === shop ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedShop(shop)}
          >
            {shop}
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
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap sticky left-28 bg-muted/50 z-10">
                  店铺
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
              {filteredRooms.map((room) => (
                <tr
                  key={room.roomNumber}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium whitespace-nowrap sticky left-0 bg-card z-10">
                    {room.roomNumber}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap sticky left-16 bg-card z-10">
                    {room.roomType}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap sticky left-28 bg-card z-10">
                    {room.shop}
                  </td>
                  {dateColumns.map((date) => {
                    const booking = getBooking(room.roomNumber, date);
                    const status = booking?.status || 'available';

                    return (
                      <td key={date} className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleCellClick(room.roomNumber, date)}
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
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span className="font-medium">{selectedBooking.roomNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">房型：</span>
                  <span>{selectedBooking.roomType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">门店：</span>
                  <span>{selectedBooking.shop}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">日期：</span>
                  <span>{selectedBooking.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">价格：</span>
                  <span className="font-medium text-green-600">
                    ¥{selectedBooking.price}
                  </span>
                </div>
                {selectedBooking.earlyTerminationReason && (
                  <div className="col-span-2 text-xs text-amber-700 dark:text-amber-300 mt-2">
                    <span className="font-medium">上次提前结束理由：</span>
                    <span>{selectedBooking.earlyTerminationReason}</span>
                  </div>
                )}
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
                      // 清空当前选择，避免误用旧值
                      setBookingForm((prev) => ({
                        ...prev,
                        customerName: '',
                        customerId: '',
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
                          key={m.memberId}
                          type="button"
                          className="w-full text-left px-3 py-1.5 hover:bg-muted transition-colors"
                          onClick={() => {
                            setBookingForm((prev) => ({
                              ...prev,
                              customerName: m.name,
                              customerId: m.memberId,
                            }));
                            setCustomerSearch(
                              `${m.name}${m.phone ? ' / ' + m.phone : ''} / ${
                                m.memberId
                              }`
                            );
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">
                            编号：{m.memberId}
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
                    value={bookingForm.customerId}
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
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span className="font-medium">{selectedBooking.roomNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">房型：</span>
                  <span>{selectedBooking.roomType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">门店：</span>
                  <span>{selectedBooking.shop}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">日期：</span>
                  <span>{selectedBooking.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户姓名：</span>
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户编号：</span>
                  <span className="font-mono">{selectedBooking.customerId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">业务员：</span>
                  <span>
                    {selectedBooking.salesName} {selectedBooking.salesId}
                  </span>
                </div>
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

      {/* Payment Modal */}
      <Dialog
        open={modalMode === 'payment'}
        onOpenChange={() => {
          setModalMode('booked');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>到店支付</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-md">
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span className="font-medium">{selectedBooking.roomNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">价格：</span>
                  <span className="font-medium text-green-600">
                    ¥{selectedBooking.price}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户：</span>
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">日期：</span>
                  <span>{selectedBooking.date}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    服务业务员
                  </label>
                  <SalesSelect
                    value={paymentForm.serviceSalesId}
                    onChange={(salesId, salesName) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        serviceSalesId: salesId,
                        serviceSalesName: salesName,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    到店时间
                  </label>
                  <input
                    type="time"
                    value={paymentForm.time}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    支付方式
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    支付凭证
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md bg-background cursor-pointer hover:bg-muted transition-colors">
                      <Upload className="h-4 w-4" />
                      上传凭证
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleVoucherUpload}
                        className="hidden"
                      />
                    </label>
                    {paymentForm.paymentVoucher && (
                      <span className="text-sm text-green-600">已上传</span>
                    )}
                  </div>
                  {paymentForm.paymentVoucher && (
                    <img
                      src={paymentForm.paymentVoucher}
                      alt="凭证预览"
                      className="mt-2 max-h-32 rounded-md border border-border"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setModalMode('booked')}>
                  返回
                </Button>
                <Button onClick={handleFinish}>确认支付</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Finished Detail Modal */}
      <Dialog
        open={modalMode === 'finished'}
        onOpenChange={() => {
          setModalMode(null);
          setSelectedBooking(null);
          setEarlyTerminationReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>已完成详情</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span className="font-medium">{selectedBooking.roomNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">房型：</span>
                  <span>{selectedBooking.roomType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">门店：</span>
                  <span>{selectedBooking.shop}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">日期：</span>
                  <span>{selectedBooking.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">到店时间：</span>
                  <span>{selectedBooking.time || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户姓名：</span>
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户编号：</span>
                  <span className="font-mono">{selectedBooking.customerId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">业务员：</span>
                  <span>
                    {selectedBooking.salesName} {selectedBooking.salesId}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">服务业务员：</span>
                  <span>
                    {selectedBooking.serviceSalesName || '-'}{' '}
                    {selectedBooking.serviceSalesId || ''}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">支付方式：</span>
                  <span>{selectedBooking.paymentMethod || '-'}</span>
                </div>
              </div>

              {selectedBooking.paymentVoucher && (
                <div>
                  <span className="text-sm text-muted-foreground">支付凭证：</span>
                  <img
                    src={selectedBooking.paymentVoucher}
                    alt="支付凭证"
                    className="mt-2 max-h-48 rounded-md border border-border"
                  />
                </div>
              )}

              {/* 提前结束理由输入区域 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  提前结束理由 <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={earlyTerminationReason}
                  onChange={(e) => setEarlyTerminationReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
                  placeholder="请输入提前结束的理由，确认后该房间将恢复为可订状态"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedBooking(null);
                    setEarlyTerminationReason('');
                  }}
                >
                  关闭
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEarlyTerminate}
                  disabled={!earlyTerminationReason.trim()}
                >
                  提前结束并恢复可订
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
