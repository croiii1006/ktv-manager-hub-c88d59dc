import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Loader2, UserCog, Wallet, ReceiptText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { MembersApi, RechargesApi, ConsumesApi, SalespersonsApi, MemberBindingsApi } from '@/services/admin';
import { MemberResp, MemberReq, RechargeApplyCreateReq, MemberBindingReq } from '@/models';
import SalesSelect from '@/components/SalesSelect';
import { CARD_TYPES, CARD_TYPE_THRESHOLDS } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from 'sonner';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<MemberResp | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [bindModalOpen, setBindModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [size] = useState(10);

  // Forms
  const [newMember, setNewMember] = useState<MemberReq>({
    name: '',
    phone: '',
    cardType: 'ORDINARY' as any,
    idCard: '',
    salesId: undefined,
  });

  const [editForm, setEditForm] = useState<MemberReq>({});
  
  const [rechargeForm, setRechargeForm] = useState({
    amount: '',
    giftAmount: '',
    voucher: '',
    giftProductRemark: '',
    shop: 1, 
  });

  const [bindForm, setBindForm] = useState<{ salesId?: number; salesName?: string }>({});

  // Fetch members
  const { data: membersResp, isLoading } = useQuery({
    queryKey: ['members', page, size],
    queryFn: () => MembersApi.list({ page, size }),
  });

  // Fetch salespersons for name mapping
  const { data: salesResp } = useQuery({
    queryKey: ['salespersons-all'],
    queryFn: () => SalespersonsApi.list({ page: 1, size: 100 }),
  });

  const salespersons = salesResp?.data?.list || [];
  const salesMap = new Map(salespersons.map((s) => [s.id, s.name]));

  const members = membersResp?.data?.list || [];
  const memberIds = members.map((m) => m.id).filter((id): id is number => typeof id === 'number');
  const bindingQueries = useQueries({
    queries: memberIds.map((id) => ({
      queryKey: ['member-binding', id],
      queryFn: () => MemberBindingsApi.list({ memberId: id, page: 1, size: 1 }),
      enabled: !!id,
    })),
  });
  const bindingStaffIdMap = new Map<number, number>();
  bindingQueries.forEach((q, idx) => {
    const mid = memberIds[idx];
    const b = q.data?.data?.list?.[0];
    if (mid && b?.staffId) bindingStaffIdMap.set(mid, b.staffId);
  });
  const bindingStaffIds = Array.from(new Set(Array.from(bindingStaffIdMap.values())));
  const bindingStaffQueries = useQueries({
    queries: bindingStaffIds.map((sid) => ({
      queryKey: ['staff-detail', sid],
      queryFn: () => SalespersonsApi.detail(sid),
      enabled: !!sid,
    })),
  });
  const bindingStaffNameMap = new Map<number, string>();
  bindingStaffQueries.forEach((q, idx) => {
    const sid = bindingStaffIds[idx];
    const name = q.data?.data?.name;
    if (sid && name) bindingStaffNameMap.set(sid, name);
  });

  const total = membersResp?.data?.total || 0;
  const totalPages = Math.ceil(total / size);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: MemberReq) => MembersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('会员添加成功');
      setCreateModalOpen(false);
      setNewMember({
        name: '',
        phone: '',
        cardType: 'ORDINARY' as any,
        idCard: '',
        salesId: undefined,
      });
    },
    onError: () => toast.error('会员添加失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberReq }) =>
      MembersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('更新成功');
      setEditModalOpen(false);
    },
    onError: () => toast.error('更新失败'),
    onSettled: () => setActionLoading(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => MembersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('删除成功');
    },
    onError: () => toast.error('删除失败'),
    onSettled: () => setActionLoading(null),
  });

  const rechargeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RechargeApplyCreateReq }) =>
      MembersApi.recharge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['recharges'] });
      toast.success('充值申请提交成功');
      setRechargeModalOpen(false);
    },
    onError: (error: any) => {
      const msg = error.message || '充值申请提交失败';
      toast.error(msg);
    },
  });

  const bindMutation = useMutation({
    mutationFn: async ({ memberId, salesId }: { memberId: number; salesId: number }) => {
       // First check if binding exists
       const bindings = await MemberBindingsApi.list({ memberId, page: 1, size: 1 });
       const existingBinding = bindings.data?.list?.[0];

       const req: MemberBindingReq = {
          memberId,
          storeId: 1, // Default store or should fetch from salesman? Assuming 1 or handled by backend if omitted (but required in interface)
          staffId: salesId,
       };
       // Try to find the store of the salesman
       const sales = salespersons.find(s => s.id === salesId);
       if (sales && sales.storeId) {
          req.storeId = sales.storeId;
       }

       if (existingBinding && existingBinding.id) {
          return MemberBindingsApi.update(existingBinding.id, req);
       } else {
          return MemberBindingsApi.create(req);
       }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('绑定成功');
      setBindModalOpen(false);
    },
    onError: (err: any) => {
       toast.error(err.message || '绑定失败');
    }
  });

  // Handlers
  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个会员吗？')) {
      setActionLoading(id);
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (member: MemberResp) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      phone: member.phone,
      cardType: member.cardType as any, // Assuming string matches
      idCard: member.idCard,
      salesId: member.salesId,
    });
    setEditModalOpen(true);
  };

  const openBind = (member: MemberResp) => {
    setSelectedMember(member);
    setBindForm({ salesId: member.salesId });
    setBindModalOpen(true);
  };

  const openRecharge = (member: MemberResp) => {
    setSelectedMember(member);
    setRechargeForm({
      amount: '',
      giftAmount: '',
      voucher: '',
      giftProductRemark: '',
      shop: 1,
    });
    setRechargeModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (selectedMember?.id) {
      updateMutation.mutate({ id: selectedMember.id, data: editForm });
    }
  };

  const handleBindSubmit = () => {
    if (selectedMember?.id && bindForm.salesId) {
       bindMutation.mutate({ memberId: selectedMember.id, salesId: bindForm.salesId });
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
        memberId: selectedMember.id,
        amount,
        giftAmount,
        storeId: rechargeForm.shop,
        remark: rechargeForm.giftProductRemark,
        voucherUrls: rechargeForm.voucher ? [rechargeForm.voucher] : [],
        staffId: 1, // TODO: current user
      } as any,
    });
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

  // Detail queries
  const { data: rechargeRecordsResp } = useQuery({
    queryKey: ['member-recharge-records', selectedMember?.id],
    queryFn: () => MembersApi.rechargeRecords(selectedMember!.id, { page: 1, size: 20 }),
    enabled: !!selectedMember && detailModalOpen,
  });

  const { data: consumeRecordsResp } = useQuery({
    queryKey: ['member-consume-records', selectedMember?.id],
    queryFn: () => MembersApi.consumeRecords(selectedMember!.id, { page: 1, size: 20 }),
    enabled: !!selectedMember && detailModalOpen,
  });

  const memberRechargeRecords = rechargeRecordsResp?.data?.list || [];
  const memberConsumeRecords = consumeRecordsResp?.data?.list || [];

  

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-500 text-primary-foreground">待审核</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-500 text-primary-foreground">已通过</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500 text-primary-foreground">已拒绝</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">已取消</Badge>;
      case 'VOID':
        return <Badge variant="secondary">作废</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
         <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加会员
         </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">编号</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">姓名</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">手机号码</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">卡类型</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">身份证号</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">办理日期</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">充值余额</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">赠送余额</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">业务员</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={10} className="p-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : members.length === 0 ? (
               <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td>
               </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3 text-sm font-mono text-foreground">{member.id}</td>
                  <td className="px-3 py-3 text-sm">{member.name}</td>
                  <td className="px-3 py-3 text-sm">{member.phone}</td>
                  <td className="px-3 py-3 text-sm">{member.cardType}</td>
                  <td className="px-3 py-3 text-sm">{member.idCard || '-'}</td>
                  <td className="px-3 py-3 text-sm">{member.createdAt?.split('T')[0]}</td>
                  <td className="px-3 py-3 text-sm font-medium text-green-600">¥{(member.balance || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm font-medium text-blue-600">¥{(member.giftBalance || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm">
                    {(() => {
                      const bid = bindingStaffIdMap.get(member.id!);
                      if (bid) return bindingStaffNameMap.get(bid) || bid;
                      if (member.salesName) return member.salesName;
                      if (member.salesId) return salesMap.get(member.salesId) || member.salesId;
                      return '-';
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="icon" title="详情" onClick={() => { setSelectedMember(member); setDetailModalOpen(true); }}>
                          <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="编辑" onClick={() => openEdit(member)}>
                          <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="绑定业务员" onClick={() => openBind(member)}>
                          <UserCog className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="充值" onClick={() => openRecharge(member)}>
                          <Wallet className="h-4 w-4 text-green-600" />
                       </Button>
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          title="删除" 
                          className="text-destructive hover:text-destructive" 
                          onClick={() => member.id && handleDelete(member.id)}
                          disabled={actionLoading === member.id}
                       >
                          {actionLoading === member.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                             <Trash2 className="h-4 w-4" />
                          )}
                       </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  onClick={() => setPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加会员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="输入姓名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号码</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder="输入手机号码"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">卡类型</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={newMember.cardType}
                onChange={(e) => setNewMember({ ...newMember, cardType: e.target.value as any })}
              >
                {CARD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">身份证号</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newMember.idCard}
                onChange={(e) => setNewMember({ ...newMember, idCard: e.target.value })}
                placeholder="输入身份证号"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">所属业务员</label>
              <SalesSelect
                value={newMember.salesId}
                onChange={(id) => setNewMember({ ...newMember, salesId: id })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={() => createMutation.mutate(newMember)} disabled={createMutation.isPending}>
               {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {createMutation.isPending ? '添加中...' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑会员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号码</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">卡类型</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={editForm.cardType}
                onChange={(e) => setEditForm({ ...editForm, cardType: e.target.value as any })}
              >
                {CARD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">身份证号</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={editForm.idCard || ''}
                onChange={(e) => setEditForm({ ...editForm, idCard: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>取消</Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
               {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {updateMutation.isPending ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bind Salesman Modal */}
      <Dialog open={bindModalOpen} onOpenChange={setBindModalOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>绑定业务员 - {selectedMember?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium">选择业务员</label>
                  <SalesSelect
                     value={bindForm.salesId}
                     onChange={(id) => setBindForm({ ...bindForm, salesId: id })}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setBindModalOpen(false)}>取消</Button>
               <Button onClick={handleBindSubmit} disabled={bindMutation.isPending}>
                  {bindMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {bindMutation.isPending ? '绑定中...' : '确认绑定'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Recharge Modal */}
      <Dialog open={rechargeModalOpen} onOpenChange={setRechargeModalOpen}>
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
              <Button variant="outline" onClick={() => setRechargeModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleRechargeSubmit} disabled={rechargeMutation.isPending}>
                 {rechargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 {rechargeMutation.isPending ? '充值中...' : '确认充值'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>
                {selectedMember?.id} {selectedMember?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                业务员：{(() => {
                  const bid = selectedMember?.id ? bindingStaffIdMap.get(selectedMember.id) : undefined;
                  if (bid) return bindingStaffNameMap.get(bid) || bid;
                  if (selectedMember?.salesName) return selectedMember.salesName;
                  if (selectedMember?.salesId) return salesMap.get(selectedMember.salesId) || selectedMember.salesId;
                  return '-';
                })()}
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
                    <th className="px-3 py-2 text-left text-sm font-medium">日期</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">申请单号</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">本金</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">赠送金</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">本金余额</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">赠送余额</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">审核时间</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {memberRechargeRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-4 text-center text-muted-foreground"
                      >
                        暂无充值记录
                      </td>
                    </tr>
                  ) : (
                    memberRechargeRecords.map((record) => (
                      <tr key={record.id} className="border-t border-border">
                        <td className="px-3 py-2 text-sm">{record.createdAt}</td>
                        <td className="px-3 py-2 text-sm">{record.applyNo}</td>
                        <td className="px-3 py-2 text-sm font-medium text-green-600">+¥{record.amount}</td>
                        <td className="px-3 py-2 text-sm font-medium text-blue-600">+¥{record.giftAmount}</td>
                        <td className="px-3 py-2 text-sm">¥{record.balance}</td>
                        <td className="px-3 py-2 text-sm">¥{record.giftBalance}</td>
                        <td className="px-3 py-2 text-sm">{record.reviewedAt || '-'}</td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">{record.remark || '-'}</td>
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
                    <th className="px-3 py-2 text-left text-sm font-medium">日期</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">消费单号</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">消费类型</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">消费金额</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">本金余额</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">赠送余额</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">审核时间</th>
                    <th className="px-3 py-2 text-left text-sm font-medium">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {memberConsumeRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-4 text-center text-muted-foreground"
                      >
                        暂无消费记录
                      </td>
                    </tr>
                  ) : (
                    memberConsumeRecords.map((record) => (
                      <tr key={record.id} className="border-t border-border">
                        <td className="px-3 py-2 text-sm">{record.createdAt}</td>
                        <td className="px-3 py-2 text-sm">{record.consumeNo}</td>
                        <td className="px-3 py-2 text-sm">{record.consumeType || '-'}</td>
                        <td className="px-3 py-2 text-sm font-medium text-red-600">-¥{record.consumeAmount}</td>
                        <td className="px-3 py-2 text-sm">¥{record.balance}</td>
                        <td className="px-3 py-2 text-sm">¥{record.giftBalance}</td>
                        <td className="px-3 py-2 text-sm">{record.reviewedAt || '-'}</td>
                        <td className="px-3 py-2 text-sm text-muted-foreground">{record.remark || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
