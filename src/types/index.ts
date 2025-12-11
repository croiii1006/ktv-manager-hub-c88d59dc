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
  voucher?: string;
  giftProductRemark?: string;
}

export interface ConsumeRecord {
  id: string;
  date: string;
  time?: string;
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
  serviceSalesId?: string;
  serviceSalesName?: string;
  shop: string;
  consumeType: string;
  content: string;
  remark: string;
  roomNumber?: string;
  bookingDate?: string;
  paymentMethod?: string;
  paymentVoucher?: string;
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
  status: 'available' | 'booked' | 'finished' | 'early_terminated';
  customerName?: string;
  customerId?: string;
  salesId?: string;
  salesName?: string;
  serviceSalesId?: string;
  serviceSalesName?: string;
  price: number;
  time?: string;
  paymentMethod?: string;
  paymentVoucher?: string;
  earlyTerminationReason?: string;
}

export const SHOPS = ['上海店', '武汉店'];
export const CARD_TYPES = ['非会员', '白金卡', '黄金卡', '铂金卡', '黑钻卡'];
export const ROOM_TYPES = ['至尊', '大包', '中包', '小包'];
export const PAYMENT_METHODS = ['现金', '余额', '赠送余额', '团购'];

// Card type thresholds based on total recharge amount
export const CARD_TYPE_THRESHOLDS = [
  { type: '黑钻卡', minAmount: 50000 },
  { type: '铂金卡', minAmount: 20000 },
  { type: '黄金卡', minAmount: 10000 },
  { type: '白金卡', minAmount: 5000 },
  { type: '非会员', minAmount: 0 },
];

export function calculateCardType(totalRecharge: number): string {
  for (const threshold of CARD_TYPE_THRESHOLDS) {
    if (totalRecharge >= threshold.minAmount) {
      return threshold.type;
    }
  }
  return '非会员';
}
