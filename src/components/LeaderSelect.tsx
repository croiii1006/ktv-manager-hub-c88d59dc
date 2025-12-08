import { useState, useRef, useEffect } from 'react';
import { useDataStore } from '@/contexts/DataStore';
import { cn } from '@/lib/utils';

interface LeaderSelectProps {
  value: string;
  onChange: (leaderId: string, leaderName: string) => void;
}

export default function LeaderSelect({ value, onChange }: LeaderSelectProps) {
  const { teamLeaders } = useDataStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredLeaders = teamLeaders.filter(
    (leader) =>
      leader.name.toLowerCase().includes(search.toLowerCase()) ||
      leader.leaderId.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLeader = teamLeaders.find((l) => l.leaderId === value);
  const displayValue = selectedLeader
    ? `${selectedLeader.leaderId} ${selectedLeader.name}`
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
                key={leader.leaderId}
                onClick={() => {
                  onChange(leader.leaderId, leader.name);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                  value === leader.leaderId && 'bg-accent'
                )}
              >
                {leader.leaderId} {leader.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
