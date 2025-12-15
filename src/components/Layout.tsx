import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const location = useLocation();
  
  // Extract the last part of the path to determine the title
  // e.g. /dashboard/team-leaders -> team-leaders
  const currentPath = location.pathname.split('/').pop() || '';

  const pageTitles: Record<string, string> = {
    'team-leaders': '队长管理',
    'salespersons': '业务员管理',
    'users': '用户管理',
    'recharge': '充值记录',
    'consume': '消费记录',
    'rooms': '订房情况',
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 ml-56">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">
            {pageTitles[currentPath] || '管理系统'}
          </h1>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
