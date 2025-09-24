import React, { useState, useEffect } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Transaction } from '@/lib/supabaseClient'
import { transactionSchema} from '@/lib/validations'
import type { TransactionFormData } from '@/lib/validations'
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/lib/validations'

interface AddTransactionDialogProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void
  editingTransaction?: Transaction | null
  onUpdateTransaction?: (transaction: Transaction) => void
  trigger?: React.ReactNode
}


const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i)

export function AddTransactionDialog({
  onAddTransaction,
  editingTransaction,
  onUpdateTransaction,
  trigger,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    type: 'expense',
    category: '',
    referenceMonth: new Date().getMonth(),
    referenceYear: new Date().getFullYear(),
    isRecurring: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        const transactionDate = new Date(editingTransaction.date)
        setFormData({
          description: editingTransaction.description,
          amount: editingTransaction.amount,
          type: editingTransaction.type,
          category: editingTransaction.category,
          referenceMonth: transactionDate.getMonth(),
          referenceYear: transactionDate.getFullYear(),
          isRecurring: editingTransaction.isRecurring,
        })
      } else {
        setFormData({
          description: '',
          amount: 0,
          type: 'expense',
          category: '',
          referenceMonth: new Date().getMonth(),
          referenceYear: new Date().getFullYear(),
          isRecurring: false,
        })
      }
      setErrors({})
    }
  }, [open, editingTransaction])

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
  
    try {
      // Valida os dados
      const validatedData = transactionSchema.parse(formData);
  
      // Define quantos meses a transação deve se repetir
      const monthsToRepeat = validatedData.isRecurring ? 12 : 1;
  
      // Cria todas as transações
      const transactionsToAdd: Omit<Transaction, 'id'>[] = [];
  
      for (let i = 0; i < monthsToRepeat; i++) {
        const referenceDate = new Date(
          validatedData.referenceYear,
          validatedData.referenceMonth + i,
          1
        );
  
        transactionsToAdd.push({
          description: validatedData.description,
          amount: validatedData.amount,
          type: validatedData.type,
          category: validatedData.category,
          date: referenceDate.toISOString(),
          isRecurring: validatedData.isRecurring,
        });
      }
  
      if (editingTransaction && onUpdateTransaction) {
        // Atualiza a transação existente
        await onUpdateTransaction({
          ...transactionsToAdd[0], // Mantém apenas a primeira para edição
          id: editingTransaction.id,
        });
      } else {
        // Adiciona todas as transações recorrentes
        for (const t of transactionsToAdd) {
          await onAddTransaction(t);
        }
      }
  
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        try {
          const zodError = JSON.parse(error.message);
          const fieldErrors: Record<string, string> = {};
          zodError.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              fieldErrors[err.path[0]] = err.message;
            }
          });
          setErrors(fieldErrors);
        } catch {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: 'Erro ao salvar transação' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '',
    }))
    setErrors(prev => ({ ...prev, category: '' }))
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Nova Transação
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction 
              ? 'Edite os dados da transação abaixo.'
              : 'Adicione uma nova receita ou despesa.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Salário, Supermercado, etc."
              className={errors.description ? 'border-red-500' : ''}
              autoComplete="off"
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
              className={errors.amount ? 'border-red-500' : ''}
              autoComplete="off"
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-600">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceMonth">Mês de Referência</Label>
              <Select
                value={formData.referenceMonth.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, referenceMonth: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceYear">Ano</Label>
              <Select
                value={formData.referenceYear.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, referenceYear: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              name="recurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
            />
            <Label htmlFor="recurring">Transação recorrente (mensal)</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : editingTransaction ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
