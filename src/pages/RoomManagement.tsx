import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Percent, Store } from 'lucide-react';
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
import { 
  WuhanRoomConfig, 
  ShanghaiRoomConfig, 
  WuhanTimeSlotPricing,
  ROOM_CATEGORIES 
} from '@/types';

type StoreType = '武汉店' | '上海店';

const defaultWuhanPricing: WuhanTimeSlotPricing = {
  standardPrice: 0,
  groupBuyPrice: 0,
  memberPrice: 0,
};

const initialWuhanRooms: WuhanRoomConfig[] = [
  {
    id: 'W001',
    roomName: 'PARTY1',
    category: 'flagship',
    description: '旗舰派对房，可容纳20人',
    daytime6h: { standardPrice: 2888, groupBuyPrice: 2588, memberPrice: 2200 },
    daytime3h: { standardPrice: 1688, groupBuyPrice: 1488, memberPrice: 1300 },
    isActive: true,
    shop: '武汉店',
  },
  {
    id: 'W002',
    roomName: '888',
    category: 'supreme',
    description: '至尊包房，可容纳15人',
    daytime6h: { standardPrice: 2288, groupBuyPrice: 1988, memberPrice: 1800 },
    daytime3h: { standardPrice: 1388, groupBuyPrice: 1188, memberPrice: 1100 },
    isActive: true,
    shop: '武汉店',
  },
  {
    id: 'W003',
    roomName: 'VIP1',
    category: 'luxury',
    description: '豪华商务房，可容纳10人',
    daytime6h: { standardPrice: 1888, groupBuyPrice: 1688, memberPrice: 1500 },
    daytime3h: { standardPrice: 1088, groupBuyPrice: 888, memberPrice: 800 },
    isActive: true,
    shop: '武汉店',
  },
];

const initialShanghaiRooms: ShanghaiRoomConfig[] = [
  {
    id: 'S001',
    roomName: 'V01',
    category: 'flagship',
    description: '旗舰包房',
    nonMemberPrice: 3888,
    groupBuyPrice: 3288,
    goldCardPrice: 3305,
    platinumCardPrice: 3110,
    purpleDiamondPrice: 2916,
    blackDiamondPrice: 2722,
    isActive: true,
    shop: '上海店',
  },
  {
    id: 'S002',
    roomName: 'V02',
    category: 'supreme',
    description: '至尊包房',
    nonMemberPrice: 2888,
    groupBuyPrice: 2488,
    goldCardPrice: 2455,
    platinumCardPrice: 2310,
    purpleDiamondPrice: 2166,
    blackDiamondPrice: 2022,
    isActive: true,
    shop: '上海店',
  },
  {
    id: 'S003',
    roomName: 'V05',
    category: 'luxury',
    description: '豪华包房',
    nonMemberPrice: 1888,
    groupBuyPrice: 1588,
    goldCardPrice: 1605,
    platinumCardPrice: 1510,
    purpleDiamondPrice: 1416,
    blackDiamondPrice: 1322,
    isActive: true,
    shop: '上海店',
  },
];

