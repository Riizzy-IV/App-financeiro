import { processRecurring } from '../routes/recurring'

// Roda uma vez na inicialização e depois a cada 24h
export function startScheduler() {
  const run = async () => {
    try {
      const count = await processRecurring()
      if (count > 0) console.log(`[scheduler] ${count} transação(ões) recorrente(s) gerada(s)`)
    } catch (err) {
      console.error('[scheduler] erro ao processar recorrentes:', err)
    }
  }

  run()
  setInterval(run, 24 * 60 * 60 * 1000)
}
