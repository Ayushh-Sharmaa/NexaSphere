import { Router } from 'express';
import { financialController } from '../controllers/financialController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  cloneBudgetSchema,
  createExpenseSchema,
  updateExpenseSchema,
  createRevenueSchema,
} from '../validators/routes/financialServicesSchemas.js';

const router = Router();

router.post(
  '/budgets',
  validate(createBudgetSchema),
  auth('admin'),
  financialController.createBudget
);
router.get('/budgets', auth('student'), financialController.getBudgets);
router.get(
  '/budgets/utilization',
  auth('student'),
  financialController.getBudgetsUtilizationReport
);
router.get('/budgets/:budgetId', auth('student'), financialController.getBudgetById);
router.put(
  '/budgets/:budgetId',
  validate(updateBudgetSchema),
  auth('admin'),
  financialController.updateBudget
);
router.delete('/budgets/:budgetId', auth('admin'), financialController.deleteBudget);
router.post(
  '/budgets/:budgetId/clone',
  validate(cloneBudgetSchema),
  auth('admin'),
  financialController.cloneBudget
);

router.post(
  '/budgets/:budgetId/expenses',
  validate(createExpenseSchema),
  auth('admin'),
  financialController.createExpense
);
router.get('/budgets/:budgetId/expenses', auth('student'), financialController.getExpenses);
router.put(
  '/expenses/:expenseId',
  validate(updateExpenseSchema),
  auth('admin'),
  financialController.updateExpense
);
router.delete('/expenses/:expenseId', auth('admin'), financialController.deleteExpense);

router.post(
  '/budgets/:budgetId/revenues',
  validate(createRevenueSchema),
  auth('admin'),
  financialController.createRevenue
);
router.get('/budgets/:budgetId/revenues', auth('student'), financialController.getRevenues);
router.delete('/revenues/:revenueId', auth('admin'), financialController.deleteRevenue);

router.get('/budgets/:budgetId/variance', auth('student'), financialController.getBudgetVariance);
router.get('/budgets/:budgetId/income', auth('student'), financialController.getIncomeStatement);
router.get('/budgets/:budgetId/export', auth('student'), financialController.exportReport);

export default router;
