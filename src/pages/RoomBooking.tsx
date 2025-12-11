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

export default function RoomBooking() {
  const { rooms, roomBookings, setRoomBookings, members, salespersons, setConsumeRecords, consumeRecords } =
    useDataStore();
  const [selectedBooking, setSelectedBooking] =
    useState<RoomBookingType | null>(null);
  const [modalMode, setModalMode] = useState<
    'book' | 'booked' | 'finished' | 'payment' | null
  >(null);
  const [selectedShop, setSelectedShop] = useState<string>(SHOPS[0]);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerId: '',
    salesId: '',
    salesName: '',
  });

  // Payment form state
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

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => room.shop === selectedShop);
  }, [rooms, selectedShop]);

  const getBooking = (
    roomNumber: string,
    date: string
  ): RoomBookingType | undefined => {
    return roomBookings.find(
      (b) => b.roomNumber === roomNumber && b.date === date
    );
  };

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
    }
  };

  const handleBook = () => {
    if (!selectedBooking) return;

    const updatedBooking: RoomBookingType = {
      ...selectedBooking,
      status: 'booked',
      customerName: bookingForm.customerName,
      customerId: bookingForm.customerId,
      salesId: bookingForm.salesId,
      salesName: bookingForm.salesName,
    };

    setRoomBookings((prev) => {
      const exists = prev.find((b) => b.id === updatedBooking.id);
      if (exists) {
        return prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
      }
      return [...prev, updatedBooking];
    });

    setSelectedBooking(null);
    setModalMode(null);
  };

  const handleOpenPayment = () => {
    setModalMode('payment');
  };

  const handleFinish = () => {
    if (!selectedBooking) return;

    const updatedBooking: RoomBookingType = {
      ...selectedBooking,
      status: 'finished' as const,
      serviceSalesId: paymentForm.serviceSalesId,
      serviceSalesName: paymentForm.serviceSalesName,
      paymentMethod: paymentForm.paymentMethod,
      paymentVoucher: paymentForm.paymentVoucher,
      time: paymentForm.time,
    };

    setRoomBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? updatedBooking : b
      )
    );

    // Find member info
    const member = members.find(m => m.memberId === selectedBooking.customerId);

    // Add consume record
    const newConsumeRecord = {
      id: `X${Date.now()}`,
      date: selectedBooking.date,
      time: paymentForm.time,
      memberId: selectedBooking.customerId || '',
      memberName: selectedBooking.customerName || '',
      cardType: member?.cardType || '非会员',
      phone: member?.phone || '',
      idNumber: member?.idNumber || '',
      amount: -selectedBooking.price,
      balance: member?.remainingRecharge || 0,
      giftBalance: member?.remainingGift || 0,
      salesId: selectedBooking.salesId || '',
      salesName: selectedBooking.salesName || '',
      serviceSalesId: paymentForm.serviceSalesId,
      serviceSalesName: paymentForm.serviceSalesName,
      shop: selectedBooking.shop,
      consumeType: '订房',
      content: `${selectedBooking.roomType}包厢消费`,
      remark: '',
      roomNumber: selectedBooking.roomNumber,
      bookingDate: selectedBooking.date,
      paymentMethod: paymentForm.paymentMethod,
      paymentVoucher: paymentForm.paymentVoucher,
    };

    setConsumeRecords((prev) => [...prev, newConsumeRecord]);

    setSelectedBooking(null);
    setModalMode(null);
  };

  const handleCancel = () => {
    if (!selectedBooking) return;

    setRoomBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: 'available' as const, customerName: undefined, customerId: undefined, salesId: undefined, salesName: undefined } : b
      )
    );

    setSelectedBooking(null);
    setModalMode(null);
  };

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentForm((prev) => ({
          ...prev,
          paymentVoucher: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
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
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted"></div>
          <span className="text-muted-foreground">可预订</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-muted-foreground">已预定</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-muted-foreground">已完成</span>
        </div>
      </div>

      {/* Book Modal */}
      <Dialog
        open={modalMode === 'book'}
        onOpenChange={() => {
          setModalMode(null);
          setSelectedBooking(null);
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
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    客户姓名
                  </label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="输入客户姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    客户编号
                  </label>
                  <input
                    type="text"
                    value={bookingForm.customerId}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        customerId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="输入客户编号"
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
                  <span className="font-medium text-green-600">¥{selectedBooking.price}</span>
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
                      setPaymentForm((prev) => ({ ...prev, serviceSalesId: salesId, serviceSalesName: salesName }))
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
                    {selectedBooking.serviceSalesName || '-'} {selectedBooking.serviceSalesId || ''}
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

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedBooking(null);
                  }}
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
