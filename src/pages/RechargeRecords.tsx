import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useDataStore } from '@/contexts/DataStore';
import { RechargeRecord } from '@/types';

type SortDirection = 'asc' | 'desc' | null;
type SortKey = keyof RechargeRecord | null;

export default function RechargeRecords() {
  const { rechargeRecords } = useDataStore();
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: keyof RechargeRecord) => {
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
      return rechargeRecords;
    }

    return [...rechargeRecords].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [rechargeRecords, sortKey, sortDirection]);

  const SortIcon = ({ columnKey }: { columnKey: keyof RechargeRecord }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-3 w-3 text-foreground" />;
    }
    return <ChevronDown className="h-3 w-3 text-foreground" />;
  };

  const columns: { key: keyof RechargeRecord; label: string }[] = [
    { key: 'date', label: '日期' },
    { key: 'memberId', label: '会员卡号' },
    { key: 'cardType', label: '卡类型' },
    { key: 'memberName', label: '姓名' },
    { key: 'phone', label: '手机号码' },
    { key: 'idNumber', label: '身份证号' },
    { key: 'amount', label: '充值金额' },
    { key: 'giftAmount', label: '赠送金额' },
    { key: 'salesName', label: '业务员' },
    { key: 'shop', label: '店铺' },
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
                  暂无充值记录
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.date}
                  </td>
                  <td className="px-3 py-3 text-sm font-mono whitespace-nowrap">
                    {record.memberId}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.cardType}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.memberName}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.phone}
                  </td>
                  <td className="px-3 py-3 text-sm font-mono whitespace-nowrap">
                    {record.idNumber}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-green-600 whitespace-nowrap">
                    +¥{record.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
                    ¥{record.giftAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.salesName}
                  </td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap">
                    {record.shop}
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
    </div>
  );
}
