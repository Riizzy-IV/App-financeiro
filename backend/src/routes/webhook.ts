import { FastifyInstance } from 'fastify'
import { handleIncomingMessage } from '../services/whatsapp-handler'

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/evolution', async (req, reply) => {
    const body = req.body as any

    // Evolution API envia evento MESSAGES_UPSERT para mensagens recebidas
    if (body?.event !== 'messages.upsert') {
      return reply.send({ ok: true })
    }

    const message = body?.data
    if (!message) return reply.send({ ok: true })

    // Ignora mensagens do próprio bot ou de grupos
    if (message.key?.fromMe || message.key?.remoteJid?.includes('@g.us')) {
      return reply.send({ ok: true })
    }

    const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '') || ''
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ''

    if (!phone || !text) return reply.send({ ok: true })

    // Processa em background sem bloquear o webhook
    setImmediate(() => handleIncomingMessage(phone, text))

    return reply.send({ ok: true })
  })
}
