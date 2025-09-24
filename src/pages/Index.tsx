import { useState } from 'react'
import { Wallet, Wifi, WifiOff } from 'lucide-react'
import { MonthSelector } from '@/components/MonthSelector'
import { BalanceCard } from '@/components/BalanceCard'
import { MonthProjection } from '@/components/MonthProjection'
import { TransactionCard } from '@/components/TransactionCard'
import { AddTransactionDialog } from '@/components/AddTransactionDialog'
import { Button } from '@/components/ui/button'
import { useTransactions } from '@/hooks/useTransactions'
import type { Transaction } from '@/lib/supabaseClient'

export function Index() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  const {
    isLoading,
    isOnlineMode,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
  } = useTransactions()

  const monthTransactions = getTransactionsByMonth(
    selectedDate.getFullYear(),
    selectedDate.getMonth()
  )

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleUpdateTransaction = async (transaction: Transaction) => {
    await updateTransaction(transaction)
    setEditingTransaction(null)
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando transações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Controle Financeiro</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {isOnlineMode ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-orange-600" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <AddTransactionDialog
            onAddTransaction={addTransaction}
            editingTransaction={editingTransaction}
            onUpdateTransaction={handleUpdateTransaction}
          />
        </div>

        {/* Month Selector */}
        <div className="mb-6">
          <MonthSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* Balance Cards */}
        <div className="mb-6">
          <BalanceCard transactions={monthTransactions} />
        </div>

        {/* Month Projection */}
        <div className="mb-6">
          <MonthProjection
            transactions={monthTransactions}
            selectedDate={selectedDate}
          />
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Transações ({monthTransactions.length})
            </h2>
            {monthTransactions.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {monthTransactions.filter(t => t.isRecurring).length} recorrentes
              </div>
            )}
          </div>

          {monthTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Nenhuma transação encontrada</p>
                <p className="text-sm">
                  Adicione sua primeira transação para começar a controlar suas finanças.
                </p>
              </div>
              <AddTransactionDialog
                onAddTransaction={addTransaction}
                trigger={
                  <Button>
                    Adicionar Primeira Transação
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {monthTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                  onDelete={deleteTransaction}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        {editingTransaction && (
          <AddTransactionDialog
            onAddTransaction={addTransaction}
            editingTransaction={editingTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            trigger={<div style={{ display: 'none' }} />}
          />
        )}
      </div>
    </div>
  )
}