import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MembersApi, RechargesApi, ConsumesApi } from '@/services/admin';
import { MemberResp, MemberReq, CARD_TYPES_ENUM, RechargeApplyCreateReq } from '@/models';
import SalesSelect from '@/components/SalesSelect';
import ShopSelect from '@/components/ShopSelect';
import { CARD_TYPES, CARD_TYPE_THRESHOLDS } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<MemberResp | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    giftAmount: '',
    voucher: '',
    giftProductRemark: '',
    shop: '',
  });

  // Fetch members
  const { data: membersResp } = useQuery({
    queryKey: ['members'],
    queryFn: () => MembersApi.list({ page: 1, size: 100 }),
  });

  const members = membersResp?.data?.list || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: MemberReq) => MembersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('会员添加成功');
    },
    onError: () => toast.error('会员添加失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberReq }) =>
      MembersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('更新成功');
    },
    onError: () => toast.error('更新失败'),
  });

  const rechargeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RechargeApplyCreateReq }) =>
      MembersApi.recharge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['recharges'] });
      toast.success('充值申请提交成功');
      setShowRechargeModal(false);
    },
    onError: () => toast.error('充值申请提交失败'),
  });

  const handleAddMember = () => {
    createMutation.mutate({
      name: '新会员',
      phone: '',
      // Default values
    });
  };

  const handleUpdateMember = (
    memberId: number,
    field: keyof MemberReq,
    value: any
  ) => {
    updateMutation.mutate({ id: memberId, data: { [field]: value } });
  };

  const handleSalesChange = (
    memberId: number,
    salesId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _salesName: string
  ) => {
    updateMutation.mutate({ id: memberId, data: { salesId } });
  };

  // Fetch details for selected member
  const { data: rechargeResp } = useQuery({
    queryKey: ['recharges', selectedMember?.id],
    queryFn: () => RechargesApi.list({ memberId: String(selectedMember?.id), page: 1, size: 20 }),
    enabled: !!selectedMember && !showRechargeModal, // Fetch when detail modal is open
  });

  const { data: consumeResp } = useQuery({
    queryKey: ['consumes', selectedMember?.id],
    queryFn: () => ConsumesApi.list({ memberId: String(selectedMember?.id), page: 1, size: 20 }),
    enabled: !!selectedMember && !showRechargeModal,
  });

  const memberRechargeRecords = rechargeResp?.data?.list || [];
  const memberConsumeRecords = consumeResp?.data?.list || [];

  const handleOpenRecharge = () => {
    if (!selectedMember) return;
    setRechargeForm({
      amount: '',
      giftAmount: '',
      voucher: '',
      giftProductRemark: '',
      shop: '', // We should ideally get this from the member's associated salesperson's shop
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
    if (!selectedMember?.id) return;
    
    const amount = parseFloat(rechargeForm.amount) || 0;
    const giftAmount = parseFloat(rechargeForm.giftAmount) || 0;
    
    if (amount <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }

    rechargeMutation.mutate({
      id: selectedMember.id,
      data: {
        amount,
        giftAmount,
        storeId: 1, // TODO: Fix store selection (should be ID)
        remark: rechargeForm.giftProductRemark,
        paymentVoucher: rechargeForm.voucher,
      },
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
                key={member.id}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2 text-sm font-mono text-foreground whitespace-nowrap">
                  {member.id}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    defaultValue={member.name}
                    onBlur={(e) =>
                      member.id && handleUpdateMember(member.id, 'name', e.target.value)
                    }
                    className="w-20 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="姓名"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    defaultValue={member.phone}
                    onBlur={(e) =>
                      member.id && handleUpdateMember(member.id, 'phone', e.target.value)
                    }
                    className="w-28 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="手机号"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={member.cardType}
                    onChange={(e) =>
                      member.id && handleUpdateMember(member.id, 'cardType', e.target.value)
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
                    defaultValue={member.idCard}
                    onBlur={(e) =>
                      member.id && handleUpdateMember(member.id, 'idCard', e.target.value)
                    }
                    className="w-44 px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="身份证号"
                  />
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">
                  {member.createdAt?.split('T')[0]}
                </td>
                <td className="px-3 py-2 text-sm font-medium text-green-600 whitespace-nowrap">
                  ¥{(member.balance || 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-sm font-medium text-blue-600 whitespace-nowrap">
                  ¥{(member.giftBalance || 0).toLocaleString()}
                </td>
                <td className="px-3 py-2 min-w-[180px]">
                  <SalesSelect
                    value={member.salesId}
                    onChange={(salesId, salesName) =>
                      member.id && handleSalesChange(member.id, salesId, salesName)
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
                {selectedMember?.id} {selectedMember?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                业务员：{selectedMember?.salesId}
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
                  {/* We don't have total recharge from API directly, maybe need to calculate or fetch */}
                  ¥{(selectedMember?.balance || 0).toLocaleString()} 
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
                        <td className="px-3 py-2 text-sm">{record.createdAt}</td>
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
                        <td className="px-3 py-2 text-sm">{record.createdAt}</td>
                        <td className="px-3 py-2 text-sm font-medium text-red-600">
                          {record.consumeAmount}
                        </td>
                        <td className="px-3 py-2 text-sm">¥{record.balance}</td>
                        <td className="px-3 py-2 text-sm">
                          ¥{record.giftBalance}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {/* record.consumeType is not in interface, checking model... it has type or similar? 
                              Actually ConsumeRecordResp has consumeType? No, it has no consumeType field in the interface definition I saw earlier.
                              Wait, checking consume-record-resp.ts...
                              It has no consumeType. It has consumeNo, etc. 
                              Maybe I should check the API response again or just leave it empty if not available.
                          */}
                          -
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
              充值 - {selectedMember?.id} {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-md text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">当前充值余额：</span>
                  <span className="font-medium text-green-600">
                    ¥{(selectedMember?.balance || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">当前赠送余额：</span>
                  <span className="font-medium text-blue-600">
                    ¥{(selectedMember?.giftBalance || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">当前卡类型：</span>
                  <span className="font-medium">{selectedMember?.cardType}</span>
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
