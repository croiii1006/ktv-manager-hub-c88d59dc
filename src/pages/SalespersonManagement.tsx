import { useState } from 'react';
import { Plus, Edit2, Trash2, KeyRound, Power, Eye, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SalespersonsApi, RechargesApi, ConsumesApi, StoresApi, TeamLeadersApi } from '@/services/admin';
import { StaffResp, StaffCreateReq, StaffUpdateReq, StaffRespRoleEnum } from '@/models';
import ShopSelect from '@/components/ShopSelect';
import LeaderSelect from '@/components/LeaderSelect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function SalespersonManagement() {
  const queryClient = useQueryClient();
  const [selectedSales, setSelectedSales] = useState<StaffResp | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [modalType, setModalType] = useState<'recharge' | 'consume' | null>(null);
  const [consumeDetailId, setConsumeDetailId] = useState<number | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [size] = useState(10);

  // Forms
  const [newSales, setNewSales] = useState<StaffCreateReq>({
    username: '',
    name: '',
    phone: '',
    role: StaffRespRoleEnum.SALESMAN,
    password: '123',
  });
  const [editForm, setEditForm] = useState<StaffUpdateReq>({});

  // Fetch salespersons
  const { data: salesResp, isLoading } = useQuery({
    queryKey: ['salespersons', page, size],
    queryFn: () => SalespersonsApi.list({ page, size }),
  });

  const { data: storesResp } = useQuery({
    queryKey: ['stores'],
    queryFn: () => StoresApi.list({ page: 1, size: 100 }),
  });

  const { data: leadersResp } = useQuery({
    queryKey: ['team-leaders-all'],
    queryFn: () => TeamLeadersApi.list({ page: 1, size: 100 }),
  });

  const storeMap = new Map(storesResp?.data?.list?.map((s) => [s.id, s.name]) || []);
  const leaderMap = new Map(leadersResp?.data?.list?.map((l) => [l.id, l.name]) || []);

  const salespersons = salesResp?.data?.list || [];
  const total = salesResp?.data?.total || 0;
  const totalPages = Math.ceil(total / size);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: StaffCreateReq) => SalespersonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      toast.success('业务员添加成功');
      setCreateModalOpen(false);
      setNewSales({
        username: '',
        name: '',
        phone: '',
        role: StaffRespRoleEnum.SALESMAN,
        password: '123',
      });
    },
    onError: (error: any) => toast.error(error.message || '业务员添加失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffUpdateReq }) =>
      SalespersonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      toast.success('更新成功');
      setEditModalOpen(false);
      setPasswordModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || '更新失败'),
    onSettled: () => setActionLoading(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => SalespersonsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      toast.success('删除成功');
    },
    onError: (error: any) => toast.error(error.message || '删除失败'),
    onSettled: () => setActionLoading(null),
  });

  const handleDeleteOne = (id: number) => {
    if (confirm('确定要删除这个业务员吗？')) {
      setActionLoading(id);
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (sales: StaffResp) => {
    if (!sales.id) return;
    const newStatus = sales.status === 1 ? 0 : 1;
    setActionLoading(sales.id);
    updateMutation.mutate({ id: sales.id, data: { status: newStatus } });
  };

  const openEdit = (sales: StaffResp) => {
    setSelectedSales(sales);
    setEditForm({
      name: sales.name,
      phone: sales.phone,
      wechat: sales.wechat,
      storeId: sales.storeId,
      leaderId: sales.leaderId,
    });
    setEditModalOpen(true);
  };

  const openPassword = (sales: StaffResp) => {
    setSelectedSales(sales);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (selectedSales?.id) {
      updateMutation.mutate({ id: selectedSales.id, data: editForm });
    }
  };

  const handlePasswordSubmit = () => {
    if (selectedSales?.id && newPassword) {
      updateMutation.mutate({ id: selectedSales.id, data: { password: newPassword } });
    }
  };

  // Fetch records for selected salesperson
  const { data: rechargeResp } = useQuery({
    queryKey: ['recharges', selectedSales?.id],
    queryFn: () => RechargesApi.list({ salesId: selectedSales?.id, page: 1, size: 20 }),
    enabled: !!selectedSales && modalType === 'recharge',
  });

  const { data: consumeResp } = useQuery({
    queryKey: ['consumes', selectedSales?.id],
    queryFn: () => ConsumesApi.list({ salesId: selectedSales?.id, page: 1, size: 20 }),
    enabled: !!selectedSales && modalType === 'consume',
  });
  
  const { data: consumeDetailResp } = useQuery({
    queryKey: ['consume-detail', consumeDetailId],
    queryFn: () => ConsumesApi.detail(consumeDetailId!),
    enabled: !!consumeDetailId,
  });

  const salesRechargeRecords = rechargeResp?.data?.list || [];
  const salesConsumeRecords = consumeResp?.data?.list || [];
  const selectedConsumeDetail = consumeDetailResp?.data;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
         <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加业务员
         </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">编号</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">用户名</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">姓名</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">电话</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">微信号</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">店铺</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">所属队长</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">状态</th>
              <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={9} className="p-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : salespersons.length === 0 ? (
               <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td>
               </tr>
            ) : (
              salespersons.map((sp) => (
                <tr
                  key={sp.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3 text-sm font-mono text-foreground">{sp.id}</td>
                  <td className="px-3 py-3 text-sm">{sp.username}</td>
                  <td className="px-3 py-3 text-sm">{sp.name}</td>
                  <td className="px-3 py-3 text-sm">{sp.phone}</td>
                  <td className="px-3 py-3 text-sm">{sp.wechat}</td>
                  <td className="px-3 py-3 text-sm">{sp.storeId ? storeMap.get(sp.storeId) || sp.storeId : '-'}</td>
                  <td className="px-3 py-3 text-sm">{sp.leaderId ? leaderMap.get(sp.leaderId) || sp.leaderId : '-'}</td>
                  <td className="px-3 py-3 text-sm">
                    <Badge variant={sp.status === 1 ? 'default' : 'secondary'}>
                        {sp.status === 1 ? '启用' : '禁用'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="icon" title="详情" onClick={() => { setSelectedSales(sp); setDetailModalOpen(true); }}>
                          <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="编辑" onClick={() => openEdit(sp)}>
                          <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="修改密码" onClick={() => openPassword(sp)}>
                          <KeyRound className="h-4 w-4" />
                       </Button>
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          title={sp.status === 1 ? '禁用' : '启用'}
                          className={sp.status === 1 ? 'text-orange-500' : 'text-green-500'}
                          onClick={() => handleStatusChange(sp)}
                          disabled={actionLoading === sp.id}
                       >
                          {actionLoading === sp.id && sp.status !== undefined ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                             <Power className="h-4 w-4" />
                          )}
                       </Button>
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          title="删除" 
                          className="text-destructive hover:text-destructive" 
                          onClick={() => sp.id && handleDeleteOne(sp.id)}
                          disabled={actionLoading === sp.id}
                       >
                          {actionLoading === sp.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                             <Trash2 className="h-4 w-4" />
                          )}
                       </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          setSelectedSales(sp);
                          setModalType('recharge');
                        }}
                      >
                        充值
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => {
                          setSelectedSales(sp);
                          setModalType('consume');
                        }}
                      >
                        消费
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
            <DialogTitle>添加业务员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
              <label className="text-sm font-medium">用户名 (登录账号) *</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newSales.username}
                onChange={(e) => setNewSales({ ...newSales, username: e.target.value })}
                placeholder="输入用户名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newSales.name}
                onChange={(e) => setNewSales({ ...newSales, name: e.target.value })}
                placeholder="输入姓名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">电话</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newSales.phone}
                onChange={(e) => setNewSales({ ...newSales, phone: e.target.value })}
                placeholder="输入电话"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">微信号</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newSales.wechat}
                onChange={(e) => setNewSales({ ...newSales, wechat: e.target.value })}
                placeholder="输入微信号"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newSales.password}
                onChange={(e) => setNewSales({ ...newSales, password: e.target.value })}
                placeholder="默认密码: 123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">所属店铺 *</label>
              <ShopSelect
                value={newSales.storeId}
                returnId={true}
                onChange={(val) => setNewSales({ ...newSales, storeId: val })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">所属队长</label>
              <LeaderSelect
                value={newSales.leaderId}
                onChange={(id) => setNewSales({ ...newSales, leaderId: id })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={() => createMutation.mutate(newSales)} disabled={createMutation.isPending}>
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
            <DialogTitle>编辑业务员</DialogTitle>
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
              <label className="text-sm font-medium">电话</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">微信号</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={editForm.wechat || ''}
                onChange={(e) => setEditForm({ ...editForm, wechat: e.target.value })}
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-medium">店铺</label>
              <ShopSelect
                value={editForm.storeId}
                returnId={true}
                onChange={(val) => setEditForm({ ...editForm, storeId: val })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">所属队长</label>
              <LeaderSelect
                value={editForm.leaderId}
                onChange={(id) => setEditForm({ ...editForm, leaderId: id })}
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

      {/* Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码 - {selectedSales?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">新密码</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>取消</Button>
            <Button onClick={handlePasswordSubmit} disabled={updateMutation.isPending}>
               {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {updateMutation.isPending ? '修改中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>业务员详情</DialogTitle>
          </DialogHeader>
          {selectedSales && (
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">ID:</span> {selectedSales.id}</div>
                <div><span className="text-muted-foreground">用户名:</span> {selectedSales.username}</div>
                <div><span className="text-muted-foreground">姓名:</span> {selectedSales.name}</div>
                <div><span className="text-muted-foreground">电话:</span> {selectedSales.phone}</div>
                <div><span className="text-muted-foreground">微信号:</span> {selectedSales.wechat}</div>
                <div><span className="text-muted-foreground">店铺:</span> {selectedSales.storeId ? storeMap.get(selectedSales.storeId) || selectedSales.storeId : '-'}</div>
                <div><span className="text-muted-foreground">队长:</span> {selectedSales.leaderId ? leaderMap.get(selectedSales.leaderId) || selectedSales.leaderId : '-'}</div>
                <div>
                   <span className="text-muted-foreground">状态:</span> 
                   <span className={selectedSales.status === 1 ? 'text-green-600 ml-1' : 'text-gray-500 ml-1'}>
                      {selectedSales.status === 1 ? '启用' : '禁用'}
                   </span>
                </div>
                <div><span className="text-muted-foreground">创建时间:</span> {selectedSales.createdAt}</div>
             </div>
          )}
          <DialogFooter>
             <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {selectedSales?.id} {selectedSales?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {selectedSales?.storeId}
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
                      <td className="px-3 py-2 text-sm">{record.createdAt}</td>
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
                {selectedSales?.id} {selectedSales?.name}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {selectedSales?.storeId}
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
                      <td className="px-3 py-2 text-sm">{record.createdAt}</td>
                      <td className="px-3 py-2 text-sm font-medium text-red-600">
                        {record.consumeAmount}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono">
                        {record.memberId}
                      </td>
                      <td className="px-3 py-2 text-sm">{record.memberName}</td>
                      <td className="px-3 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => record.id && setConsumeDetailId(record.id)}
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
                  <span>{selectedConsumeDetail.storeName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">房号：</span>
                  <span>{selectedConsumeDetail.roomNo || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">业务员：</span>
                  <span>
                    {selectedConsumeDetail.applyStaffName}{' '}
                    {selectedConsumeDetail.applyStaffId}
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
