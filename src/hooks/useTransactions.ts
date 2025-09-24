import { useState, useEffect, useCallback } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { Transaction } from '@/lib/supabaseClient'
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  getCurrentUser,
} from '@/lib/supabaseClient'
import { generateLocalId } from '@/lib/utils'

const STORAGE_KEY = 'finance-app-transactions'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnlineMode, setIsOnlineMode] = useState(false)

  // Carregar transações do localStorage
  const loadFromLocalStorage = useCallback((): Transaction[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error)
      return []
    }
  }, [])

  // Salvar transações no localStorage
  const saveToLocalStorage = useCallback((transactions: Transaction[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
    }
  }, [])

  // Carregar transações iniciais
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true)
      
      try {
        const user = await getCurrentUser()
        
        if (user) {
          // Usuário autenticado - tentar carregar do Supabase
          try {
            const supabaseTransactions = await fetchTransactions()
            setTransactions(supabaseTransactions)
            setIsOnlineMode(true)
            // Salvar no localStorage como cache
            saveToLocalStorage(supabaseTransactions)
          } catch (error) {
            console.error('Erro ao carregar do Supabase, usando localStorage:', error)
            const localTransactions = loadFromLocalStorage()
            setTransactions(localTransactions)
            setIsOnlineMode(false)
          }
        } else {
          // Usuário não autenticado - usar localStorage
          const localTransactions = loadFromLocalStorage()
          setTransactions(localTransactions)
          setIsOnlineMode(false)
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
        const localTransactions = loadFromLocalStorage()
        setTransactions(localTransactions)
        setIsOnlineMode(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [loadFromLocalStorage, saveToLocalStorage])

  // Salvar no localStorage sempre que transactions mudar
  useEffect(() => {
    if (!isLoading) {
      saveToLocalStorage(transactions)
    }
  }, [transactions, isLoading, saveToLocalStorage])

  // Adicionar transação
  const addTransaction = useCallback(async (newTransaction: Omit<Transaction, 'id'>) => {
    try {
      if (isOnlineMode) {
        // Tentar salvar online
        const savedTransaction = await insertTransaction(newTransaction)
        setTransactions(prev => [savedTransaction, ...prev])
      } else {
        // Salvar offline
        const localTransaction: Transaction = {
          ...newTransaction,
          id: generateLocalId(),
        }
        setTransactions(prev => [localTransaction, ...prev])
      }
    } catch (error) {
      console.error('Erro ao adicionar transação online, salvando offline:', error)
      // Fallback para localStorage
      const localTransaction: Transaction = {
        ...newTransaction,
        id: generateLocalId(),
      }
      setTransactions(prev => [localTransaction, ...prev])
      setIsOnlineMode(false)
    }
  }, [isOnlineMode])

  // Atualizar transação
  const updateTransactionById = useCallback(async (updatedTransaction: Transaction) => {
    try {
      if (isOnlineMode && !updatedTransaction.id.startsWith('local_')) {
        // Tentar atualizar online
        const savedTransaction = await updateTransaction(updatedTransaction)
        setTransactions(prev =>
          prev.map(t => t.id === savedTransaction.id ? savedTransaction : t)
        )
      } else {
        // Atualizar offline
        setTransactions(prev =>
          prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
        )
      }
    } catch (error) {
      console.error('Erro ao atualizar transação online, atualizando offline:', error)
      // Fallback para localStorage
      setTransactions(prev =>
        prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
      )
      setIsOnlineMode(false)
    }
  }, [isOnlineMode])

  // Excluir transação
  const deleteTransactionById = useCallback(async (id: string) => {
    try {
      if (isOnlineMode && !id.startsWith('local_')) {
        // Tentar excluir online
        await deleteTransaction(id)
      }
      // Sempre remover do estado local
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Erro ao excluir transação online, removendo offline:', error)
      // Fallback para localStorage
      setTransactions(prev => prev.filter(t => t.id !== id))
      setIsOnlineMode(false)
    }
  }, [isOnlineMode])

  // Limpar todas as transações
  const clearAllTransactions = useCallback(() => {
    setTransactions([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Obter transações por mês
  const getTransactionsByMonth = useCallback((year: number, month: number) => {
    const startDate = startOfMonth(new Date(year, month))
    const endDate = endOfMonth(new Date(year, month))
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }, [transactions])

  // Obter transações recorrentes
  const getRecurringTransactions = useCallback(() => {
    return transactions.filter(transaction => transaction.isRecurring)
  }, [transactions])

  return {
    transactions,
    isLoading,
    isOnlineMode,
    addTransaction,
    updateTransaction: updateTransactionById,
    deleteTransaction: deleteTransactionById,
    clearAllTransactions,
    getTransactionsByMonth,
    getRecurringTransactions,
  }
}