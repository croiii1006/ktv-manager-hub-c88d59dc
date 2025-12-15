import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamLeadersApi } from '@/services/admin';
import { cn } from '@/lib/utils';

interface LeaderSelectProps {
  value: number | undefined; // Changed to number to match API
  onChange: (leaderId: number, leaderName: string) => void;
}

export default function LeaderSelect({ value, onChange }: LeaderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: leadersResp } = useQuery({
    queryKey: ['team-leaders'],
    queryFn: () => TeamLeadersApi.list({ page: 1, size: 100 }), // Assuming max 100 leaders
  });

  const teamLeaders = leadersResp?.data?.list || [];

  const filteredLeaders = teamLeaders.filter(
    (leader) =>
      (leader.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      String(leader.id).includes(search)
  );

  const selectedLeader = teamLeaders.find((l) => l.id === value);
  const displayValue = selectedLeader
    ? `${selectedLeader.id} ${selectedLeader.name}`
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
        ref={inputRef}
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
        placeholder="搜索队长..."
        className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {filteredLeaders.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              无匹配结果
            </div>
          ) : (
            filteredLeaders.map((leader) => (
              <button
                key={leader.id}
                onClick={() => {
                  if (leader.id && leader.name) {
                    onChange(leader.id, leader.name);
                    setIsOpen(false);
                    setSearch('');
                  }
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                  value === leader.id && 'bg-accent'
                )}
              >
                {leader.id} {leader.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
