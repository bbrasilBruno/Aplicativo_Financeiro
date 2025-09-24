import { z } from 'zod'

export const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(100, 'Descrição muito longa'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipo é obrigatório',
  }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  referenceMonth: z.number().min(0).max(11),
  referenceYear: z.number().min(2020).max(2030),
  isRecurring: z.boolean().default(false),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export const INCOME_CATEGORIES = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Outros',
] as const

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Outros',
] as const