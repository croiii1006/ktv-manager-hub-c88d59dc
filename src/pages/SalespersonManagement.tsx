import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useDataStore } from '@/contexts/DataStore';
import ShopSelect from '@/components/ShopSelect';
import LeaderSelect from '@/components/LeaderSelect';
import { Salesperson } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SalespersonManagement() {
  const {
    salespersons,
    setSalespersons,
    generateSalesId,
    rechargeRecords,
    consumeRecords,
  } = useDataStore();
  const [selectedSales, setSelectedSales] = useState<Salesperson | null>(null);
  const [modalType, setModalType] = useState<'recharge' | 'consume' | null>(null);
  const [consumeDetailId, setConsumeDetailId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSalespersons = () => {
    setSalespersons(salespersons.filter((sp) => !selectedIds.has(sp.salesId)));
    setSelectedIds(new Set());
    setDeleteMode(false);
  };

  const handleAddSalesperson = () => {
    const newId = generateSalesId();
    const newSales: Salesperson = {
      salesId: newId,
      name: '',
      phone: '',
      wechat: '',
      shop: '',
      leaderId: '',
      leaderName: '',
    };
    setSalespersons([...salespersons, newSales]);
  };

  const handleUpdateSalesperson = (
    salesId: string,
    field: keyof Salesperson,
    value: string
  ) => {
    setSalespersons(
      salespersons.map((sp) =>
        sp.salesId === salesId ? { ...sp, [field]: value } : sp
      )
    );
  };

  const handleLeaderChange = (
    salesId: string,
    leaderId: string,
    leaderName: string
  ) => {
    setSalespersons(
      salespersons.map((sp) =>
        sp.salesId === salesId ? { ...sp, leaderId, leaderName } : sp
      )
    );
  };

  const salesRechargeRecords = rechargeRecords.filter(
    (r) => r.salesId === selectedSales?.salesId
  );
  const salesConsumeRecords = consumeRecords.filter(
    (r) => r.salesId === selectedSales?.salesId
  );

  const selectedConsumeDetail = consumeRecords.find(
    (r) => r.id === consumeDetailId
  );

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            {deleteMode && (
              <th className="px-2 py-3 text-left text-sm font-medium text-muted-foreground w-10">
                选择
              </th>
            )}
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              业务员编号
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              姓名
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              电话
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              微信号
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              店铺
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              所属队长
            </th>
            <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {salespersons.map((sp) => (
            <tr
              key={sp.salesId}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              {deleteMode && (
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(sp.salesId)}
                    onChange={() => toggleSelect(sp.salesId)}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
              )}
              <td className="px-3 py-3 text-sm font-mono text-foreground">
                {sp.salesId}
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={sp.name}
                  onChange={(e) =>
                    handleUpdateSalesperson(sp.salesId, 'name', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="姓名"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={sp.phone}
                  onChange={(e) =>
                    handleUpdateSalesperson(sp.salesId, 'phone', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="电话"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={sp.wechat}
                  onChange={(e) =>
                    handleUpdateSalesperson(sp.salesId, 'wechat', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="微信号"
                />
              </td>
              <td className="px-3 py-2">
                <ShopSelect
                  value={sp.shop}
                  onChange={(value) =>
                    handleUpdateSalesperson(sp.salesId, 'shop', value)
                  }
                  className="w-full"
                />
              </td>
              <td className="px-3 py-2">
                <LeaderSelect
                  value={sp.leaderId}
                  onChange={(leaderId, leaderName) =>
                    handleLeaderChange(sp.salesId, leaderId, leaderName)
                  }
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSales(sp);
                      setModalType('recharge');
                    }}
                  >
                    充值记录
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSales(sp);
                      setModalType('consume');
                    }}
                  >
                    消费记录
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-3 py-3" colSpan={deleteMode ? 8 : 7}>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSalesperson}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  添加业务员
                </button>
                {!deleteMode ? (
                  <button
                    onClick={() => setDeleteMode(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                    删除
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDeleteSalespersons}
                      disabled={selectedIds.size === 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                    >
                      确认删除 ({selectedIds.size})
                    </button>
                    <button
                      onClick={() => {
                        setDeleteMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      取消
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Recharge Records Modal */}
      <Dialog
        open={modalType === 'recharge' && !!selectedSales}
        onOpenChange={() => {
          setModalType(null);
          setSelectedSales(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>
                {selectedSales?.salesId} {selectedSales?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {selectedSales?.shop}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div>
            <h3 className="text-lg font-medium mb-4">充值记录</h3>
            <table className="w-full border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    日期
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    金额
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    客户编号
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    客户名字
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesRechargeRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-muted-foreground"
                    >
                      暂无充值记录
                    </td>
                  </tr>
                ) : (
                  salesRechargeRecords.map((record) => (
                    <tr key={record.id} className="border-t border-border">
                      <td className="px-3 py-2 text-sm">{record.date}</td>
                      <td className="px-3 py-2 text-sm font-medium text-green-600">
                        +{record.amount}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {record.memberId}
                      </td>
                      <td className="px-3 py-2 text-sm">{record.memberName}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">
                        {record.remark || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consume Records Modal */}
      <Dialog
        open={modalType === 'consume' && !!selectedSales && !consumeDetailId}
        onOpenChange={() => {
          setModalType(null);
          setSelectedSales(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>
                {selectedSales?.salesId} {selectedSales?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {selectedSales?.shop}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div>
            <h3 className="text-lg font-medium mb-4">消费记录</h3>
            <table className="w-full border border-border rounded-md">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    日期
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    金额
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    客户编号
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    客户名字
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    消费类型
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesConsumeRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-muted-foreground"
                    >
                      暂无消费记录
                    </td>
                  </tr>
                ) : (
                  salesConsumeRecords.map((record) => (
                    <tr key={record.id} className="border-t border-border">
                      <td className="px-3 py-2 text-sm">{record.date}</td>
                      <td className="px-3 py-2 text-sm font-medium text-red-600">
                        {record.amount}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {record.memberId}
                      </td>
                      <td className="px-3 py-2 text-sm">{record.memberName}</td>
                      <td className="px-3 py-2 text-sm">{record.consumeType}</td>
                      <td className="px-3 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConsumeDetailId(record.id)}
                        >
                          详情
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consume Detail Modal */}
      <Dialog
        open={!!consumeDetailId}
        onOpenChange={() => setConsumeDetailId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>消费详情</DialogTitle>
          </DialogHeader>
          {selectedConsumeDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">客户名字：</span>
                  <span className="font-medium">
                    {selectedConsumeDetail.memberName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">客户编号：</span>
                  <span className="font-mono">
                    {selectedConsumeDetail.memberId}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">消费店铺：</span>
                  <span>{selectedConsumeDetail.shop}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span>{selectedConsumeDetail.roomNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">预定日期：</span>
                  <span>{selectedConsumeDetail.bookingDate || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">业务员：</span>
                  <span>
                    {selectedConsumeDetail.salesName}{' '}
                    {selectedConsumeDetail.salesId}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setConsumeDetailId(null)}
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
