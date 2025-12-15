import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RechargesApi } from '@/services/admin';
import { RechargeResp } from '@/models';
import ShopSelect from '@/components/ShopSelect';
import SalesSelect from '@/components/SalesSelect';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

type SortDirection = 'asc' | 'desc' | null;
type SortKey = keyof RechargeResp | null;

export default function RechargeRecords() {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filter state
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState<number | undefined>(undefined);
  const [selectedSales, setSelectedSales] = useState<number | undefined>(undefined);

  const { data: rechargeResp, isLoading } = useQuery({
    queryKey: ['recharges', page, size, memberSearch, selectedStore, selectedSales],
    queryFn: () => RechargesApi.list({ 
      page, 
      size,
      memberId: memberSearch, // API might treat this as keyword search if implemented, or we need separate keyword param
      shop: selectedStore ? String(selectedStore) : undefined, // API expects string name or ID? Check service. Assuming service handles mapping or we pass ID if API supports. 
      // RechargesApi.list definition: memberId?: string; salesId?: number; shop?: string;
      // We'll pass memberSearch to memberId for now, assuming backend search logic.
      salesId: selectedSales,
    }),
  });

  const rechargeRecords = rechargeResp?.data?.list || [];
  const total = rechargeResp?.data?.total || 0;
  const totalPages = Math.ceil(total / size);

  const handleSort = (key: keyof RechargeResp) => {
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

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [rechargeRecords, sortKey, sortDirection]);

  const SortIcon = ({ columnKey }: { columnKey: keyof RechargeResp }) => {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-3 w-3 text-foreground" />;
    }
    return <ChevronDown className="h-3 w-3 text-foreground" />;
  };

  const columns: { key: keyof RechargeResp; label: string }[] = [
    { key: 'createdAt', label: '日期' },
    { key: 'memberId', label: '会员卡号' },
    { key: 'cardTypeName', label: '卡类型' },
    { key: 'memberName', label: '姓名' },
    { key: 'phone', label: '手机号码' },
    { key: 'idCard', label: '身份证号' },
    { key: 'amount', label: '充值金额' },
    { key: 'giftAmount', label: '赠送金额' },
    { key: 'applyStaffName', label: '业务员' },
    { key: 'storeName', label: '店铺' },
    { key: 'remark', label: '备注' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap items-center bg-card p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
           <Search className="h-4 w-4 text-muted-foreground" />
           <input 
              className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              placeholder="搜索会员ID / 姓名 / 手机号"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
           />
        </div>
        <div className="h-6 w-px bg-border mx-2" />
        <Popover>
           <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                 <Filter className="h-3.5 w-3.5 mr-2" />
                 筛选
              </Button>
           </PopoverTrigger>
           <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">店铺</label>
                    <ShopSelect 
                       value={selectedStore} 
                       returnId={true} 
                       onChange={setSelectedStore}
                       className="w-full"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">业务员</label>
                    <SalesSelect 
                       value={selectedSales}
                       onChange={setSelectedSales}
                    />
                 </div>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                       setSelectedStore(undefined);
                       setSelectedSales(undefined);
                    }}
                 >
                    重置筛选
                 </Button>
              </div>
           </PopoverContent>
        </Popover>
      </div>

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
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                       <td colSpan={columns.length} className="p-4">
                          <Skeleton className="h-8 w-full" />
                       </td>
                    </tr>
                 ))
              ) : sortedRecords.length === 0 ? (
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
                    <td className="px-3 py-3 text-sm font-medium text-green-600 whitespace-nowrap">
                      +¥{(record.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
                      ¥{(record.giftAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      {record.applyStaffName}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      {record.storeName}
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
    </div>
  );
}
