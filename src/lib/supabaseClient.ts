import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://yemeadnjxukajrkgigrp.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbWVhZG5qeHVrYWpya2dpZ3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzc5NDEsImV4cCI6MjA3NDIxMzk0MX0.WI2XfB5g1-mpoWjFl3B-4CWORBJ5kawNMdo-TZIKT5g'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return supabaseInstance
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = getSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return null
  }
}

// Tipos para o banco de dados
export interface DatabaseTransaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

// Tipo para o app
export type Transaction = {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  isRecurring: boolean
}

// Mapeamentos entre tipos do banco e do app
export function mapDatabaseToApp(dbTransaction: DatabaseTransaction): Transaction {
  return {
    id: dbTransaction.id,
    description: dbTransaction.description,
    amount: dbTransaction.amount,
    type: dbTransaction.type,
    category: dbTransaction.category,
    date: dbTransaction.date,
    isRecurring: dbTransaction.is_recurring,
  }
}

export function mapAppToDatabase(
  transaction: Omit<Transaction, 'id'>,
  userId: string
): Omit<DatabaseTransaction, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date,
    is_recurring: transaction.isRecurring,
  }
}

// Operações do Supabase
export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const supabase = getSupabase()
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error

    return data.map(mapDatabaseToApp)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    throw error
  }
}

export async function insertTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> {
  try {
    const supabase = getSupabase()
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const dbTransaction = mapAppToDatabase(transaction, user.id)

    const { data, error } = await supabase
      .from('transactions')
      .insert(dbTransaction)
      .select('*')
      .single()

    if (error) throw error

    return mapDatabaseToApp(data)
  } catch (error) {
    console.error('Erro ao inserir transação:', error)
    throw error
  }
}

export async function updateTransaction(transaction: Transaction): Promise<Transaction> {
  try {
    const supabase = getSupabase()
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { id, ...updateData } = transaction
    const dbUpdateData = mapAppToDatabase(updateData, user.id)

    const { data, error } = await supabase
      .from('transactions')
      .update(dbUpdateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) throw error

    return mapDatabaseToApp(data)
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    throw error
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const supabase = getSupabase()
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    throw error
  }
}