export default function RoomManagement() {
  const [selectedStore, setSelectedStore] = useState<StoreType>('武汉店');
  const [wuhanRooms, setWuhanRooms] = useState<WuhanRoomConfig[]>(initialWuhanRooms);
  const [shanghaiRooms, setShanghaiRooms] = useState<ShanghaiRoomConfig[]>(initialShanghaiRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<WuhanRoomConfig | ShanghaiRoomConfig | null>(null);
  const [activeTab, setActiveTab] = useState('daytime6h');

  // Wuhan form state
  const [wuhanFormData, setWuhanFormData] = useState<Omit<WuhanRoomConfig, 'id' | 'shop'>>({
    roomName: '',
    category: 'flagship',
    description: '',
    daytime6h: { ...defaultWuhanPricing },
    daytime3h: { ...defaultWuhanPricing },
    isActive: true,
  });

  // Shanghai form state
  const [shanghaiFormData, setShanghaiFormData] = useState<Omit<ShanghaiRoomConfig, 'id' | 'shop'>>({
    roomName: '',
    category: 'flagship',
    description: '',
    nonMemberPrice: 0,
    groupBuyPrice: 0,
    goldCardPrice: 0,
    platinumCardPrice: 0,
    purpleDiamondPrice: 0,
    blackDiamondPrice: 0,
    isActive: true,
  });

  const currentRooms = selectedStore === '武汉店' ? wuhanRooms : shanghaiRooms;

  const filteredRooms = currentRooms.filter(
    (room) =>
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ROOM_CATEGORIES.find((c) => c.value === room.category)?.label.includes(searchTerm)
  );

  const getCategoryLabel = (category: string) => {
    return ROOM_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const handleOpenModal = (room?: WuhanRoomConfig | ShanghaiRoomConfig) => {
    if (room) {
      setEditingRoom(room);
      if (selectedStore === '武汉店' && 'daytime6h' in room) {
        setWuhanFormData({
          roomName: room.roomName,
          category: room.category,
          description: room.description,
          daytime6h: { ...room.daytime6h },
          daytime3h: { ...room.daytime3h },
          isActive: room.isActive,
        });
      } else if (selectedStore === '上海店' && 'nonMemberPrice' in room) {
        setShanghaiFormData({
          roomName: room.roomName,
          category: room.category,
          description: room.description,
          nonMemberPrice: room.nonMemberPrice,
          groupBuyPrice: room.groupBuyPrice,
          goldCardPrice: room.goldCardPrice,
          platinumCardPrice: room.platinumCardPrice,
          purpleDiamondPrice: room.purpleDiamondPrice,
          blackDiamondPrice: room.blackDiamondPrice,
          isActive: room.isActive,
        });
      }
    } else {
      setEditingRoom(null);
      if (selectedStore === '武汉店') {
        setWuhanFormData({
          roomName: '',
          category: 'flagship',
          description: '',
          daytime6h: { ...defaultWuhanPricing },
          daytime3h: { ...defaultWuhanPricing },
          isActive: true,
        });
      } else {
        setShanghaiFormData({
          roomName: '',
          category: 'flagship',
          description: '',
          nonMemberPrice: 0,
          groupBuyPrice: 0,
          goldCardPrice: 0,
          platinumCardPrice: 0,
          purpleDiamondPrice: 0,
          blackDiamondPrice: 0,
          isActive: true,
        });
      }
    }
    setActiveTab('daytime6h');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSave = () => {
    if (selectedStore === '武汉店') {
      if (!wuhanFormData.roomName.trim()) return;
      if (editingRoom) {
        setWuhanRooms((prev) =>
          prev.map((r) => (r.id === editingRoom.id ? { ...wuhanFormData, id: editingRoom.id, shop: '武汉店' as const } : r))
        );
      } else {
        const newId = `W${String(wuhanRooms.length + 1).padStart(3, '0')}`;
        setWuhanRooms((prev) => [...prev, { ...wuhanFormData, id: newId, shop: '武汉店' as const }]);
      }
    } else {
      if (!shanghaiFormData.roomName.trim()) return;
      if (editingRoom) {
        setShanghaiRooms((prev) =>
          prev.map((r) => (r.id === editingRoom.id ? { ...shanghaiFormData, id: editingRoom.id, shop: '上海店' as const } : r))
        );
      } else {
        const newId = `S${String(shanghaiRooms.length + 1).padStart(3, '0')}`;
        setShanghaiRooms((prev) => [...prev, { ...shanghaiFormData, id: newId, shop: '上海店' as const }]);
      }
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (selectedStore === '武汉店') {
      setWuhanRooms((prev) => prev.filter((r) => r.id !== id));
    } else {
      setShanghaiRooms((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleQuickDiscount = () => {
    const basePrice = shanghaiFormData.nonMemberPrice;
    if (basePrice <= 0) return;
    setShanghaiFormData((prev) => ({
      ...prev,
      goldCardPrice: Math.round(basePrice * 0.85),
      platinumCardPrice: Math.round(basePrice * 0.8),
      purpleDiamondPrice: Math.round(basePrice * 0.75),
      blackDiamondPrice: Math.round(basePrice * 0.7),
    }));
  };

  const renderWuhanPricingForm = (slot: 'daytime6h' | 'daytime3h') => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>标准价格</Label>
          <Input
            type="number"
            value={wuhanFormData[slot].standardPrice || ''}
            onChange={(e) =>
              setWuhanFormData((prev) => ({
                ...prev,
                [slot]: { ...prev[slot], standardPrice: Number(e.target.value) },
              }))
            }
            placeholder="标准价格"
          />
        </div>
        <div className="space-y-2">
          <Label>团购价格</Label>
          <Input
            type="number"
            value={wuhanFormData[slot].groupBuyPrice || ''}
            onChange={(e) =>
              setWuhanFormData((prev) => ({
                ...prev,
                [slot]: { ...prev[slot], groupBuyPrice: Number(e.target.value) },
              }))
            }
            placeholder="团购价格"
          />
        </div>
        <div className="space-y-2">
          <Label>会员价格</Label>
          <Input
            type="number"
            value={wuhanFormData[slot].memberPrice || ''}
            onChange={(e) =>
              setWuhanFormData((prev) => ({
                ...prev,
                [slot]: { ...prev[slot], memberPrice: Number(e.target.value) },
              }))
            }
            placeholder="会员价格"
          />
        </div>
      </div>
    </div>
  );

  const renderShanghaiPricingForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>非会员价格</Label>
          <Input
            type="number"
            value={shanghaiFormData.nonMemberPrice || ''}
            onChange={(e) =>
              setShanghaiFormData((prev) => ({ ...prev, nonMemberPrice: Number(e.target.value) }))
            }
            placeholder="非会员价格"
          />
        </div>
        <div className="space-y-2">
          <Label>团购价格</Label>
          <Input
            type="number"
            value={shanghaiFormData.groupBuyPrice || ''}
            onChange={(e) =>
              setShanghaiFormData((prev) => ({ ...prev, groupBuyPrice: Number(e.target.value) }))
            }
            placeholder="团购价格"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">会员等级定价</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleQuickDiscount}
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
              value={shanghaiFormData.goldCardPrice || ''}
              onChange={(e) =>
                setShanghaiFormData((prev) => ({ ...prev, goldCardPrice: Number(e.target.value) }))
              }
              placeholder="黄金卡价格"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">铂金卡 (80%)</Label>
            <Input
              type="number"
              value={shanghaiFormData.platinumCardPrice || ''}
              onChange={(e) =>
                setShanghaiFormData((prev) => ({ ...prev, platinumCardPrice: Number(e.target.value) }))
              }
              placeholder="铂金卡价格"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">紫钻卡 (75%)</Label>
            <Input
              type="number"
              value={shanghaiFormData.purpleDiamondPrice || ''}
              onChange={(e) =>
                setShanghaiFormData((prev) => ({ ...prev, purpleDiamondPrice: Number(e.target.value) }))
              }
              placeholder="紫钻卡价格"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">黑钻卡 (70%)</Label>
            <Input
              type="number"
              value={shanghaiFormData.blackDiamondPrice || ''}
              onChange={(e) =>
                setShanghaiFormData((prev) => ({ ...prev, blackDiamondPrice: Number(e.target.value) }))
              }
              placeholder="黑钻卡价格"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderWuhanTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>房间名称</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>6H标准价</TableHead>
          <TableHead>6H团购价</TableHead>
          <TableHead>6H会员价</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredRooms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              暂无房间数据
            </TableCell>
          </TableRow>
        ) : (
          (filteredRooms as WuhanRoomConfig[]).map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.roomName}</TableCell>
              <TableCell>
                <Badge variant="outline">{getCategoryLabel(room.category)}</Badge>
              </TableCell>
              <TableCell>¥{room.daytime6h.standardPrice}</TableCell>
              <TableCell>¥{room.daytime6h.groupBuyPrice}</TableCell>
              <TableCell>¥{room.daytime6h.memberPrice}</TableCell>
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
  );

  const renderShanghaiTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>房间名称</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>非会员价</TableHead>
          <TableHead>团购价</TableHead>
          <TableHead>黄金卡</TableHead>
          <TableHead>铂金卡</TableHead>
          <TableHead>紫钻卡</TableHead>
          <TableHead>黑钻卡</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredRooms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
              暂无房间数据
            </TableCell>
          </TableRow>
        ) : (
          (filteredRooms as ShanghaiRoomConfig[]).map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.roomName}</TableCell>
              <TableCell>
                <Badge variant="outline">{getCategoryLabel(room.category)}</Badge>
              </TableCell>
              <TableCell>¥{room.nonMemberPrice}</TableCell>
              <TableCell>¥{room.groupBuyPrice}</TableCell>
              <TableCell>¥{room.goldCardPrice}</TableCell>
              <TableCell>¥{room.platinumCardPrice}</TableCell>
              <TableCell>¥{room.purpleDiamondPrice}</TableCell>
              <TableCell>¥{room.blackDiamondPrice}</TableCell>
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
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">房间管理</h1>
        <div className="flex items-center gap-4">
          {/* Store Switcher */}
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedStore} onValueChange={(v: StoreType) => setSelectedStore(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="武汉店">武汉店</SelectItem>
                <SelectItem value="上海店">上海店</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      {/* Store indicator badge */}
      <div className="mb-4">
        <Badge variant="outline" className="text-sm">
          当前门店: {selectedStore}
        </Badge>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {selectedStore === '武汉店' ? renderWuhanTable() : renderShanghaiTable()}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? '编辑房间' : '添加房间'} - {selectedStore}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>房间名称</Label>
                  <Input
                    value={selectedStore === '武汉店' ? wuhanFormData.roomName : shanghaiFormData.roomName}
                    onChange={(e) => {
                      if (selectedStore === '武汉店') {
                        setWuhanFormData((prev) => ({ ...prev, roomName: e.target.value }));
                      } else {
                        setShanghaiFormData((prev) => ({ ...prev, roomName: e.target.value }));
                      }
                    }}
                    placeholder={selectedStore === '武汉店' ? '如 PARTY1, 888, VIP1' : '如 V01, V02, V05'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={selectedStore === '武汉店' ? wuhanFormData.category : shanghaiFormData.category}
                    onValueChange={(v: WuhanRoomConfig['category']) => {
                      if (selectedStore === '武汉店') {
                        setWuhanFormData((prev) => ({ ...prev, category: v }));
                      } else {
                        setShanghaiFormData((prev) => ({ ...prev, category: v }));
                      }
                    }}
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
                  value={selectedStore === '武汉店' ? wuhanFormData.description : shanghaiFormData.description}
                  onChange={(e) => {
                    if (selectedStore === '武汉店') {
                      setWuhanFormData((prev) => ({ ...prev, description: e.target.value }));
                    } else {
                      setShanghaiFormData((prev) => ({ ...prev, description: e.target.value }));
                    }
                  }}
                  placeholder="房间描述信息..."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedStore === '武汉店' ? wuhanFormData.isActive : shanghaiFormData.isActive}
                  onCheckedChange={(v) => {
                    if (selectedStore === '武汉店') {
                      setWuhanFormData((prev) => ({ ...prev, isActive: v }));
                    } else {
                      setShanghaiFormData((prev) => ({ ...prev, isActive: v }));
                    }
                  }}
                />
                <Label>启用状态</Label>
              </div>
            </div>

            {/* Section 2: Pricing Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border pb-2">定价配置</h3>
              
              {selectedStore === '武汉店' ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="daytime6h">白天 (6小时)</TabsTrigger>
                    <TabsTrigger value="daytime3h">白天 (3小时)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="daytime6h" className="mt-4">
                    {renderWuhanPricingForm('daytime6h')}
                  </TabsContent>
                  <TabsContent value="daytime3h" className="mt-4">
                    {renderWuhanPricingForm('daytime3h')}
                  </TabsContent>
                </Tabs>
              ) : (
                renderShanghaiPricingForm()
              )}
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
