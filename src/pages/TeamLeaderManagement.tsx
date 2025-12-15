import { useState } from 'react';
import { Plus, Edit2, Trash2, KeyRound, Power, Eye, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamLeadersApi } from '@/services/admin';
import { StaffCreateReq, StaffUpdateReq, StaffRespRoleEnum, StaffResp } from '@/models';
import ShopSelect from '@/components/ShopSelect';
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

export default function TeamLeaderManagement() {
  const queryClient = useQueryClient();
  const [selectedLeader, setSelectedLeader] = useState<StaffResp | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null); // Track which ID is processing
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [size] = useState(10);

  // Forms
  const [newLeader, setNewLeader] = useState<StaffCreateReq>({
    username: '',
    name: '',
    phone: '',
    role: StaffRespRoleEnum.TEAMLEADER,
    password: '123',
    storeId: undefined,
  });

  const [editForm, setEditForm] = useState<StaffUpdateReq>({});

  // Fetch team leaders
  const { data: leadersResp, isLoading } = useQuery({
    queryKey: ['team-leaders', page, size],
    queryFn: () => TeamLeadersApi.list({ page, size }),
  });

  const teamLeaders = leadersResp?.data?.list || [];
  const total = leadersResp?.data?.total || 0;
  const totalPages = Math.ceil(total / size);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: StaffCreateReq) => TeamLeadersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leaders'] });
      toast.success('队长添加成功');
      setCreateModalOpen(false);
      setNewLeader({
        username: '',
        name: '',
        phone: '',
        role: StaffRespRoleEnum.TEAMLEADER,
        password: '123',
        storeId: undefined,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || '队长添加失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffUpdateReq }) =>
      TeamLeadersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leaders'] });
      toast.success('更新成功');
      setEditModalOpen(false);
      setPasswordModalOpen(false);
    },
    onError: (error: any) => toast.error(error.message || '更新失败'),
    onSettled: () => setActionLoading(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => TeamLeadersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leaders'] });
      toast.success('删除成功');
    },
    onError: (error: any) => toast.error(error.message || '删除失败'),
    onSettled: () => setActionLoading(null),
  });

  const handleDeleteOne = (id: number) => {
    if (confirm('确定要删除这个队长吗？')) {
      setActionLoading(id);
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (leader: StaffResp) => {
    if (!leader.id) return;
    const newStatus = leader.status === 1 ? 0 : 1;
    setActionLoading(leader.id);
    updateMutation.mutate({ id: leader.id, data: { status: newStatus } });
  };

  const openEdit = (leader: StaffResp) => {
    setSelectedLeader(leader);
    setEditForm({
      name: leader.name,
      phone: leader.phone,
      wechat: leader.wechat,
      storeId: leader.storeId,
    });
    setEditModalOpen(true);
  };

  const openPassword = (leader: StaffResp) => {
    setSelectedLeader(leader);
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (selectedLeader?.id) {
      updateMutation.mutate({ id: selectedLeader.id, data: editForm });
    }
  };

  const handlePasswordSubmit = () => {
    if (selectedLeader?.id && newPassword) {
      updateMutation.mutate({ id: selectedLeader.id, data: { password: newPassword } });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
         <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加队长
         </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">编号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">用户名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">姓名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">电话</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">店铺</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">微信号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={8} className="p-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : teamLeaders.length === 0 ? (
               <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">暂无数据</td>
               </tr>
            ) : (
              teamLeaders.map((leader) => (
                <tr
                  key={leader.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{leader.id}</td>
                  <td className="px-4 py-3 text-sm">{leader.username}</td>
                  <td className="px-4 py-3 text-sm">{leader.name}</td>
                  <td className="px-4 py-3 text-sm">{leader.phone}</td>
                  <td className="px-4 py-3 text-sm">{leader.storeId}</td>
                  <td className="px-4 py-3 text-sm">{leader.wechat}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={leader.status === 1 ? 'default' : 'secondary'}>
                        {leader.status === 1 ? '启用' : '禁用'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                       <Button variant="ghost" size="icon" title="详情" onClick={() => { setSelectedLeader(leader); setDetailModalOpen(true); }}>
                          <Eye className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="编辑" onClick={() => openEdit(leader)}>
                          <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" title="修改密码" onClick={() => openPassword(leader)}>
                          <KeyRound className="h-4 w-4" />
                       </Button>
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          title={leader.status === 1 ? '禁用' : '启用'}
                          className={leader.status === 1 ? 'text-orange-500' : 'text-green-500'}
                          onClick={() => handleStatusChange(leader)}
                          disabled={actionLoading === leader.id}
                       >
                          {actionLoading === leader.id && leader.status !== undefined ? ( // If we knew which action, we could be more specific. But usually only one action per row at a time.
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
                          onClick={() => leader.id && handleDeleteOne(leader.id)}
                          disabled={actionLoading === leader.id}
                       >
                          {actionLoading === leader.id ? (
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
            <DialogTitle>添加队长</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名 (登录账号) *</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newLeader.username}
                onChange={(e) => setNewLeader({ ...newLeader, username: e.target.value })}
                placeholder="输入用户名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newLeader.name}
                onChange={(e) => setNewLeader({ ...newLeader, name: e.target.value })}
                placeholder="输入姓名"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">电话</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newLeader.phone}
                onChange={(e) => setNewLeader({ ...newLeader, phone: e.target.value })}
                placeholder="输入电话"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">微信号</label>
              <input
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newLeader.wechat}
                onChange={(e) => setNewLeader({ ...newLeader, wechat: e.target.value })}
                placeholder="输入微信号"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                value={newLeader.password}
                onChange={(e) => setNewLeader({ ...newLeader, password: e.target.value })}
                placeholder="默认密码: 123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">所属店铺 *</label>
              <ShopSelect
                value={newLeader.storeId}
                returnId={true}
                onChange={(val) => setNewLeader({ ...newLeader, storeId: val })}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={() => createMutation.mutate(newLeader)} disabled={createMutation.isPending}>
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
            <DialogTitle>编辑队长</DialogTitle>
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
            <DialogTitle>修改密码 - {selectedLeader?.name}</DialogTitle>
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
             <DialogTitle>队长详情</DialogTitle>
          </DialogHeader>
          {selectedLeader && (
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">ID:</span> {selectedLeader.id}</div>
                <div><span className="text-muted-foreground">用户名:</span> {selectedLeader.username}</div>
                <div><span className="text-muted-foreground">姓名:</span> {selectedLeader.name}</div>
                <div><span className="text-muted-foreground">电话:</span> {selectedLeader.phone}</div>
                <div><span className="text-muted-foreground">微信号:</span> {selectedLeader.wechat}</div>
                <div><span className="text-muted-foreground">店铺ID:</span> {selectedLeader.storeId}</div>
                <div>
                   <span className="text-muted-foreground">状态:</span> 
                   <span className={selectedLeader.status === 1 ? 'text-green-600 ml-1' : 'text-gray-500 ml-1'}>
                      {selectedLeader.status === 1 ? '启用' : '禁用'}
                   </span>
                </div>
                <div><span className="text-muted-foreground">创建时间:</span> {selectedLeader.createdAt}</div>
             </div>
          )}
          <DialogFooter>
             <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
