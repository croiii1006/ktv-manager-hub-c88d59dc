import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RoomConfig, TimeSlotPricing, ROOM_CATEGORIES } from '@/types';

const defaultPricing: TimeSlotPricing = {
  standardPrice: 0,
  groupBuyPrice: 0,
  memberPricing: {
    goldCard: 0,
    platinumCard: 0,
    purpleDiamond: 0,
    blackDiamond: 0,
  },
};

const initialRoomConfigs: RoomConfig[] = [
  {
    id: 'R001',
    roomName: 'PARTY1',
    category: 'flagship',
    description: '旗舰派对房，可容纳20人',
    daytime6h: {
      standardPrice: 2888,
      groupBuyPrice: 2588,
      memberPricing: { goldCard: 2454, platinumCard: 2310, purpleDiamond: 2166, blackDiamond: 2022 },
    },
    daytime3h: {
      standardPrice: 1688,
      groupBuyPrice: 1488,
      memberPricing: { goldCard: 1435, platinumCard: 1350, purpleDiamond: 1266, blackDiamond: 1182 },
    },
    isActive: true,
  },
  {
    id: 'R002',
    roomName: 'PARTY2',
    category: 'supreme',
    description: '至尊包房，可容纳15人',
    daytime6h: {
      standardPrice: 2288,
      groupBuyPrice: 1988,
      memberPricing: { goldCard: 1945, platinumCard: 1830, purpleDiamond: 1716, blackDiamond: 1602 },
    },
    daytime3h: {
      standardPrice: 1388,
      groupBuyPrice: 1188,
      memberPricing: { goldCard: 1180, platinumCard: 1110, purpleDiamond: 1041, blackDiamond: 972 },
    },
    isActive: true,
  },
  {
    id: 'R003',
    roomName: 'VIP888',
    category: 'luxury',
    description: '豪华商务房，可容纳10人',
    daytime6h: {
      standardPrice: 1888,
      groupBuyPrice: 1688,
      memberPricing: { goldCard: 1605, platinumCard: 1510, purpleDiamond: 1416, blackDiamond: 1322 },
    },
    daytime3h: {
      standardPrice: 1088,
      groupBuyPrice: 888,
      memberPricing: { goldCard: 925, platinumCard: 870, purpleDiamond: 816, blackDiamond: 762 },
    },
    isActive: false,
  },
];

