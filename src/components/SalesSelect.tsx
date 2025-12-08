import { useState, useRef, useEffect } from 'react';
import { useDataStore } from '@/contexts/DataStore';
import { cn } from '@/lib/utils';

interface SalesSelectProps {
  value: string;
  onChange: (salesId: string, salesName: string) => void;
}

export default function SalesSelect({ value, onChange }: SalesSelectProps) {
  const { salespersons } = useDataStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSales = salespersons.filter(
    (sp) =>
      sp.name.toLowerCase().includes(search.toLowerCase()) ||
      sp.salesId.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSales = salespersons.find((s) => s.salesId === value);
  const displayValue = selectedSales
    ? `${selectedSales.salesId} ${selectedSales.name}`
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
                key={sp.salesId}
                onClick={() => {
                  onChange(sp.salesId, sp.name);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                  value === sp.salesId && 'bg-accent'
                )}
              >
                {sp.salesId} {sp.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
