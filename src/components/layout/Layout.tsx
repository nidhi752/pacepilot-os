import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="flex justify-end p-4 border-b">
          <ThemeToggle />
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}