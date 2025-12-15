import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamLeadersApi } from '@/services/admin';
import { StaffCreateReq, StaffUpdateReq, StaffRespRoleEnum } from '@/models';
import ShopSelect from '@/components/ShopSelect';
import { toast } from 'sonner';

export default function TeamLeaderManagement() {
  const queryClient = useQueryClient();
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Fetch team leaders
  const { data: leadersResp } = useQuery({
    queryKey: ['team-leaders'],
    queryFn: () => TeamLeadersApi.list({ page: 1, size: 100 }),
  });

  const teamLeaders = leadersResp?.data?.list || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: StaffCreateReq) => TeamLeadersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leaders'] });
      toast.success('队长添加成功');
    },
    onError: () => toast.error('队长添加失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StaffUpdateReq }) =>
      TeamLeadersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leaders'] });
      toast.success('更新成功');
    },
    onError: () => toast.error('更新失败'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => TeamLeadersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leaders'] });
      toast.success('删除成功');
    },
    onError: () => toast.error('删除失败'),
  });

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDelete = async () => {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
    setDeleteMode(false);
  };

  const handleAddLeader = () => {
    createMutation.mutate({
      name: '新队长',
      phone: '',
      role: StaffRespRoleEnum.TEAMLEADER,
    });
  };

  const handleUpdateLeader = (
    leaderId: number,
    field: keyof StaffUpdateReq,
    value: any
  ) => {
    updateMutation.mutate({ id: leaderId, data: { [field]: value } });
  };

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
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              队长编号
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              姓名
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              电话
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              店铺
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              微信号
            </th>
          </tr>
        </thead>
        <tbody>
          {teamLeaders.map((leader) => (
            <tr
              key={leader.id}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              {deleteMode && (
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={leader.id !== undefined && selectedIds.has(leader.id)}
                    onChange={() => leader.id && toggleSelect(leader.id)}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
              )}
              <td className="px-4 py-3 text-sm font-mono text-foreground">
                {leader.id}
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  defaultValue={leader.name}
                  onBlur={(e) =>
                    leader.id && handleUpdateLeader(leader.id, 'name', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入姓名"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  defaultValue={leader.phone}
                  onBlur={(e) =>
                    leader.id && handleUpdateLeader(leader.id, 'phone', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入电话"
                />
              </td>
              <td className="px-4 py-3">
                {/* Similar to Salesperson, ShopSelect expects name but API uses ID. 
                    Skipping store update for now or assuming we display storeId.
                */}
                {/* <ShopSelect ... /> */}
                <span className="text-sm">{leader.storeId}</span>
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  defaultValue={leader.wechat}
                  onBlur={(e) =>
                    leader.id && handleUpdateLeader(leader.id, 'wechat', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入微信号"
                />
              </td>
            </tr>
          ))}
          <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3" colSpan={deleteMode ? 6 : 5}>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLeader}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  添加队长
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
                      onClick={handleDelete}
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
    </div>
  );
}
