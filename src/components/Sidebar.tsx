import { Users, UserCog, CreditCard, Receipt, DollarSign, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'team-leaders', label: '队长管理', icon: UserCog },
  { id: 'salespersons', label: '业务员管理', icon: Users },
  { id: 'users', label: '用户管理', icon: CreditCard },
  { id: 'recharge', label: '充值记录', icon: DollarSign },
  { id: 'consume', label: '消费记录', icon: Receipt },
  { id: 'rooms', label: '订房情况', icon: Calendar },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">KTV管理系统</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
