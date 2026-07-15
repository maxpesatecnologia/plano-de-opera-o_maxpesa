import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { PlanoProvider } from './context/PlanoContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import PlanoOperacao from './pages/PlanoOperacao';
import Cadastro from './pages/Cadastro';
import Timeline from './pages/Timeline';
import Calendario from './pages/Calendario';
import Financeiro from './pages/Financeiro';
import Operacional from './pages/Operacional';
import Executivo from './pages/Executivo';
import Assistente from './pages/Assistente';
import Usuarios from './pages/Usuarios';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PlanoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="plano-operacao" element={<PlanoOperacao />} />
                <Route path="cadastro" element={<Cadastro />} />
                <Route path="cadastro/:id" element={<Cadastro />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="calendario" element={<Calendario />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="operacional" element={<Operacional />} />
                <Route path="executivo" element={<Executivo />} />
                <Route path="assistente" element={<Assistente />} />
                <Route path="usuarios" element={<Usuarios />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlanoProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
