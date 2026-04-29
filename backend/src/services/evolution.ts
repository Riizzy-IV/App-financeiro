import axios from 'axios'

const evolutionClient = axios.create({
  baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  headers: {
    apikey: process.env.EVOLUTION_API_KEY || '',
    'Content-Type': 'application/json',
  },
})

const instance = process.env.EVOLUTION_INSTANCE || 'financa'

export async function sendText(to: string, text: string) {
  const phone = to.replace(/\D/g, '')
  await evolutionClient.post(`/message/sendText/${instance}`, {
    number: phone,
    text,
  })
}

export async function sendList(to: string, title: string, items: { title: string; description?: string }[]) {
  const phone = to.replace(/\D/g, '')
  await evolutionClient.post(`/message/sendList/${instance}`, {
    number: phone,
    title,
    sections: [{ rows: items }],
  })
}

export async function getInstanceStatus() {
  const { data } = await evolutionClient.get(`/instance/fetchInstances`)
  return data
}
