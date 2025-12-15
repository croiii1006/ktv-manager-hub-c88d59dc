import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SalespersonsApi } from '@/services/admin';
import { cn } from '@/lib/utils';

interface SalesSelectProps {
  value: number | undefined; // Changed to number to match API
  onChange: (salesId: number, salesName: string) => void;
}

export default function SalesSelect({ value, onChange }: SalesSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: salesResp } = useQuery({
    queryKey: ['salespersons'],
    queryFn: () => SalespersonsApi.list({ page: 1, size: 100 }), // Assuming max 100 salespersons
  });

  const salespersons = salesResp?.data?.list || [];

  const filteredSales = salespersons.filter(
    (sp) =>
      (sp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      String(sp.id).includes(search)
  );

  const selectedSales = salespersons.find((s) => s.id === value);
  const displayValue = selectedSales
    ? `${selectedSales.id} ${selectedSales.name}`
    : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={isOpen ? search : displayValue}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setSearch('');
        }}
        placeholder="搜索业务员..."
        className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {filteredSales.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              无匹配结果
            </div>
          ) : (
            filteredSales.map((sp) => (
              <button
                key={sp.id}
                onClick={() => {
                  if (sp.id && sp.name) {
                    onChange(sp.id, sp.name);
                    setIsOpen(false);
                    setSearch('');
                  }
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                  value === sp.id && 'bg-accent'
                )}
              >
                {sp.id} {sp.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
