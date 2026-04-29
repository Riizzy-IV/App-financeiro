import { PrismaClient, CategoryType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Alimentação', type: CategoryType.EXPENSE, emoji: '🍔', color: '#ef4444' },
  { name: 'Transporte', type: CategoryType.EXPENSE, emoji: '🚗', color: '#f97316' },
  { name: 'Moradia', type: CategoryType.EXPENSE, emoji: '🏠', color: '#eab308' },
  { name: 'Saúde', type: CategoryType.EXPENSE, emoji: '🏥', color: '#22c55e' },
  { name: 'Educação', type: CategoryType.EXPENSE, emoji: '📚', color: '#3b82f6' },
  { name: 'Lazer', type: CategoryType.EXPENSE, emoji: '🎮', color: '#8b5cf6' },
  { name: 'Roupas', type: CategoryType.EXPENSE, emoji: '👕', color: '#ec4899' },
  { name: 'Outros (gasto)', type: CategoryType.EXPENSE, emoji: '💸', color: '#6b7280' },
  { name: 'Salário', type: CategoryType.INCOME, emoji: '💼', color: '#10b981' },
  { name: 'Freelance', type: CategoryType.INCOME, emoji: '💻', color: '#06b6d4' },
  { name: 'Investimentos', type: CategoryType.INCOME, emoji: '📈', color: '#6366f1' },
  { name: 'Outros (receita)', type: CategoryType.INCOME, emoji: '💰', color: '#84cc16' },
]

async function main() {
  const hash = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { phone: '5511999999999' },
    update: {},
    create: {
      name: 'Admin',
      phone: '5511999999999',
      email: 'admin@financa.com',
      password: hash,
    },
  })

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: `default-${cat.name}` },
      update: {},
      create: {
        id: `default-${cat.name}`,
        ...cat,
        isDefault: true,
        userId: user.id,
      },
    })
  }

  console.log('Seed concluído!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
