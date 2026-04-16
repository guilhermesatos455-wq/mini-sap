# Mini-SAP Web Auditoria 🚀

O **Mini-SAP Web Auditoria** é uma ferramenta de auditoria físcal e financeira inteligente, projetada para simplificar a análise de divergências entre Notas Fiscais e registros SAP (CKM3). O diferencial estratégico do projeto é o uso de **IA Local (Llamafile)**, garantindo que dados sensíveis nunca saiam do ambiente controlado.

## 🌟 Funcionalidades Principais

- **Auditoria Automatizada**: Processamento de arquivos SAP (CKM3) e Notas Fiscais para detecção de divergências de preços, quantidades e impostos.
- **NatuAssist (IA Local)**: Assistente inteligente alimentado por um modelo Llama 8B rodando localmente (via pendrive), processando dados de auditoria com 100% de privacidade.
- **Segurança Robusta**: Autenticação via Google Firebase vinculada à Matrícula Funcional SAP.
- **Interface Moderna**: Dashboard responsivo com suporte a Dark Mode, gráficos de impacto financeiro e rastreabilidade de decisões.
- **Conformidade (Compliance)**: Registro de justificativas e histórico de decisões por auditor.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion (animações).
- **Backend/Auth**: Firebase Authentication & Firestore.
- **Processamento de Dados**: Web Workers para análise pesada de arquivos Excel/JSON sem travar a interface.
- **Motor de IA**: [Llamafile](https://github.com/Mozilla-Ocho/llamafile) rodando localmente na porta 8080.

## 🚀 Como Iniciar

### Pré-requisitos

1. **Node.js**: Instalado na versão 18 ou superior.
2. **Ambiente Local**: Pendrive com o executável Llamafile configurado com o modelo `llama-manual`.

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mini-sap-web.git

# Entre no diretório
cd mini-sap-web

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Configuração da IA

Para que o assistente funcione, o servidor Llamafile deve estar ativo:
1. Conecte o pendrive.
2. Execute o servidor local:
   ```bash
   ./llamafile-server --model llama-manual.gguf --port 8080
   ```
3. O site se conectará automaticamente via `http://localhost:8080`.

## 🛡️ Segurança e Privacidade

- **LGPD/Privacidade**: Como os dados de auditoria são processados localmente pela IA, o projeto está em conformidade com as políticas rígidas de privacidade de dados.
- **CORS**: Certifique-se de configurar as origens permitidas ao rodar servidores locais se necessário.

## 📄 Licença

Este projeto é de uso interno para auditoria SAP. Consulte os termos de uso na aba "Termos e LGPD" dentro da aplicação.

---
Desenvolvido para modernizar a auditoria fiscal com o poder da Inteligência Artificial.
