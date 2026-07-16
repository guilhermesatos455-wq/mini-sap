# 📊 Mini-SAP Auditor Fiscal

> Uma plataforma moderna e intuitiva de auditoria fiscal e reconciliação automática de Notas Fiscais com relatórios de sistemas ERP (SAP).

Este projeto é uma ferramenta de auditoria de alto desempenho projetada para cruzar relatórios extraídos do SAP com arquivos de faturamento (XML, PDF e planilhas Excel). Ele automatiza o processo manual de conferência de valores, alíquotas e quantidades, gerando alertas de divergência em tempo real para evitar pagamentos indevidos e inconsistências fiscais.

---

## 🚀 Principais Funcionalidades

### 📂 1. Upload Interativo (Drag-and-Drop)
- Interface altamente polida e responsiva para arrastar e soltar arquivos.
- Suporte a múltiplos formatos: **PDF**, **XML**, **XLSX** e **XLS**.
- Indicadores visuais de estado de arraste e feedback instantâneo sobre arquivos anexados.

### ⚙️ 2. Motor de OCR com Barra de Progresso Real
- Integração nativa com **Tesseract.js** para leitura automática de faturas em PDF ou imagens digitalizadas.
- Barra de progresso visual em tempo real vinculada ao fluxo de leitura do OCR para que o usuário acompanhe o processamento de arquivos pesados sem ruído ou sensação de travamento.

### 🔍 3. Motor de Auditoria e Reconciliação (O Cruzamento)
- Algoritmo inteligente que realiza a comparação campo a campo entre a **Nota Fiscal** processada e o **Relatório SAP**.
- Detecção instantânea de divergências fiscais, como:
  - Diferença de preços unitários (ex: Nota Fiscal indica R$ 15,00 e o SAP indica R$ 12,00).
  - Inconsistência de quantidades de itens.
  - Alíquotas de impostos incorretas ou divergentes.
- Status claro para cada registro: **Reconciliado** (Verde) ou **Divergente** (Vermelho).

### 🛠️ 4. Painel de Diagnóstico em Tempo Real (Debug Log Panel)
- Monitoramento global através do `DebugLogContext` que intercepta e armazena os últimos 20 logs de erro/aviso (`console.error` e `console.warn`).
- Botão flutuante contextual de **Logs** que aparece automaticamente após falhas de leitura ou execução.
- Funcionalidades integradas de **Copiar Logs** e **Limpar Logs** para facilitar o diagnóstico e compartilhamento com o time técnico.

---

## 🛠️ Tecnologias Utilizadas

- **React 18** (Vite) - SPA de alta performance e carregamento instantâneo.
- **TypeScript** - Tipagem estática garantindo robustez e menos erros em produção.
- **Tailwind CSS** - Design System minimalista, moderno e totalmente responsivo.
- **Lucide React** - Conjunto de ícones vetoriais de alta fidelidade.
- **Tesseract.js** - Mecanismo de Reconhecimento Óptico de Caracteres (OCR).
- **SheetJS (XLSX)** - Leitura e parsing de planilhas complexas de relatórios SAP.

---

## 📦 Como Instalar e Rodar o Projeto

### Pré-requisitos
Certifique-se de ter o **Node.js** (versão 18 ou superior) instalado em sua máquina.

### Passos para Execução:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/mini-sap-auditor.git
   cd mini-sap-auditor
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   *O aplicativo estará acessível por padrão no endereço `http://localhost:3000` ou conforme indicado no terminal.*

4. **Gere a build de produção:**
   ```bash
   npm run build
   ```

---

## 📁 Estrutura de Diretórios Relevante

```text
├── src/
│   ├── components/            # Componentes reutilizáveis (DragAndDropZone, DebugLogPanel)
│   ├── context/               # Gerenciadores de Estado (DebugLogContext para capturar erros de runtime)
│   ├── pages/                 # Páginas principais do fluxo (Upload, Auditoria, Dashboard)
│   ├── utils/                 # Algoritmos de validação (auditUtils.ts) e processamento
│   ├── App.tsx                # Ponto de entrada do roteamento e casca visual
│   ├── main.tsx               # Renderizador principal do React
│   └── index.css              # Estilos globais e importações do Tailwind CSS
├── package.json               # Dependências do projeto e scripts npm
└── README.md                  # Este arquivo de documentação
```

---

## 💡 Como Usar a Ferramenta

1. **Carregar o Relatório SAP:** Acesse o painel e insira seu relatório de compras/pedidos extraído do SAP em formato Excel ou CSV.
2. **Importar as Notas Fiscais:** Arraste seus arquivos XML ou PDF para a zona de upload. O app usará OCR para extrair os dados de forma automatizada.
3. **Mapear as Colunas:** Caso as tabelas não tenham cabeçalhos padrão, use o mapeador manual para garantir que o sistema leia as colunas de preço, quantidade e ID corretamente.
4. **Visualizar Inconsistências:** O painel de reconciliação exibirá imediatamente onde estão as diferenças para tomada de decisão ágil.
