import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { useDataStore } from '@/contexts/DataStore';
import { RoomBooking as RoomBookingType, SHOPS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SalesSelect from '@/components/SalesSelect';
import { cn } from '@/lib/utils';

export default function RoomBooking() {
  const { rooms, roomBookings, setRoomBookings, members, salespersons } =
    useDataStore();
  const [selectedBooking, setSelectedBooking] =
    useState<RoomBookingType | null>(null);
  const [modalMode, setModalMode] = useState<
    'book' | 'booked' | 'finished' | null
  >(null);
  const [selectedShop, setSelectedShop] = useState<string>(SHOPS[0]);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerId: '',
    salesId: '',
    salesName: '',
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
      // Create new booking entry if doesn't exist
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

  const handleFinish = () => {
    if (!selectedBooking) return;

    setRoomBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: 'finished' as const } : b
      )
    );

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
                <Button onClick={handleFinish}>已到店支付</Button>
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
