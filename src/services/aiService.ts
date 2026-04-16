
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIConfig {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

class AIService {
  private config: AIConfig = {
    endpoint: 'http://localhost:8080', // Llamafile base URL
    model: 'llamafile',
    temperature: 0.7,
    maxTokens: 1024,
  };

  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  async chat(messages: Message[], onStream?: (text: string) => void): Promise<string> {
    const endpoints = [this.config.endpoint, 'http://127.0.0.1:8080'];
    let lastError: any = null;

    for (const baseEndpoint of endpoints) {
      try {
        const prompt = messages.map(m => {
          const role = m.role === 'user' ? 'Usuário' : (m.role === 'system' ? 'Sistema' : 'Assistente');
          return `${role}: ${m.content}`;
        }).join('\n') + '\nAssistente:';

        const response = await fetch(`${baseEndpoint}/completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            stream: !!onStream,
            n_predict: this.config.maxTokens,
            temperature: this.config.temperature,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI Service Error: ${response.statusText}`);
        }

        if (onStream) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullText = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const parsed = JSON.parse(line.replace('data: ', ''));
                  const content = parsed.content || '';
                  fullText += content;
                  onStream(fullText);
                  if (parsed.stop) break;
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
          return fullText;
        } else {
          const data = await response.json();
          return data.content;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Failed to connect to ${baseEndpoint}, trying next...`);
        continue;
      }
    }

    console.error('All AI endpoints failed:', lastError);
    throw lastError;
  }

  // Helper to analyze audit data
  async analyzeAuditItem(item: any): Promise<string> {
    const prompt = `Analise a seguinte divergência de auditoria fiscal SAP:
    Material: ${item.materialDesc} (${item.material})
    Fornecedor: ${item.vendorName}
    Preço SAP: ${item.sapPrice}
    Preço NF: ${item.invoicePrice}
    Divergência: ${item.priceDiff} (${item.diffPercentage}%)
    CFOP: ${item.cfop}
    
    Explique brevemente por que isso pode ter ocorrido e sugira uma ação.`;

    return this.chat([{ role: 'user', content: prompt }]);
  }
}

export const aiService = new AIService();
