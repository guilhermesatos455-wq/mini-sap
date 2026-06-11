
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
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Service Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('All AI endpoints failed:', error);
      throw error;
    }
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
