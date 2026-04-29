import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedTransaction {
  type: 'INCOME' | 'EXPENSE' | null
  amount: number | null
  description: string
  category: string
  isTransaction: boolean
  isRecurring: boolean
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  isQuery: boolean
  queryType?: 'balance' | 'summary' | 'history' | 'recurring' | 'help'
  responseMessage: string
}

export async function parseWhatsAppMessage(
  message: string,
  userName: string,
  categories: string[],
): Promise<ParsedTransaction> {
  const prompt = `Você é um assistente financeiro brasileiro. Analise a mensagem do usuário "${userName}" e extraia informações financeiras.

Categorias disponíveis: ${categories.join(', ')}

Mensagem: "${message}"

Responda APENAS com JSON válido neste formato:
{
  "isTransaction": boolean,
  "isRecurring": boolean,
  "frequency": "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null,
  "isQuery": boolean,
  "queryType": "balance" | "summary" | "history" | "recurring" | "help" | null,
  "type": "INCOME" | "EXPENSE" | null,
  "amount": number | null,
  "description": "descrição da transação",
  "category": "nome da categoria",
  "responseMessage": "mensagem amigável de confirmação em português"
}

Regras:
- Se for registro de gasto/despesa pontual: isTransaction=true, isRecurring=false, type="EXPENSE"
- Se for registro de receita/ganho pontual: isTransaction=true, isRecurring=false, type="INCOME"
- Se mencionar "todo mês", "mensal", "fixo", "recorrente", "toda semana", "todo dia", "todo ano": isTransaction=true, isRecurring=true + frequency correto
- frequency: "MONTHLY" para mensal, "WEEKLY" para semanal, "DAILY" para diário, "YEARLY" para anual
- Se perguntar sobre recorrentes/fixos/mensalidades: isQuery=true, queryType="recurring"
- Se perguntar sobre saldo/extrato/gastos: isQuery=true, queryType=apropriado
- Se pedir ajuda ou não entender: isQuery=true, queryType="help"
- Valores como "50", "R$50", "cinquenta reais" → amount=50
- Escolha a categoria mais adequada da lista fornecida
- responseMessage deve ser amigável e confirmar a ação`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI não retornou JSON válido')
  return JSON.parse(jsonMatch[0])
}

export async function generateReport(
  userName: string,
  income: number,
  expense: number,
  topCategories: { name: string; total: number }[],
  period: string,
): Promise<string> {
  const balance = income - expense

  const prompt = `Gere um resumo financeiro amigável e motivacional em português para ${userName}.

Período: ${period}
Receitas: R$ ${income.toFixed(2)}
Despesas: R$ ${expense.toFixed(2)}
Saldo: R$ ${balance.toFixed(2)}
Top gastos: ${topCategories.map(c => `${c.name}: R$${c.total.toFixed(2)}`).join(', ')}

O resumo deve ser:
- Curto (máximo 5 linhas)
- Usar emojis
- Dar um conselho financeiro baseado nos dados
- Formato WhatsApp (sem markdown)`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : 'Erro ao gerar relatório.'
}
