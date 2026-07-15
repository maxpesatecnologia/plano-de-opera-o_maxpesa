import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, PlusSquare, GitCommitHorizontal, CalendarDays,
  Wallet, Truck, Users as UsersIcon, LineChart, Bot,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { SidebarLogo, SidebarLogoMark } from '../ui/MaxpesaLogo';
import './layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/plano-operacao', icon: ClipboardList, label: 'Plano de Operação' },
  { to: '/cadastro', icon: PlusSquare, label: 'Cadastro' },
  { to: '/timeline', icon: GitCommitHorizontal, label: 'Timeline' },
  { to: '/calendario', icon: CalendarDays, label: 'Calendário' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/operacional', icon: Truck, label: 'Operacional' },
  { to: '/executivo', icon: LineChart, label: 'Dashboard Executivo' },
  { to: '/assistente', icon: Bot, label: 'Assistente IA' },
  { to: '/usuarios', icon: UsersIcon, label: 'Usuários' },
];

const Sidebar = ({ onClose, isMobileDrawer = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {collapsed ? <SidebarLogoMark /> : <SidebarLogo />}
        {!isMobileDrawer && (
          <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      <div className="nav-links">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={19} className="nav-icon" />
            <span className="nav-text">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
