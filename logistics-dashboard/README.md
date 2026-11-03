# LogiDash - Dashboard Analítico de Logística

Dashboard moderno e responsivo para monitoramento de métricas operacionais de logística.

## Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Estilização**: Tailwind CSS
- **Visualização de Dados**: Apache ECharts (via echarts-for-react)
- **Ícones**: Lucide React
- **Linguagem**: TypeScript

## Funcionalidades

- **Layout Responsivo**: Sidebar colapsável, Topbar com filtro de período
- **4 indicadores reais**: taxa de entregas concluídas, pendências atrasadas, valor das notas pendentes e quantidade de notas pendentes
- **3 Gráficos Interativos**:
  - Evolução da taxa de entregas concluídas
  - Filiais com maior índice de pendências atrasadas
  - Ocorrências registradas nas notas pendentes
- **Filtro de Período**: 7d, 30d, 90d, 6m, 12m, YTD
- **Tema Escuro na Sidebar** com design premium

## Como Executar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Entrar no diretório do projeto
cd logistics-dashboard

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

O dashboard estará disponível em `http://localhost:3000`.

### Build para Produção

```bash
npm run build
npm start
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── globals.css      # Estilos globais + Tailwind
│   ├── layout.tsx       # Layout raiz
│   └── page.tsx         # Página principal do dashboard
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx      # Sidebar lateral fixa
│   │   ├── Topbar.tsx       # Topbar com título e filtros
│   │   └── DashboardLayout.tsx # Layout combinado
│   ├── ui/
│   │   ├── KPICard.tsx      # Card de métrica individual
│   │   └── ChartCard.tsx    # Wrapper para gráficos ECharts
│   └── charts/
│       ├── OTIFLineChart.tsx           # Evolução da taxa de entregas concluídas
│       ├── CarrierDelayBarChart.tsx    # Índice de atraso por filial
│       └── ReturnReasonsDoughnutChart.tsx # Ocorrências nas notas pendentes
├── data/
│   └── mockData.ts      # Opções de período e dados de demonstração legados
├── lib/
│   └── utils.ts         # Utilitários (cn para className)
└── types/
    └── dashboard.ts     # Tipos TypeScript
```

## Personalização

### Cores do Tema

Edite `tailwind.config.js` para personalizar a paleta de cores:

```js
theme: {
  extend: {
    colors: {
      slate: { ... }, // Cores base
      // Adicione suas cores customizadas
    }
  }
}
```

### Integração com o Google Sheets

A rota `/api/metrics` lê as abas `Viagens` e `Pendencias` no servidor e agrega os dados para o dashboard. Por padrão, usa a planilha pública configurada no projeto via CSV do Google Sheets. Para apontar para outra planilha, crie `logistics-dashboard/.env.local`:

```ini
SHEETS_SHEET_ID=ID_DA_PLANILHA
```

Também é possível usar a URL do Apps Script Web App já configurada no projeto:

```ini
SHEETS_WEBAPP_URL=https://script.google.com/macros/s/ID_DA_IMPLANTACAO/exec
```

O acesso de leitura deve estar publicado para que o servidor Next.js consiga consultar as abas. O token de escrita usado pelos scripts Python não é necessário para leitura e não deve ser exposto ao navegador. A resposta da API é armazenada em cache por 60 segundos.

Os indicadores refletem os campos disponíveis: taxa de sucesso é calculada por `Sucessos / (Sucessos + Insucessos)` na aba `Viagens`; atraso, valor e quantidade são calculados a partir das notas filtradas na aba `Pendencias`. Os arrays de demonstração em `src/data/mockData.ts` não são usados para preencher os indicadores.

### Gráficos ECharts

Cada gráfico em `src/components/charts/` exporta um componente React que recebe `data` e `height` como props. Modifique as `option` do ECharts conforme necessário.

## Responsividade

- **Desktop (>1024px)**: Sidebar fixa expandida, grid 4 colunas KPIs, 2 colunas gráficos
- **Tablet (768-1024px)**: Sidebar colapsável, grid 2 colunas KPIs
- **Mobile (<768px)**: Sidebar overlay, grid 1 coluna, Topbar compacta

## Performance

- Componentes Client-side apenas onde necessário (`'use client'`)
- ECharts com resize automático via `ResizeObserver`
- Lazy loading de componentes pesados disponível via `next/dynamic`
- Otimização de bundle com `optimizePackageImports` no `next.config.js`

## Licença

MIT