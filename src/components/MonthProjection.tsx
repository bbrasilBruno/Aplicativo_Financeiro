import { format, getDaysInMonth, getDate } from 'date-fns'
import { TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/lib/supabaseClient' // <- Alteração aqui

interface MonthProjectionProps {
  transactions: Transaction[]
  selectedDate: Date
}

export function MonthProjection({ transactions, selectedDate }: MonthProjectionProps) {
  const today = new Date()
  const isCurrentMonth = format(selectedDate, 'yyyy-MM') === format(today, 'yyyy-MM')
  
  if (!isCurrentMonth) {
    return null
  }

  const currentDay = getDate(today)
  const daysInMonth = getDaysInMonth(selectedDate)
  const daysRemaining = daysInMonth - currentDay

  // Calcular receitas e despesas até hoje
  const currentIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date) <= today)
    .reduce((sum, t) => sum + t.amount, 0)

  const currentExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) <= today)
    .reduce((sum, t) => sum + t.amount, 0)

  // Calcular médias diárias
  const dailyIncomeAverage = currentDay > 0 ? currentIncome / currentDay : 0
  const dailyExpenseAverage = currentDay > 0 ? currentExpenses / currentDay : 0

  // Projeção para o final do mês
  const projectedIncome = currentIncome + (dailyIncomeAverage * daysRemaining)
  const projectedExpenses = currentExpenses + (dailyExpenseAverage * daysRemaining)
  const projectedBalance = projectedIncome - projectedExpenses

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Projeção do Mês
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Dia {currentDay} de {daysInMonth} • {daysRemaining} dias restantes
          </span>
        </div>

        <div className="grid gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Receitas projetadas:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(projectedIncome)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Despesas projetadas:</span>
            <span className="font-medium text-red-600">
              {formatCurrency(projectedExpenses)}
            </span>
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Saldo projetado:</span>
              <span className={`font-bold ${
                projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(projectedBalance)}
              </span>
            </div>
          </div>
        </div>

        {daysRemaining > 0 && (
          <div className="text-xs text-muted-foreground">
            Baseado na média diária atual
          </div>
        )}
      </CardContent>
    </Card>
  )
}
