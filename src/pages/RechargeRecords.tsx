import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter, Loader2 } from 'lucide-react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { RechargesApi, SalespersonsApi } from '@/services/admin';
import { RechargeResp } from '@/models';
import ShopSelect from '@/components/ShopSelect';
import SalesSelect from '@/components/SalesSelect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      storeId: selectedStore,
      staffId: selectedSales,
    }),
  });

  const rechargeRecords = rechargeResp?.data?.list || [];
  const total = rechargeResp?.data?.total || 0;
  const totalPages = Math.ceil(total / size);

  const staffIds = Array.from(
    new Set(
      rechargeRecords
        .map((r) => r.staffId)
        .filter((v): v is number => typeof v === 'number')
    )
  );
  const reviewerIds = Array.from(
    new Set(
      rechargeRecords
        .map((r) => r.reviewerId)
        .filter((v): v is number => typeof v === 'number')
    )
  );
  const uniqueIds = Array.from(new Set([...staffIds, ...reviewerIds]));
  const staffQueries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ['staff-detail', id],
      queryFn: () => SalespersonsApi.detail(id),
      enabled: !!id,
    })),
  });
  const staffNameMap = useMemo(() => {
    const map = new Map<number, string>();
    staffQueries.forEach((q) => {
      const s = q.data?.data;
      if (s?.id && s?.name) {
        map.set(s.id, s.name);
      }
    });
    return map;
  }, [staffQueries]);

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

  const filteredRecords = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return rechargeRecords;
    return rechargeRecords.filter((r) => {
      const fields = [r.memberName, r.cardNo, r.applyNo, String(r.memberId)];
      return fields.some((f) => String(f || '').toLowerCase().includes(q));
    });
  }, [rechargeRecords, memberSearch]);

  const sortedRecords = useMemo(() => {
    const data = filteredRecords;
    if (!sortKey || !sortDirection) {
      return data;
    }
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredRecords, sortKey, sortDirection]);

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
    { key: 'applyNo', label: '申请单号' },
    { key: 'cardNo', label: '会员卡号' },
    { key: 'memberName', label: '姓名' },
    { key: 'amount', label: '充值金额' },
    { key: 'giftAmount', label: '赠送金额' },
    { key: 'staffId', label: '业务员' },
    { key: 'status', label: '状态' },
    { key: 'reviewerId', label: '审核人' },
    { key: 'reviewedAt', label: '审核时间' },
    { key: 'rejectReason', label: '驳回原因' },
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
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{record.createdAt}</td>
                    <td className="px-3 py-3 text-sm font-mono whitespace-nowrap">{record.applyNo}</td>
                    <td className="px-3 py-3 text-sm font-mono whitespace-nowrap">{record.cardNo}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{record.memberName}</td>
                    <td className="px-3 py-3 text-sm font-medium text-green-600 whitespace-nowrap">+¥{(record.amount || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">¥{(record.giftAmount || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{staffNameMap.get(record.staffId as number) || record.staffId}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      {(() => {
                        const s = String(record.status || '');
                        const map: Record<string, { text: string; cls: string }> = {
                          PENDING: { text: '待审核', cls: 'bg-gray-100 text-gray-700' },
                          APPROVED: { text: '已通过', cls: 'bg-green-100 text-green-700' },
                          REJECTED: { text: '已拒绝', cls: 'bg-red-100 text-red-700' },
                          CANCELLED: { text: '已取消', cls: 'bg-orange-100 text-orange-700' },
                          VOID: { text: '已作废', cls: 'bg-muted text-muted-foreground' },
                        };
                        const m = map[s] || { text: s || '-', cls: 'bg-muted text-muted-foreground' };
                        return <Badge className={m.cls}>{m.text}</Badge>;
                      })()}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{(record.reviewerId && staffNameMap.get(record.reviewerId as number)) || record.reviewerId || '-'}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">{record.reviewedAt ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">{record.rejectReason || '-'}</td>
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
