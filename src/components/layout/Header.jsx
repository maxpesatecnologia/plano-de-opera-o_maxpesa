import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './layout.css';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/plano-operacao': 'Plano de Operação',
  '/cadastro': 'Cadastro',
  '/timeline': 'Timeline',
  '/calendario': 'Calendário',
  '/financeiro': 'Financeiro',
  '/operacional': 'Operacional',
  '/executivo': 'Dashboard Executivo',
  '/assistente': 'Assistente IA',
  '/usuarios': 'Usuários',
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'Plano de Operação';

  return (
    <header className="top-header">
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={22} />
      </button>

      <div className="header-left">
        <span className="header-title">{title}</span>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search size={16} />
          <input type="text" placeholder="Pesquisar cliente, plano, placa..." />
        </div>
        <div className="profile-container">
          <div className="profile-avatar" title="Usuário">U</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
