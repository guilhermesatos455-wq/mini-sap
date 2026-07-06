
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { chatWithGemini, ai } from './gemini';
import multer from 'multer';
import { ClientSecretCredential } from "@azure/identity";

// Initialize firebase admin
// Note: This assumes default credentials are available in the Cloud Run environment
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} catch (e) {
  console.error("Firebase Admin initialization failed:", e);
}


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiter for email sending
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Muitas solicitações de e-mail. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.use((err: any, req: any, res: any, next: any) => {
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Arquivo muito grande.' });
    } else {
      next(err);
    }
  });

  // API Route for AI Chat
  app.post('/api/ai/chat', async (req, res) => {
    const { messages } = req.body;
    try {
        const response = await chatWithGemini(messages);
        res.json({ content: response });
    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ error: 'Falha na comunicação com o Gemini.' });
    }
  });

  // API Route for fiscal document analysis via OCR text
  app.post('/api/analise-fiscal', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        return;
    }
    
    try {
        const base64 = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        
        const response = await ai.models.generateContent({
             model: "gemini-1.5-pro", 
             contents: {
               parts: [
                 { text: "Analise a nota fiscal ou documento fiscal e extraia os campos: { 'numeroNF', 'fornecedor', 'data', 'valorTotal', 'referencia_po', 'processo_imp', 'frete' }. Se não encontrar, retorne nulo. Apenas o JSON puro." },
                 { inlineData: { mimeType, data: base64 } }
               ]
             }
        });

        const jsonMatch = response.text.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        res.json(data);
    } catch (error) {
        console.error('OCR API Error:', error);
        res.status(500).json({ 
            error: 'Falha na análise fiscal.', 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
  });

  // API Route for sending emails
  app.post('/api/send-email', emailLimiter, async (req, res) => {
    const { to, subject, text, html, attachments } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ 
        error: 'Servidor de e-mail não configurado. Verifique as variáveis de ambiente SMTP.' 
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"NatuAssist" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        attachments
      });

      console.log('Message sent: %s', info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Falha ao enviar e-mail.', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for pushing data to Power BI
  app.post('/api/powerbi/push', async (req, res) => {
    const { data } = req.body;
    const url = process.env.POWERBI_PUSH_URL;
    
    if (!url) {
      return res.status(500).json({ error: 'POWERBI_PUSH_URL não configurado.' });
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        res.json({ success: true });
      } else {
        const errorText = await response.text();
        res.status(response.status).json({ error: 'Falha ao enviar para Power BI', details: errorText });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro na requisição ao Power BI', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // API Route for triggering Power BI dataset refresh
  app.post('/api/powerbi/refresh', async (req, res) => {
    const datasetId = process.env.POWERBI_DATASET_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!datasetId || !tenantId || !clientId || !clientSecret) {
      return res.status(500).json({ error: 'Configurações do Power BI não completas.' });
    }

    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const tokenResponse = await credential.getToken("https://analysis.windows.net/powerbi/api/.default");

      const refreshUrl = `https://api.powerbi.com/v1.0/myorg/datasets/${datasetId}/refreshes`;

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        res.json({ success: true, message: 'Refresh iniciado com sucesso.' });
      } else {
        const errorText = await response.text();
        res.status(response.status).json({ error: 'Falha ao iniciar refresh', details: errorText });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro no servidor', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