export default function RoomManagement() {
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>(initialRoomConfigs);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomConfig | null>(null);
  const [activeTab, setActiveTab] = useState('daytime6h');

  // Form state
  const [formData, setFormData] = useState<Omit<RoomConfig, 'id'>>({
    roomName: '',
    category: 'flagship',
    description: '',
    daytime6h: { ...defaultPricing },
    daytime3h: { ...defaultPricing },
    isActive: true,
  });

  const filteredRooms = roomConfigs.filter(
    (room) =>
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ROOM_CATEGORIES.find((c) => c.value === room.category)?.label.includes(searchTerm)
  );

  const getCategoryLabel = (category: string) => {
    return ROOM_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const getMemberPriceRange = (room: RoomConfig) => {
    const prices = [
      room.daytime6h.memberPricing.goldCard,
      room.daytime6h.memberPricing.blackDiamond,
      room.daytime3h.memberPricing.goldCard,
      room.daytime3h.memberPricing.blackDiamond,
    ].filter((p) => p > 0);
    if (prices.length === 0) return '-';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `¥${min} - ¥${max}`;
  };

  const handleOpenModal = (room?: RoomConfig) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        roomName: room.roomName,
        category: room.category,
        description: room.description,
        daytime6h: { ...room.daytime6h, memberPricing: { ...room.daytime6h.memberPricing } },
        daytime3h: { ...room.daytime3h, memberPricing: { ...room.daytime3h.memberPricing } },
        isActive: room.isActive,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        roomName: '',
        category: 'flagship',
        description: '',
        daytime6h: { ...defaultPricing, memberPricing: { ...defaultPricing.memberPricing } },
        daytime3h: { ...defaultPricing, memberPricing: { ...defaultPricing.memberPricing } },
        isActive: true,
      });
    }
    setActiveTab('daytime6h');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSave = () => {
    if (!formData.roomName.trim()) return;

    if (editingRoom) {
      setRoomConfigs((prev) =>
        prev.map((r) => (r.id === editingRoom.id ? { ...formData, id: editingRoom.id } : r))
      );
    } else {
      const newId = `R${String(roomConfigs.length + 1).padStart(3, '0')}`;
      setRoomConfigs((prev) => [...prev, { ...formData, id: newId }]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    setRoomConfigs((prev) => prev.filter((r) => r.id !== id));
  };

  const handleQuickDiscount = (slot: 'daytime6h' | 'daytime3h') => {
    const basePrice = formData[slot].standardPrice;
    if (basePrice <= 0) return;

    setFormData((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        memberPricing: {
          goldCard: Math.round(basePrice * 0.85),
          platinumCard: Math.round(basePrice * 0.8),
          purpleDiamond: Math.round(basePrice * 0.75),
          blackDiamond: Math.round(basePrice * 0.7),
        },
      },
    }));
  };

  const updatePricing = (slot: 'daytime6h' | 'daytime3h', field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [field]: value,
      },
    }));
  };

  const updateMemberPricing = (
    slot: 'daytime6h' | 'daytime3h',
    tier: keyof typeof defaultPricing.memberPricing,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        memberPricing: {
          ...prev[slot].memberPricing,
          [tier]: value,
        },
      },
    }));
  };

  const renderPricingForm = (slot: 'daytime6h' | 'daytime3h') => (
    <div className="space-y-6">
      {/* Standard and Group Buy Prices */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>标准价格 (非会员)</Label>
          <Input
            type="number"
            value={formData[slot].standardPrice || ''}
            onChange={(e) => updatePricing(slot, 'standardPrice', Number(e.target.value))}
            placeholder="输入标准价格"
          />
        </div>
        <div className="space-y-2">
          <Label>团购价格</Label>
          <Input
            type="number"
            value={formData[slot].groupBuyPrice || ''}
            onChange={(e) => updatePricing(slot, 'groupBuyPrice', Number(e.target.value))}
            placeholder="输入团购价格"
          />
        </div>
      </div>

      {/* Member Pricing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">会员定价</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDiscount(slot)}
            className="gap-1"
          >
            <Percent className="h-4 w-4" />
            快速折扣 (85/80/75/70%)
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">黄金卡 (85%)</Label>
            <Input
              type="number"
              value={formData[slot].memberPricing.goldCard || ''}
              onChange={(e) => updateMemberPricing(slot, 'goldCard', Number(e.target.value))}
              placeholder="黄金卡价格"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">铂金卡 (80%)</Label>
            <Input
              type="number"
              value={formData[slot].memberPricing.platinumCard || ''}
              onChange={(e) => updateMemberPricing(slot, 'platinumCard', Number(e.target.value))}
              placeholder="铂金卡价格"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">紫钻卡 (75%)</Label>
            <Input
              type="number"
              value={formData[slot].memberPricing.purpleDiamond || ''}
              onChange={(e) => updateMemberPricing(slot, 'purpleDiamond', Number(e.target.value))}
              placeholder="紫钻卡价格"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">黑钻卡 (70%)</Label>
            <Input
              type="number"
              value={formData[slot].memberPricing.blackDiamond || ''}
              onChange={(e) => updateMemberPricing(slot, 'blackDiamond', Number(e.target.value))}
              placeholder="黑钻卡价格"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">房间管理</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索房间..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            添加房间
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>房间名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>默认价格</TableHead>
              <TableHead>会员价格区间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  暂无房间数据
                </TableCell>
              </TableRow>
            ) : (
              filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.roomName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryLabel(room.category)}</Badge>
                  </TableCell>
                  <TableCell>¥{room.daytime6h.standardPrice}</TableCell>
                  <TableCell>{getMemberPriceRange(room)}</TableCell>
                  <TableCell>
                    <Badge variant={room.isActive ? 'default' : 'secondary'}>
                      {room.isActive ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(room)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(room.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? '编辑房间' : '添加房间'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>房间名称</Label>
                  <Input
                    value={formData.roomName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, roomName: e.target.value }))}
                    placeholder="如 PARTY1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v: RoomConfig['category']) =>
                      setFormData((prev) => ({ ...prev, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="房间描述信息..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
                />
                <Label>启用状态</Label>
              </div>
            </div>

            {/* Section 2: Pricing Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">定价配置</h3>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daytime6h">白天 (6小时)</TabsTrigger>
                  <TabsTrigger value="daytime3h">白天 (3小时)</TabsTrigger>
                </TabsList>
                <TabsContent value="daytime6h" className="mt-4">
                  {renderPricingForm('daytime6h')}
                </TabsContent>
                <TabsContent value="daytime3h" className="mt-4">
                  {renderPricingForm('daytime3h')}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleCloseModal}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
