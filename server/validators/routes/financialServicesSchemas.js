import { z } from 'zod';

// ── Budget Schemas ─────────────────────────────────────────────────────────────

/**
 * Schema for POST /budgets — create a budget (admin).
 */
export const createBudgetSchema = z
  .object({
    eventId: z.string().optional(),
    name: z.string().min(1, 'Budget name is required'),
    totalAmount: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    categoryAllocations: z.any().optional(),
  })
  .strict();

/**
 * Schema for PUT /budgets/:budgetId — update a budget (admin).
 */
export const updateBudgetSchema = z
  .object({
    eventId: z.string().optional(),
    name: z.string().min(1).optional(),
    totalAmount: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    categoryAllocations: z.any().optional(),
  })
  .strict();

/**
 * Schema for POST /budgets/:budgetId/clone — clone a budget (admin).
 */
export const cloneBudgetSchema = z
  .object({
    newEventId: z.string().min(1, 'newEventId is required'),
  })
  .strict();

// ── Expense Schemas ────────────────────────────────────────────────────────────

/**
 * Schema for POST /budgets/:budgetId/expenses — create an expense (admin).
 */
export const createExpenseSchema = z
  .object({
    budgetId: z.string().optional(),
    eventId: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    amount: z.number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    }),
    category: z.string().min(1, 'Category is required'),
    receiptUrl: z.string().optional(),
  })
  .strict();

/**
 * Schema for PUT /expenses/:expenseId — update an expense (admin).
 */
export const updateExpenseSchema = z
  .object({
    budgetId: z.string().optional(),
    eventId: z.string().optional(),
    name: z.string().min(1).optional(),
    amount: z.number().optional(),
    category: z.string().min(1).optional(),
    receiptUrl: z.string().optional(),
  })
  .strict();

// ── Revenue Schemas ────────────────────────────────────────────────────────────

/**
 * Schema for POST /budgets/:budgetId/revenues — create a revenue record (admin).
 */
export const createRevenueSchema = z
  .object({
    budgetId: z.string().optional(),
    eventId: z.string().optional(),
    source: z.string().min(1, 'Source is required'),
    amount: z.number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    }),
    description: z.string().optional(),
    receivedAt: z.string().optional(),
  })
  .strict();
