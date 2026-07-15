import React, { useCallback, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Wallet, Truck, Menu, X,
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plano-operacao', icon: ClipboardList, label: 'Planos' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/operacional', icon: Truck, label: 'Operacional' },
];

const Layout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="layout-wrapper">
      <Sidebar onClose={closeDrawer} />

      {drawerOpen && (
        <div className="mobile-overlay" onClick={closeDrawer}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close-btn" onClick={closeDrawer}>
              <X size={22} />
            </button>
            <Sidebar isMobileDrawer onClose={closeDrawer} />
          </div>
        </div>
      )}

      <div className="main-content">
        <Header onMenuClick={openDrawer} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-item bottom-nav-more" onClick={openDrawer}>
          <Menu size={22} />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
