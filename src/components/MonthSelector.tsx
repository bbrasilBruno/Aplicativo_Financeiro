import React from 'react'
import { format, addMonths, subMonths, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MonthSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function MonthSelector({ selectedDate, onDateChange }: MonthSelectorProps) {
  const today = new Date()
  const isCurrentMonth = isSameMonth(selectedDate, today)

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1))
  }

  const handleToday = () => {
    onDateChange(today)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {!isCurrentMonth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-sm"
              >
                Hoje
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}