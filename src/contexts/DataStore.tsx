import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  TeamLeader,
  Salesperson,
  Member,
  RechargeRecord,
  ConsumeRecord,
  Room,
  RoomBooking,
  SHOPS,
  ROOM_TYPES,
} from '@/types';
import { format, addDays } from 'date-fns';
import { StaffsApi, MembersApi, RoomsApi, ConsumeRecordsApi, ReservationsApi, RechargeAppliesApi } from '@/services/admin';
import type { ApiResult, PageResp } from '@/types/api';

interface DataStoreContextType {
  teamLeaders: TeamLeader[];
  setTeamLeaders: React.Dispatch<React.SetStateAction<TeamLeader[]>>;
  salespersons: Salesperson[];
  setSalespersons: React.Dispatch<React.SetStateAction<Salesperson[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  rechargeRecords: RechargeRecord[];
  setRechargeRecords: React.Dispatch<React.SetStateAction<RechargeRecord[]>>;
  consumeRecords: ConsumeRecord[];
  setConsumeRecords: React.Dispatch<React.SetStateAction<ConsumeRecord[]>>;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  roomBookings: RoomBooking[];
  setRoomBookings: React.Dispatch<React.SetStateAction<RoomBooking[]>>;
  generateLeaderId: () => string;
  generateSalesId: () => string;
  generateMemberId: () => string;
  refreshMembers: () => Promise<void>;
  refreshReservations: () => Promise<void>;
  refreshConsumeRecords: () => Promise<void>;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

// Generate initial mock data
const initialTeamLeaders: TeamLeader[] = [
  { leaderId: 'C0000001', name: '张队长', phone: '13800001111', shop: '上海店', wechat: 'zhang_leader' },
  { leaderId: 'C0000002', name: '李队长', phone: '13800002222', shop: '上海店', wechat: 'li_leader' },
  { leaderId: 'C0000003', name: '王队长', phone: '13800003333', shop: '武汉店', wechat: 'wang_leader' },
];

const initialSalespersons: Salesperson[] = [
  { salesId: 'Y0000001', name: '张三', phone: '13900001111', wechat: 'zhangsan', shop: '上海店', leaderId: 'C0000001', leaderName: '张队长' },
  { salesId: 'Y0000002', name: '李四', phone: '13900002222', wechat: 'lisi', shop: '上海店', leaderId: 'C0000002', leaderName: '李队长' },
  { salesId: 'Y0000003', name: '王五', phone: '13900003333', wechat: 'wangwu', shop: '武汉店', leaderId: 'C0000003', leaderName: '王队长' },
];

const initialMembers: Member[] = [
  { memberId: 'A0000001', name: '陈小明', phone: '13700001111', cardType: '白金卡', idNumber: '310101199001011234', registerDate: '2024-01-15', remainingRecharge: 5000, remainingGift: 1000, salesId: 'Y0000001', salesName: '张三' },
  { memberId: 'A0000002', name: '刘芳芳', phone: '13700002222', cardType: '黄金卡', idNumber: '310101199202022345', registerDate: '2024-02-20', remainingRecharge: 3000, remainingGift: 500, salesId: 'Y0000001', salesName: '张三' },
  { memberId: 'A0000003', name: '赵大力', phone: '13700003333', cardType: '铂金卡', idNumber: '310101199303033456', registerDate: '2024-03-10', remainingRecharge: 8000, remainingGift: 2000, salesId: 'Y0000002', salesName: '李四' },
  { memberId: 'A0000004', name: '孙丽丽', phone: '13700004444', cardType: '黑钻卡', idNumber: '310101199404044567', registerDate: '2024-04-05', remainingRecharge: 15000, remainingGift: 5000, salesId: 'Y0000002', salesName: '李四' },
  { memberId: 'A0000005', name: '周建国', phone: '13700005555', cardType: '非会员', idNumber: '310101199505055678', registerDate: '2024-05-01', remainingRecharge: 0, remainingGift: 0, salesId: 'Y0000003', salesName: '王五' },
];

const initialRechargeRecords: RechargeRecord[] = [
  { id: 'R001', date: '2024-12-01', memberId: 'A0000001', memberName: '陈小明', cardType: '白金卡', phone: '13700001111', idNumber: '310101199001011234', amount: 5000, giftAmount: 1000, salesId: 'Y0000001', salesName: '张三', shop: '上海店', remark: '首次充值', balance: 5000, giftBalance: 1000 },
  { id: 'R002', date: '2024-12-02', memberId: 'A0000002', memberName: '刘芳芳', cardType: '黄金卡', phone: '13700002222', idNumber: '310101199202022345', amount: 3000, giftAmount: 500, salesId: 'Y0000001', salesName: '张三', shop: '上海店', remark: '', balance: 3000, giftBalance: 500 },
  { id: 'R003', date: '2024-12-03', memberId: 'A0000003', memberName: '赵大力', cardType: '铂金卡', phone: '13700003333', idNumber: '310101199303033456', amount: 8000, giftAmount: 2000, salesId: 'Y0000002', salesName: '李四', shop: '上海店', remark: '升级铂金卡', balance: 8000, giftBalance: 2000 },
  { id: 'R004', date: '2024-12-04', memberId: 'A0000004', memberName: '孙丽丽', cardType: '黑钻卡', phone: '13700004444', idNumber: '310101199404044567', amount: 15000, giftAmount: 5000, salesId: 'Y0000002', salesName: '李四', shop: '上海店', remark: 'VIP客户', balance: 15000, giftBalance: 5000 },
];

const initialConsumeRecords: ConsumeRecord[] = [
  { id: 'X001', date: '2024-12-02', time: '14:30', memberId: 'A0000001', memberName: '陈小明', cardType: '白金卡', phone: '13700001111', idNumber: '310101199001011234', amount: -500, balance: 4500, giftBalance: 1000, salesId: 'Y0000001', salesName: '张三', serviceSalesId: 'Y0000002', serviceSalesName: '李四', shop: '上海店', consumeType: '订房', content: '大包厢消费', remark: '', roomNumber: '888', bookingDate: '2024-12-02', paymentMethod: '余额', paymentVoucher: '' },
  { id: 'X002', date: '2024-12-03', time: '19:00', memberId: 'A0000002', memberName: '刘芳芳', cardType: '黄金卡', phone: '13700002222', idNumber: '310101199202022345', amount: -300, balance: 2700, giftBalance: 500, salesId: 'Y0000001', salesName: '张三', serviceSalesId: 'Y0000001', serviceSalesName: '张三', shop: '上海店', consumeType: '订房', content: '中包厢消费', remark: '生日派对', roomNumber: '666', bookingDate: '2024-12-03', paymentMethod: '现金', paymentVoucher: '' },
  { id: 'X003', date: '2024-12-04', time: '20:15', memberId: 'A0000003', memberName: '赵大力', cardType: '铂金卡', phone: '13700003333', idNumber: '310101199303033456', amount: -1000, balance: 7000, giftBalance: 2000, salesId: 'Y0000002', salesName: '李四', serviceSalesId: 'Y0000003', serviceSalesName: '王五', shop: '上海店', consumeType: '订房', content: '至尊包厢消费', remark: '商务接待', roomNumber: '999', bookingDate: '2024-12-04', paymentMethod: '团购', paymentVoucher: '' },
];

const initialRooms: Room[] = [
  { roomNumber: '999', roomType: '至尊', shop: '上海店', price: 2888 },
  { roomNumber: '888', roomType: '大包', shop: '上海店', price: 1888 },
  { roomNumber: '777', roomType: '大包', shop: '上海店', price: 1888 },
  { roomNumber: '666', roomType: '中包', shop: '上海店', price: 1288 },
  { roomNumber: '555', roomType: '中包', shop: '上海店', price: 1288 },
  { roomNumber: '444', roomType: '小包', shop: '上海店', price: 888 },
  { roomNumber: '998', roomType: '至尊', shop: '上海店', price: 2888 },
  { roomNumber: '887', roomType: '大包', shop: '上海店', price: 1888 },
  { roomNumber: '776', roomType: '中包', shop: '上海店', price: 1288 },
];

// Generate initial room bookings for 7 days
const generateInitialBookings = (): RoomBooking[] => {
  const bookings: RoomBooking[] = [];
  const today = new Date();
  
  initialRooms.forEach(room => {
    for (let i = 0; i < 7; i++) {
      const date = format(addDays(today, i), 'yyyy-MM-dd');
      const random = Math.random();
      let status: 'available' | 'booked' | 'finished' = 'available';
      let booking: RoomBooking = {
        id: `B-${room.roomNumber}-${date}`,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        shop: room.shop,
        date,
        status: 'available',
        price: room.price,
      };

      if (i < 2 && random > 0.5) {
        status = 'finished';
        booking = {
          ...booking,
          status,
          customerName: initialMembers[Math.floor(Math.random() * initialMembers.length)].name,
          customerId: initialMembers[Math.floor(Math.random() * initialMembers.length)].memberId,
          salesId: initialSalespersons[Math.floor(Math.random() * initialSalespersons.length)].salesId,
          salesName: initialSalespersons[Math.floor(Math.random() * initialSalespersons.length)].name,
        };
      } else if (random > 0.7) {
        status = 'booked';
        booking = {
          ...booking,
          status,
          customerName: initialMembers[Math.floor(Math.random() * initialMembers.length)].name,
          customerId: initialMembers[Math.floor(Math.random() * initialMembers.length)].memberId,
          salesId: initialSalespersons[Math.floor(Math.random() * initialSalespersons.length)].salesId,
          salesName: initialSalespersons[Math.floor(Math.random() * initialSalespersons.length)].name,
        };
      }

      bookings.push(booking);
    }
  });

  return bookings;
};

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);
  const [consumeRecords, setConsumeRecords] = useState<ConsumeRecord[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [leadersRes, salesRes, membersRes, roomsRes, consumesRes] = await Promise.all([
          StaffsApi.list({ page: 1, size: 100, role: 'TEAM_LEADER' }),
          StaffsApi.list({ page: 1, size: 100, role: 'SALESMAN' }),
          MembersApi.list({ page: 1, size: 100 }),
          RoomsApi.list({ page: 1, size: 100 }),
          ConsumeRecordsApi.list({ page: 1, size: 200 }),
        ]);

        const leaders = ((leadersRes as ApiResult<PageResp<any>>).data?.list || []).map((s: any) => ({
          leaderId: String(s.staffNo || s.id || s.leaderId || ''),
          name: s.name || '',
          phone: s.phone || '',
          shop: s.shop || s.storeName || '',
          wechat: s.wechat || '',
        })) as TeamLeader[];
        if (leaders.length) setTeamLeaders(leaders);

        const sales = ((salesRes as ApiResult<PageResp<any>>).data?.list || []).map((s: any) => ({
          salesId: String(s.staffNo || s.id || s.salesId || ''),
          name: s.name || '',
          phone: s.phone || '',
          wechat: s.wechat || '',
          shop: s.shop || s.storeName || '',
          leaderId: String(s.leaderId || s.leaderStaffNo || ''),
          leaderName: s.leaderName || '',
        })) as Salesperson[];
        if (sales.length) setSalespersons(sales);

        const mems = ((membersRes as ApiResult<PageResp<any>>).data?.list || []).map((m: any) => ({
          memberId: String(m.memberId || m.id || ''),
          name: m.name || '',
          phone: m.phone || '',
          cardType: m.cardType || '非会员',
          idNumber: m.idNumber || '',
          registerDate: m.registerDate || m.createdAt?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd'),
          remainingRecharge: Number(m.remainingRecharge ?? 0),
          remainingGift: Number(m.remainingGift ?? 0),
          salesId: String(m.salesId || ''),
          salesName: m.salesName || '',
        })) as Member[];
        if (mems.length) setMembers(mems);

        const rms = ((roomsRes as ApiResult<PageResp<any>>).data?.list || []).map((r: any) => ({
          roomNumber: String(r.roomNumber || r.id || ''),
          roomType: r.roomType || '',
          shop: r.shop || r.storeName || '',
          price: Number(r.price ?? 0),
        })) as Room[];
        if (rms.length) setRooms(rms);

        const cons = ((consumesRes as ApiResult<PageResp<any>>).data?.list || []).map((c: any) => ({
          id: String(c.id || ''),
          date: c.date || c.bookingDate || format(new Date(), 'yyyy-MM-dd'),
          time: c.time || undefined,
          memberId: String(c.memberId || ''),
          memberName: c.memberName || '',
          cardType: c.cardType || '非会员',
          phone: c.phone || '',
          idNumber: c.idNumber || '',
          amount: Number(c.amount ?? 0),
          balance: Number(c.balance ?? 0),
          giftBalance: Number(c.giftBalance ?? 0),
          salesId: String(c.salesId || ''),
          salesName: c.salesName || '',
          serviceSalesId: c.serviceSalesId ? String(c.serviceSalesId) : undefined,
          serviceSalesName: c.serviceSalesName || undefined,
          shop: c.shop || c.storeName || '',
          consumeType: c.consumeType || '订房',
          content: c.content || '',
          remark: c.remark || '',
          roomNumber: c.roomNumber || undefined,
          bookingDate: c.bookingDate || undefined,
          paymentMethod: c.paymentMethod || undefined,
          paymentVoucher: c.paymentVoucher || undefined,
        })) as ConsumeRecord[];
        if (cons.length) setConsumeRecords(cons);

        try {
          const resvRes = await ReservationsApi.list({ page: 1, size: 200 });
          const resv = ((resvRes as ApiResult<PageResp<any>>).data?.list || []).map((b: any) => ({
            id: String(b.id || ''),
            roomNumber: String(b.roomNumber || b.roomId || ''),
            roomType: b.roomType || '',
            shop: b.shop || b.storeName || '',
            date: b.date || b.bookingDate || format(new Date(), 'yyyy-MM-dd'),
            status: (b.status || 'available') as RoomBooking['status'],
            customerName: b.customerName || undefined,
            customerId: b.customerId ? String(b.customerId) : undefined,
            salesId: b.salesId ? String(b.salesId) : undefined,
            salesName: b.salesName || undefined,
            price: Number(b.price ?? 0),
            time: b.time || undefined,
            paymentMethod: b.paymentMethod || undefined,
            paymentVoucher: b.paymentVoucher || undefined,
            earlyTerminationReason: b.earlyTerminationReason || undefined,
          })) as RoomBooking[];
          if (resv.length) setRoomBookings(resv);
        } catch {}
      } catch {
        // silent fallback to initial mock data
      }
    };
    load();
  }, []);

  const refreshMembers = async () => {
    try {
      const membersRes = await MembersApi.list({ page: 1, size: 100 });
      const mems = ((membersRes as ApiResult<PageResp<any>>).data?.list || []).map((m: any) => ({
        memberId: String(m.memberId || m.id || ''),
        name: m.name || '',
        phone: m.phone || '',
        cardType: m.cardType || '非会员',
        idNumber: m.idNumber || '',
        registerDate: m.registerDate || m.createdAt?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd'),
        remainingRecharge: Number(m.remainingRecharge ?? 0),
        remainingGift: Number(m.remainingGift ?? 0),
        salesId: String(m.salesId || ''),
        salesName: m.salesName || '',
      })) as Member[];
      setMembers(mems);
    } catch {}
  };

  const refreshReservations = async () => {
    try {
      const resvRes = await ReservationsApi.list({ page: 1, size: 200 });
      const resv = ((resvRes as ApiResult<PageResp<any>>).data?.list || []).map((b: any) => ({
        id: String(b.id || ''),
        roomNumber: String(b.roomNumber || b.roomId || ''),
        roomType: b.roomType || '',
        shop: b.shop || b.storeName || '',
        date: b.date || b.bookingDate || format(new Date(), 'yyyy-MM-dd'),
        status: (b.status || 'available') as RoomBooking['status'],
        customerName: b.customerName || undefined,
        customerId: b.customerId ? String(b.customerId) : undefined,
        salesId: b.salesId ? String(b.salesId) : undefined,
        salesName: b.salesName || undefined,
        price: Number(b.price ?? 0),
        time: b.time || undefined,
        paymentMethod: b.paymentMethod || undefined,
        paymentVoucher: b.paymentVoucher || undefined,
        earlyTerminationReason: b.earlyTerminationReason || undefined,
      })) as RoomBooking[];
      setRoomBookings(resv);
    } catch {}
  };

  const refreshConsumeRecords = async () => {
    try {
      const consumesRes = await ConsumeRecordsApi.list({ page: 1, size: 200 });
      const cons = ((consumesRes as ApiResult<PageResp<any>>).data?.list || []).map((c: any) => ({
        id: String(c.id || ''),
        date: c.date || c.bookingDate || format(new Date(), 'yyyy-MM-dd'),
        time: c.time || undefined,
        memberId: String(c.memberId || ''),
        memberName: c.memberName || '',
        cardType: c.cardType || '非会员',
        phone: c.phone || '',
        idNumber: c.idNumber || '',
        amount: Number(c.amount ?? 0),
        balance: Number(c.balance ?? 0),
        giftBalance: Number(c.giftBalance ?? 0),
        salesId: String(c.salesId || ''),
        salesName: c.salesName || '',
        serviceSalesId: c.serviceSalesId ? String(c.serviceSalesId) : undefined,
        serviceSalesName: c.serviceSalesName || undefined,
        shop: c.shop || c.storeName || '',
        consumeType: c.consumeType || '订房',
        content: c.content || '',
        remark: c.remark || '',
        roomNumber: c.roomNumber || undefined,
        bookingDate: c.bookingDate || undefined,
        paymentMethod: c.paymentMethod || undefined,
        paymentVoucher: c.paymentVoucher || undefined,
      })) as ConsumeRecord[];
      setConsumeRecords(cons);
    } catch {}
  };

  const generateLeaderId = () => {
    const maxId = teamLeaders.reduce((max, leader) => {
      const num = parseInt(leader.leaderId.slice(1));
      return num > max ? num : max;
    }, 0);
    return `C${String(maxId + 1).padStart(7, '0')}`;
  };

  const generateSalesId = () => {
    const maxId = salespersons.reduce((max, sp) => {
      const num = parseInt(sp.salesId.slice(1));
      return num > max ? num : max;
    }, 0);
    return `Y${String(maxId + 1).padStart(7, '0')}`;
  };

  const generateMemberId = () => {
    const maxId = members.reduce((max, m) => {
      const num = parseInt(m.memberId.slice(1));
      return num > max ? num : max;
    }, 0);
    return `A${String(maxId + 1).padStart(7, '0')}`;
  };

  return (
    <DataStoreContext.Provider
      value={{
        teamLeaders,
        setTeamLeaders,
        salespersons,
        setSalespersons,
        members,
        setMembers,
        rechargeRecords,
        setRechargeRecords,
        consumeRecords,
        setConsumeRecords,
        rooms,
        setRooms,
        roomBookings,
        setRoomBookings,
        generateLeaderId,
        generateSalesId,
        generateMemberId,
        refreshMembers,
        refreshReservations,
        refreshConsumeRecords,
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (context === undefined) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
}
