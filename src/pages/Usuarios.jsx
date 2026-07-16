import React, { useEffect, useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const PERFIS = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'diretoria', label: 'Diretoria' },
];

export default function Usuarios() {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: '', email: '', perfil: 'operacional' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('po_usuarios').select('*').order('nome');
    if (error) toast?.error(`Erro ao carregar usuários: ${error.message}`);
    setUsuarios(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('po_usuarios').insert(form);
    setSaving(false);
    if (error) { toast?.error(`Erro ao criar usuário: ${error.message}`); return; }
    toast?.success('Usuário criado');
    setForm({ nome: '', email: '', perfil: 'operacional' });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este usuário?')) return;
    const { error } = await supabase.from('po_usuarios').delete().eq('id', id);
    if (error) { toast?.error(`Erro ao excluir: ${error.message}`); return; }
    load();
  };

  return (
    <div>
      <div className="page-header"><h1>Usuários</h1></div>

      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Novo Usuário</h3>
        <form onSubmit={handleAdd} className="form-grid" style={{ alignItems: 'end' }}>
          <div className="form-group">
            <label>Nome</label>
            <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Perfil</label>
            <select value={form.perfil} onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value }))}>
              {PERFIS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <button type="submit" className="btn-primary" disabled={saving}><UserPlus size={16} /> {saving ? 'Salvando...' : 'Adicionar'}</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="empty-state">Carregando...</div>
      ) : usuarios.length === 0 ? (
        <div className="empty-state">Nenhum usuário cadastrado ainda.</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Ações</th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-pendente">{PERFIS.find((p) => p.value === u.perfil)?.label || u.perfil}</span></td>
                  <td><button className="btn-ghost" onClick={() => handleDelete(u.id)}><Trash2 size={16} color="#E53E3E" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-muted text-xs" style={{ marginTop: '1rem' }}>
        Esta tela cadastra os perfis de acesso, mas o login/autenticação (Supabase Auth) e o bloqueio de telas por perfil
        ainda não estão implementados — é um dos pontos pendentes da próxima sessão.
      </p>
    </div>
  );
}
