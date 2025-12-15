import { Users, UserCog, CreditCard, Receipt, DollarSign, Calendar, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthApi } from '@/services/admin';
import { clearAuthToken } from '@/services/http';
import { toast } from 'sonner';
import { useState } from 'react';

// SidebarProps is no longer needed for page control, but might be used if we want to pass user info etc.
// But for now we remove the props requirement as routing handles it.
interface SidebarProps {
    className?: string;
}

const menuItems = [
  { id: 'team-leaders', label: '队长管理', icon: UserCog, path: '/dashboard/team-leaders' },
  { id: 'salespersons', label: '业务员管理', icon: Users, path: '/dashboard/salespersons' },
  { id: 'users', label: '用户管理', icon: CreditCard, path: '/dashboard/users' },
  { id: 'recharge', label: '充值记录', icon: DollarSign, path: '/dashboard/recharge' },
  { id: 'consume', label: '消费记录', icon: Receipt, path: '/dashboard/consume' },
  { id: 'rooms', label: '订房情况', icon: Calendar, path: '/dashboard/rooms' },
];

export default function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await AuthApi.logout();
    } catch (error) {
      console.error('Logout failed', error);
      // Even if API fails, we should clear token and redirect
    } finally {
      clearAuthToken();
      toast.success('已退出登录');
      navigate('/login');
      setLoading(false);
    }
  };

  return (
    <aside className={cn("fixed left-0 top-0 h-full w-56 bg-card border-r border-border flex flex-col", className)}>
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">KTV管理系统</h2>
      </div>
      <nav className="flex-1 p-4 flex flex-col">
        <ul className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
        
        <div className="pt-4 border-t border-border mt-auto">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {loading ? '退出中...' : '退出登录'}
          </button>
        </div>
      </nav>
    </aside>
  );
}
