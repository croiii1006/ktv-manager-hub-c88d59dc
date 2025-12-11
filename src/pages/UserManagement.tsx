import { useState, useMemo } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useDataStore } from '@/contexts/DataStore';
import SalesSelect from '@/components/SalesSelect';
import ShopSelect from '@/components/ShopSelect';
import { Member, CARD_TYPES, calculateCardType, CARD_TYPE_THRESHOLDS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

export default function UserManagement() {
  const {
    members,
    setMembers,
    generateMemberId,
    rechargeRecords,
    setRechargeRecords,
    consumeRecords,
    salespersons,
  } = useDataStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    giftAmount: '',
    voucher: '',
    giftProductRemark: '',
    shop: '',
  });

  const handleAddMember = () => {
    const newId = generateMemberId();
    const newMember: Member = {
      memberId: newId,
      name: '',
      phone: '',
      cardType: '非会员',
      idNumber: '',
      registerDate: new Date().toISOString().split('T')[0],
      remainingRecharge: 0,
      remainingGift: 0,
      salesId: '',
      salesName: '',
    };
    setMembers([...members, newMember]);
  };

  const handleUpdateMember = (
    memberId: string,
    field: keyof Member,
    value: string | number
  ) => {
    setMembers(
      members.map((m) =>
        m.memberId === memberId ? { ...m, [field]: value } : m
      )
    );
  };

  const handleSalesChange = (
    memberId: string,
    salesId: string,
    salesName: string
  ) => {
    setMembers(
      members.map((m) =>
        m.memberId === memberId ? { ...m, salesId, salesName } : m
      )
    );
  };

  const memberRechargeRecords = rechargeRecords.filter(
    (r) => r.memberId === selectedMember?.memberId
  );
  const memberConsumeRecords = consumeRecords.filter(
    (r) => r.memberId === selectedMember?.memberId
  );

  // Calculate total recharge for a member
  const getMemberTotalRecharge = (memberId: string) => {
    return rechargeRecords
      .filter((r) => r.memberId === memberId)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const handleOpenRecharge = () => {
    if (!selectedMember) return;
    const salesperson = salespersons.find(s => s.salesId === selectedMember.salesId);
    setRechargeForm({
      amount: '',
      giftAmount: '',
      voucher: '',
      giftProductRemark: '',
      shop: salesperson?.shop || '',
    });
    setShowRechargeModal(true);
  };

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRechargeForm((prev) => ({
          ...prev,
          voucher: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRechargeSubmit = () => {
    if (!selectedMember) return;
    
    const amount = parseFloat(rechargeForm.amount) || 0;
    const giftAmount = parseFloat(rechargeForm.giftAmount) || 0;
    
    if (amount <= 0) {
      toast({
        title: '错误',
        description: '请输入有效的充值金额',
        variant: 'destructive',
      });
      return;
    }

    const newBalance = selectedMember.remainingRecharge + amount;
    const newGiftBalance = selectedMember.remainingGift + giftAmount;

    // Calculate new total recharge and card type
    const totalRecharge = getMemberTotalRecharge(selectedMember.memberId) + amount;
    const newCardType = calculateCardType(totalRecharge);

    // Create recharge record
    const newRecord = {
      id: `R${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      memberId: selectedMember.memberId,
      memberName: selectedMember.name,
      cardType: newCardType,
      phone: selectedMember.phone,
      idNumber: selectedMember.idNumber,
      amount,
      giftAmount,
      salesId: selectedMember.salesId,
      salesName: selectedMember.salesName,
      shop: rechargeForm.shop,
      remark: rechargeForm.giftProductRemark,
      balance: newBalance,
      giftBalance: newGiftBalance,
      voucher: rechargeForm.voucher,
      giftProductRemark: rechargeForm.giftProductRemark,
    };

    setRechargeRecords((prev) => [...prev, newRecord]);

    // Update member balance and card type
    setMembers((prev) =>
      prev.map((m) =>
        m.memberId === selectedMember.memberId
          ? {
              ...m,
              remainingRecharge: newBalance,
              remainingGift: newGiftBalance,
              cardType: newCardType,
            }
          : m
      )
    );

    // Update selected member state
    setSelectedMember((prev) =>
      prev
        ? {
            ...prev,
            remainingRecharge: newBalance,
            remainingGift: newGiftBalance,
            cardType: newCardType,
          }
        : null
    );

    setShowRechargeModal(false);
    toast({
      title: '充值成功',
      description: `充值 ¥${amount}，赠送 ¥${giftAmount}，当前卡类型：${newCardType}`,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                会员卡号
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                姓名
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                手机号码
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                卡类型
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                身份证号
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                办理日期
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                充值余额
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                赠送余额
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                业务员
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.memberId}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2 text-sm font-mono text-foreground whitespace-nowrap">
                  {member.memberId}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) =>
                      handleUpdateMember(member.memberId, 'name', e.target.value)
                    }
                    className="w-20 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="姓名"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={member.phone}
                    onChange={(e) =>
                      handleUpdateMember(member.memberId, 'phone', e.target.value)
                    }
                    className="w-28 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="手机号"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={member.cardType}
                    onChange={(e) =>
                      handleUpdateMember(member.memberId, 'cardType', e.target.value)
                    }
                    className="w-24 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {CARD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={member.idNumber}
                    onChange={(e) =>
                      handleUpdateMember(member.memberId, 'idNumber', e.target.value)
                    }
                    className="w-44 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="身份证号"
                  />
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">
                  {member.registerDate}
                </td>
                <td className="px-3 py-2 text-sm font-medium text-green-600 whitespace-nowrap">
                  ¥{member.remainingRecharge.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-sm font-medium text-blue-600 whitespace-nowrap">
                  ¥{member.remainingGift.toLocaleString()}
                </td>
                <td className="px-3 py-2 min-w-[180px]">
                  <SalesSelect
                    value={member.salesId}
                    onChange={(salesId, salesName) =>
                      handleSalesChange(member.memberId, salesId, salesName)
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMember(member)}
                  >
                    详情
                  </Button>
                </td>
              </tr>
            ))}
            <tr className="hover:bg-muted/30 transition-colors">
              <td className="px-3 py-3" colSpan={10}>
                <button
                  onClick={handleAddMember}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  添加用户
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Member Detail Modal */}
      <Dialog
        open={!!selectedMember && !showRechargeModal}
        onOpenChange={() => setSelectedMember(null)}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>
                {selectedMember?.memberId} {selectedMember?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                业务员：{selectedMember?.salesId} {selectedMember?.salesName}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Card Type Info */}
            <div className="bg-muted/30 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">卡类型等级说明</h4>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {CARD_TYPE_THRESHOLDS.map((t) => (
                  <div key={t.type} className="text-center p-2 bg-background rounded">
                    <div className="font-medium">{t.type}</div>
                    <div className="text-muted-foreground">
                      ≥ ¥{t.minAmount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm">
                当前累计充值：<span className="font-medium text-green-600">
                  ¥{getMemberTotalRecharge(selectedMember?.memberId || '').toLocaleString()}
                </span>
                ，卡类型：<span className="font-medium">{selectedMember?.cardType}</span>
              </div>
            </div>

            {/* Recharge Records */}
            <div>
              <h3 className="text-lg font-medium mb-3">充值记录</h3>
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
                      余额
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      赠送余额
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      备注
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {memberRechargeRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-muted-foreground"
                      >
                        暂无充值记录
                      </td>
                    </tr>
                  ) : (
                    memberRechargeRecords.map((record) => (
                      <tr key={record.id} className="border-t border-border">
                        <td className="px-3 py-2 text-sm">{record.date}</td>
                        <td className="px-3 py-2 text-sm font-medium text-green-600">
                          +{record.amount}
                        </td>
                        <td className="px-3 py-2 text-sm">¥{record.balance}</td>
                        <td className="px-3 py-2 text-sm">
                          ¥{record.giftBalance}
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {record.remark || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Consume Records */}
            <div>
              <h3 className="text-lg font-medium mb-3">消费记录</h3>
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
                      余额
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      赠送余额
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      消费类型
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-medium">
                      备注
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {memberConsumeRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-4 text-center text-muted-foreground"
                      >
                        暂无消费记录
                      </td>
                    </tr>
                  ) : (
                    memberConsumeRecords.map((record) => (
                      <tr key={record.id} className="border-t border-border">
                        <td className="px-3 py-2 text-sm">{record.date}</td>
                        <td className="px-3 py-2 text-sm font-medium text-red-600">
                          {record.amount}
                        </td>
                        <td className="px-3 py-2 text-sm">¥{record.balance}</td>
                        <td className="px-3 py-2 text-sm">
                          ¥{record.giftBalance}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {record.consumeType}
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">
                          {record.remark || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleOpenRecharge}>充值</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge Modal */}
      <Dialog
        open={showRechargeModal}
        onOpenChange={() => setShowRechargeModal(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              充值 - {selectedMember?.memberId} {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">当前充值余额：</span>
                  <span className="font-medium text-green-600">
                    ¥{selectedMember?.remainingRecharge.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">当前赠送余额：</span>
                  <span className="font-medium text-blue-600">
                    ¥{selectedMember?.remainingGift.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">当前卡类型：</span>
                  <span className="font-medium">{selectedMember?.cardType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">累计充值：</span>
                  <span className="font-medium">
                    ¥{getMemberTotalRecharge(selectedMember?.memberId || '').toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  充值金额 *
                </label>
                <input
                  type="number"
                  value={rechargeForm.amount}
                  onChange={(e) =>
                    setRechargeForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入充值金额"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  赠送余额
                </label>
                <input
                  type="number"
                  value={rechargeForm.giftAmount}
                  onChange={(e) =>
                    setRechargeForm((prev) => ({ ...prev, giftAmount: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入赠送余额"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  店铺
                </label>
                <ShopSelect
                  value={rechargeForm.shop}
                  onChange={(shop) =>
                    setRechargeForm((prev) => ({ ...prev, shop }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  赠送产品备注
                </label>
                <textarea
                  value={rechargeForm.giftProductRemark}
                  onChange={(e) =>
                    setRechargeForm((prev) => ({
                      ...prev,
                      giftProductRemark: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  rows={2}
                  placeholder="输入赠送产品备注"
                />
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
                  {rechargeForm.voucher && (
                    <span className="text-sm text-green-600">已上传</span>
                  )}
                </div>
                {rechargeForm.voucher && (
                  <img
                    src={rechargeForm.voucher}
                    alt="凭证预览"
                    className="mt-2 max-h-32 rounded-md border border-border"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRechargeModal(false)}>
                取消
              </Button>
              <Button onClick={handleRechargeSubmit}>确认充值</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
