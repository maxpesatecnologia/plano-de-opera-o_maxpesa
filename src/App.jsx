import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { PlanoProvider } from './context/PlanoContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlanoOperacao = lazy(() => import('./pages/PlanoOperacao'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Operacional = lazy(() => import('./pages/Operacional'));
const Executivo = lazy(() => import('./pages/Executivo'));
const Assistente = lazy(() => import('./pages/Assistente'));
const Usuarios = lazy(() => import('./pages/Usuarios'));

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PlanoProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="empty-state">Carregando...</div>}>
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
            </Suspense>
          </BrowserRouter>
        </PlanoProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
