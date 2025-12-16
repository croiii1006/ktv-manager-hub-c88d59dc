import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MembersApi } from '@/services/admin';
import { cn } from '@/lib/utils';

interface MemberSelectProps {
  value: number | undefined;
  onChange: (memberId: number, memberName: string) => void;
}

export default function MemberSelect({ value, onChange }: MemberSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: membersResp } = useQuery({
    queryKey: ['members-select'],
    queryFn: () => MembersApi.list({ page: 1, size: 100 }),
  });

  const members = membersResp?.data?.list || [];

  const filteredMembers = members.filter((m) => {
    const name = (m.name || '').toLowerCase();
    const phone = (m.phone || '').toLowerCase();
    const cardNo = (m.cardNo || '').toLowerCase();
    const idStr = String(m.id || '').toLowerCase();
    const kw = search.toLowerCase();
    return name.includes(kw) || phone.includes(kw) || cardNo.includes(kw) || idStr.includes(kw);
  });

  const selected = members.find((m) => m.id === value);
  const displayValue = selected ? `${selected.id} ${selected.name}${selected.phone ? ' / ' + selected.phone : ''}` : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
        placeholder="搜索会员（姓名/手机号/卡号/ID）"
        className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto">
          {filteredMembers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">无匹配结果</div>
          ) : (
            filteredMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (m.id && m.name) {
                    onChange(m.id, m.name);
                    setIsOpen(false);
                    setSearch('');
                  }
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                  value === m.id && 'bg-accent'
                )}
              >
                <div className="font-medium">{m.id} {m.name}</div>
                <div className="text-xs text-muted-foreground">{m.phone || '-'}{m.cardNo ? ` · 卡号：${m.cardNo}` : ''}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
