import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Image } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ConsumesApi } from '@/services/admin';
import { ConsumeRecordResp } from '@/models';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type SortDirection = 'asc' | 'desc' | null;
type SortKey = keyof ConsumeRecordResp | null;

export default function ConsumeRecords() {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);

  const { data: consumeResp } = useQuery({
    queryKey: ['consumes'],
    queryFn: () => ConsumesApi.list({ page: 1, size: 100 }),
  });

  const consumeRecords = consumeResp?.data?.list || [];

  const handleSort = (key: keyof ConsumeRecordResp) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return consumeRecords;
    }

    return [...consumeRecords].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [consumeRecords, sortKey, sortDirection]);

  const SortIcon = ({ columnKey }: { columnKey: keyof ConsumeRecordResp }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-3 w-3 text-foreground" />;
    }
    return <ChevronDown className="h-3 w-3 text-foreground" />;
  };

  const columns: { key: keyof ConsumeRecordResp; label: string }[] = [
    { key: 'createdAt', label: '日期' },
    { key: 'memberId', label: '会员卡号' },
    { key: 'cardTypeName', label: '卡类型' },
    { key: 'memberName', label: '姓名' },
    { key: 'phone', label: '手机号码' },
    { key: 'idCard', label: '身份证号' },
    { key: 'consumeAmount', label: '消费金额' },
    { key: 'balance', label: '余额' },
    { key: 'applyStaffName', label: '业务员' },
    { key: 'receptionStaffName', label: '接待业务员' },
    { key: 'storeName', label: '店铺' },
    { key: 'roomNo', label: '房间号' },
    { key: 'remark', label: '备注' },
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:bg-muted/70 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon columnKey={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  暂无消费记录
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.createdAt?.split('T')[0]}
                  </td>
                  <td className="px-3 py-3 text-sm font-mono whitespace-nowrap">
                    {record.memberId}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.cardTypeName}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.memberName}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.phone}
                  </td>
                  <td className="px-3 py-3 text-sm font-mono whitespace-nowrap">
                    {record.idCard}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-red-600 whitespace-nowrap">
                    ¥{(record.consumeAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    ¥{(record.balance || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.applyStaffName}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.receptionStaffName || '-'}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.storeName}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.roomNo || '-'}
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">
                    {record.remark || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Voucher Preview Modal */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支付凭证</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="flex justify-center">
              <img
                src={selectedVoucher}
                alt="支付凭证"
                className="max-h-96 rounded-md border border-border"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
