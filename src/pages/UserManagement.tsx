import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDataStore } from '@/contexts/DataStore';
import SalesSelect from '@/components/SalesSelect';
import { Member, CARD_TYPES } from '@/types';
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
    consumeRecords,
  } = useDataStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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

  const handleRecharge = () => {
    toast({
      title: '充值功能',
      description: '充值表单已打开（演示功能）',
    });
  };

  const handleConsume = () => {
    toast({
      title: '消费功能',
      description: '消费表单已打开（演示功能）',
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
        open={!!selectedMember}
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

            <div className="flex justify-end gap-3">
              <Button onClick={handleRecharge}>充值</Button>
              <Button variant="outline" onClick={handleConsume}>
                消费
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
