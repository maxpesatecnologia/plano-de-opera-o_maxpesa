-- ============================================================
-- Plano de Operação - Faturamento (Maxpesa)
-- Schema Supabase (PostgreSQL) — executar no SQL Editor do Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Clientes ──────────────────────────────────────────────────
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  cidade text,
  uf text,
  created_at timestamptz default now()
);

-- ── Gerentes de Contrato ──────────────────────────────────────
create table if not exists gerentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  created_at timestamptz default now()
);

-- ── Obras (local da operação) ─────────────────────────────────
create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  uf text,
  lat numeric,
  lng numeric,
  created_at timestamptz default now()
);

-- ── Equipamentos ──────────────────────────────────────────────
create table if not exists equipamentos (
  id uuid primary key default gen_random_uuid(),
  placa text,
  tipo text,
  status text default 'disponivel'
    check (status in ('disponivel','operacao','mobilizacao','desmobilizacao','parado','manutencao')),
  created_at timestamptz default now()
);

-- ── Usuários (perfis de acesso) ───────────────────────────────
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique not null,
  perfil text not null default 'operacional'
    check (perfil in ('administrador','financeiro','operacional','comercial','diretoria')),
  created_at timestamptz default now()
);

-- ── Planos de Operação (tabela principal) ─────────────────────
create table if not exists planos_operacao (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id),
  numero_plano text,
  equipamento_id uuid references equipamentos(id),
  obra_id uuid references obras(id),
  gerente_id uuid references gerentes(id),

  vencimento_medicao date,
  data_envio_medicao date,
  data_aprovacao_medicao date,
  emitido_fatura boolean default false,

  inicio_original date,
  termino_original date,
  dias_original integer,
  inicio_ajustado date,
  termino_ajustado date,
  dias integer,

  valor_hora numeric,
  horas_contratuais numeric,
  mobi numeric default 0,
  desmobi numeric default 0,
  valor_provisionado numeric default 0,
  receita numeric default 0,
  projecao_anual numeric default 0,
  crescimento numeric,

  fornecedor_terceiro text,
  custo_hora_terceiro numeric default 0,
  horas_terceiro numeric default 0,
  custo_terceiro numeric default 0,

  status_fatura text default 'pendente'
    check (status_fatura in ('faturado','pendente','em_aprovacao','em_medicao','atrasado')),
  numero_nf text,
  numero_locacao text,
  mes_faturamento text,
  observacoes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_planos_cliente on planos_operacao(cliente_id);
create index if not exists idx_planos_gerente on planos_operacao(gerente_id);
create index if not exists idx_planos_obra on planos_operacao(obra_id);
create index if not exists idx_planos_equipamento on planos_operacao(equipamento_id);
create index if not exists idx_planos_status on planos_operacao(status_fatura);

-- ── Medições ──────────────────────────────────────────────────
create table if not exists medicoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references planos_operacao(id) on delete cascade,
  data_medicao date,
  status text default 'pendente' check (status in ('pendente','aprovada','atrasada')),
  aprovado_em timestamptz,
  created_at timestamptz default now()
);

-- ── Faturamentos (uma linha por NF emitida) ───────────────────
create table if not exists faturamentos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references planos_operacao(id) on delete cascade,
  numero_nf text,
  valor numeric,
  data_emissao date,
  data_pagamento date,
  status text default 'pendente' check (status in ('pendente','pago','atrasado')),
  created_at timestamptz default now()
);

create index if not exists idx_faturamentos_plano on faturamentos(plano_id);
create index if not exists idx_faturamentos_emissao on faturamentos(data_emissao);

-- ── Terceiros (custos por plano) ──────────────────────────────
create table if not exists terceiros (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references planos_operacao(id) on delete cascade,
  fornecedor text,
  horas numeric,
  custo numeric,
  created_at timestamptz default now()
);

-- ── Anexos ────────────────────────────────────────────────────
create table if not exists anexos (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references planos_operacao(id) on delete cascade,
  tipo text check (tipo in ('foto','documento')),
  url text,
  nome text,
  created_at timestamptz default now()
);

-- ── Histórico de Alterações (audit trail) ─────────────────────
create table if not exists historico_alteracoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references planos_operacao(id) on delete cascade,
  usuario_id uuid references usuarios(id),
  campo text,
  valor_anterior text,
  valor_novo text,
  data timestamptz default now()
);

-- ── Trigger: updated_at automático em planos_operacao ─────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_planos_updated_at on planos_operacao;
create trigger trg_planos_updated_at
  before update on planos_operacao
  for each row execute function set_updated_at();
