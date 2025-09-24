import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Edit, Trash2, Repeat } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/lib/supabaseClient' // <- Alteração aqui

interface TransactionCardProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === 'income'
  const Icon = isIncome ? TrendingUp : TrendingDown
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600'
  const iconColor = isIncome ? 'text-green-600' : 'text-red-600'

  const handleEdit = () => {
    onEdit(transaction)
  }

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      onDelete(transaction.id)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-2 rounded-full bg-gray-100 ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium truncate">
                  {transaction.description}
                </h3>
                {transaction.isRecurring && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Repeat className="h-3 w-3" />
                    <span>Mensal</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{transaction.category}</span>
                <span>•</span>
                <span>
                  {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`text-lg font-semibold ${amountColor}`}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                aria-label="Editar transação"
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                aria-label="Excluir transação"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
