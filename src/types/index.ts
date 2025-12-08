export interface TeamLeader {
  leaderId: string;
  name: string;
  phone: string;
  shop: string;
  wechat: string;
}

export interface Salesperson {
  salesId: string;
  name: string;
  phone: string;
  wechat: string;
  shop: string;
  leaderId: string;
  leaderName: string;
}

export interface Member {
  memberId: string;
  name: string;
  phone: string;
  cardType: string;
  idNumber: string;
  registerDate: string;
  remainingRecharge: number;
  remainingGift: number;
  salesId: string;
  salesName: string;
}

export interface RechargeRecord {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  cardType: string;
  phone: string;
  idNumber: string;
  amount: number;
  giftAmount: number;
  salesId: string;
  salesName: string;
  shop: string;
  remark: string;
  balance: number;
  giftBalance: number;
}

export interface ConsumeRecord {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  cardType: string;
  phone: string;
  idNumber: string;
  amount: number;
  balance: number;
  giftBalance: number;
  salesId: string;
  salesName: string;
  shop: string;
  consumeType: string;
  content: string;
  remark: string;
  roomNumber?: string;
  bookingDate?: string;
}

export interface Room {
  roomNumber: string;
  roomType: string;
  shop: string;
  price: number;
}

export interface RoomBooking {
  id: string;
  roomNumber: string;
  roomType: string;
  shop: string;
  date: string;
  status: 'available' | 'booked' | 'finished';
  customerName?: string;
  customerId?: string;
  salesId?: string;
  salesName?: string;
  price: number;
}

export const SHOPS = ['淮海路店', '上海店', '武汉店', '北京店', '广州店'];
export const CARD_TYPES = ['非会员', '白金卡', '黄金卡', '铂金卡', '黑钻卡'];
export const ROOM_TYPES = ['至尊', '大包', '中包', '小包'];
