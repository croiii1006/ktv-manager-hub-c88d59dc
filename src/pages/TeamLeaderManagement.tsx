import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useDataStore } from '@/contexts/DataStore';
import ShopSelect from '@/components/ShopSelect';
import { TeamLeader } from '@/types';

export default function TeamLeaderManagement() {
  const { teamLeaders, setTeamLeaders, generateLeaderId } = useDataStore();
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleDelete = () => {
    setTeamLeaders(teamLeaders.filter((l) => !selectedIds.has(l.leaderId)));
    setSelectedIds(new Set());
    setDeleteMode(false);
  };

  const handleAddLeader = () => {
    const newId = generateLeaderId();
    const newLeader: TeamLeader = {
      leaderId: newId,
      name: '',
      phone: '',
      shop: '',
      wechat: '',
    };
    setTeamLeaders([...teamLeaders, newLeader]);
    setEditingId(newId);
  };

  const handleUpdateLeader = (
    leaderId: string,
    field: keyof TeamLeader,
    value: string
  ) => {
    setTeamLeaders(
      teamLeaders.map((leader) =>
        leader.leaderId === leaderId ? { ...leader, [field]: value } : leader
      )
    );
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
              key={leader.leaderId}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              {deleteMode && (
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(leader.leaderId)}
                    onChange={() => toggleSelect(leader.leaderId)}
                    className="h-4 w-4 rounded border-border"
                  />
                </td>
              )}
              <td className="px-4 py-3 text-sm font-mono text-foreground">
                {leader.leaderId}
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={leader.name}
                  onChange={(e) =>
                    handleUpdateLeader(leader.leaderId, 'name', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入姓名"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={leader.phone}
                  onChange={(e) =>
                    handleUpdateLeader(leader.leaderId, 'phone', e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="输入电话"
                />
              </td>
              <td className="px-4 py-3">
                <ShopSelect
                  value={leader.shop}
                  onChange={(value) =>
                    handleUpdateLeader(leader.leaderId, 'shop', value)
                  }
                  className="w-full"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={leader.wechat}
                  onChange={(e) =>
                    handleUpdateLeader(leader.leaderId, 'wechat', e.target.value)
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
