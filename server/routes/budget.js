import { Router } from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';

const router = Router();

router.use(requireStudentAuth);

// Budget CRUD
router.get('/', budgetController.getAllBudgets);
router.get('/:id', budgetController.getBudgetById);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

// Expense Management
router.post('/:id/expenses', budgetController.addExpense);
router.get('/:id/expenses', budgetController.getExpenses);

// Invoice Management
router.post('/:id/invoice', budgetController.uploadInvoice);

// Approval Workflow
router.post('/:id/approve', budgetController.approveExpense);

// Remaining Budget
router.get('/:id/remaining', budgetController.getRemainingBudget);

// Category-wise Spending
router.get('/:id/categories', budgetController.getCategorySpending);

// Vendor Management
router.get('/vendors', budgetController.getVendors);
router.post('/vendors', budgetController.addVendor);

// Financial Reports
router.get('/reports', budgetController.getFinancialReports);

// Budget Alerts
router.get('/alerts', budgetController.getBudgetAlerts);

// Export Expense Statements
router.get('/export', budgetController.exportStatements);

// Historical Budget Comparison
router.get('/history', budgetController.getBudgetHistory);

export default router;
