import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
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
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <main className="flex-1 ml-56">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">
            {pageTitles[currentPage] || '管理系统'}
          </h1>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
