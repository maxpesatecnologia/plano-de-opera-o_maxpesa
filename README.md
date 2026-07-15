# Plano de Operação - Faturamento (Maxpesa)

Sistema de gestão operacional e financeira dos contratos da Maxpesa: planos de operação, faturamento, medições, receitas, custos, indicadores e projeções.

Stack: React 18 + Vite + Supabase (PostgreSQL) + Recharts + Leaflet + xlsx.

## Setup

1. Instalar dependências:
   ```
   npm install
   ```

2. Criar um projeto novo no [Supabase](https://supabase.com) (separado do RD CRM e do Mapa Frota).

3. No SQL Editor do Supabase, executar o arquivo `supabase_schema.sql` (na raiz deste projeto) para criar todas as tabelas.

4. Copiar `.env.example` para `.env` e preencher com a URL e a Anon Key do seu projeto Supabase:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
   ```

5. Rodar em desenvolvimento:
   ```
   npm run dev
   ```

## Importação da planilha

Na tela **Plano de Operação**, clique em "Importar Excel". As colunas são detectadas automaticamente por nome (Cliente, Placa, Gerente, Receita, etc. — ver aliases em `src/lib/excelParser.js`). Clientes, gerentes, obras e equipamentos que não existirem ainda são criados automaticamente durante a importação.

## O que já está implementado

- Dashboard com 9 cards de KPI e 6 gráficos (Receita por Cliente, Receita Mensal, Status das Faturas, Receita por Gerente, Mapa de Obras, Top 10 Clientes)
- Plano de Operação: tabela principal com filtros (cliente, gerente, equipamento, cidade, status, mês, ano), busca inteligente, ações (editar/excluir/visualizar/duplicar)
- Cadastro completo com todos os campos da planilha original
- Importação de Excel sem necessidade de mapear colunas manualmente
- Exportação em Excel, CSV e PDF
- Timeline por plano (Início → Medição → Aprovação → Emissão NF → Pagamento) com status por cor
- Calendário mensal com vencimentos, medições, aprovações e faturamentos
- Financeiro: indicadores (receita prevista/faturada/provisionada/perdida, margem, lucro operacional) + gráfico receita x custos
- Operacional: cards de equipamentos por status, com histórico ao clicar
- Dashboard Executivo: receita, projeção, margem, top clientes/equipamentos/gerentes, mapa das obras, evolução mensal, meta x realizado
- Assistente IA: responde as 5 perguntas de exemplo da spec com regras locais sobre os dados carregados (sem custo de API)
- Usuários: CRUD de perfis de acesso (Administrador, Financeiro, Operacional, Comercial, Diretoria)
- Alertas automáticos calculados em `src/lib/kpis.js` (medição atrasada, NF não emitida, plano vencido, equipamento parado, receita abaixo da previsão, custo acima da receita)

## Pendências (próximas sessões)

1. **Login / Supabase Auth** — hoje não há autenticação; a tela de Usuários cadastra perfis mas nada bloqueia telas por perfil ainda. Decidir se o login será por Supabase Auth (como no RD CRM) antes de implementar a matriz de permissões.
2. **Assistente IA com linguagem livre** — hoje responde só as 5 perguntas de exemplo com regras locais. Para perguntas livres, será necessário uma função de backend (Supabase Edge Function) que recebe os dados já agregados e chama a API da Claude — não deve ser feito direto do navegador (exporia a chave de API).
3. **Lat/Lng das obras** — o mapa (Dashboard e Executivo) só mostra obras com `lat`/`lng` preenchidos na tabela `obras`. Se a planilha só tiver cidade/UF, será preciso geocodificar uma vez (ex: API de geocoding) e salvar as coordenadas.
4. **Anexos (fotos/documentos)** — a tabela `anexos` existe no schema, mas a UI de upload/visualização ainda não foi implementada.
5. **Histórico de Alterações (audit trail)** — a tabela `historico_alteracoes` existe no schema, mas não há trigger nem UI registrando/mostrando as alterações ainda.
6. **SLA de alertas** — o prazo de "NF não emitida" está fixo em 5 dias úteis em `src/lib/kpis.js` (`NF_SLA_DIAS`). Ajustar para o SLA real da Maxpesa quando definido.
7. Testes automatizados, paginação de listas grandes, dark mode — mesmos itens pendentes dos outros dois projetos Maxpesa.
