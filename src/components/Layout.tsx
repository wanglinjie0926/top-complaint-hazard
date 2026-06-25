import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { FileText, AlertCircle, LogOut, ChevronRight } from 'lucide-react';

export default function Layout() {
  const { currentUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/orders', icon: FileText, label: '隐患工单明细' },
    { path: '/complaints', icon: AlertCircle, label: '投诉工单明细' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <span className="text-blue-600 font-bold text-lg">TOP投诉小区隐患整治系统</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            {currentUser?.name}（{currentUser?.city}）
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm"
          >
            <LogOut size={16} />
            退出
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧菜单 */}
        <aside className="w-52 bg-white border-r border-gray-200 py-4 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
