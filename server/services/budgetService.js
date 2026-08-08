/**
 * Budget Management Service
 * Mock implementation for Intelligent Event Budget Planning & Expense Management
 */

const budgets = [
  {
    id: 1,
    event: 'Tech Fest 2026',
    totalBudget: 100000,
    spent: 25000,
    remaining: 75000,
    createdAt: new Date().toISOString(),
  },
];

const expenses = [];

const vendors = [
  {
    id: 1,
    name: 'ABC Printers',
    category: 'Printing',
  },
];

const reports = [];

const alerts = [];

const history = [];

// Get All Budgets
const getAllBudgets = async () => budgets;

// Get Budget By ID
const getBudgetById = async (id) => budgets.find((budget) => budget.id === Number(id));

// Create Budget
const createBudget = async (data) => {
  const nextId = budgets.length > 0 ? Math.max(...budgets.map((b) => b.id)) + 1 : 1;
  const budget = {
    id: nextId,
    spent: 0,
    remaining: data.totalBudget,
    createdAt: new Date().toISOString(),
    ...data,
  };

  budgets.push(budget);
  return budget;
};

// Update Budget
const updateBudget = async (id, data) => {
  const index = budgets.findIndex((budget) => budget.id === Number(id));

  if (index === -1) return null;

  budgets[index] = {
    ...budgets[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return budgets[index];
};

// Delete Budget
const deleteBudget = async (id) => {
  const numId = Number(id);
  const index = budgets.findIndex((budget) => budget.id === numId);

  if (index === -1) return null;

  // Cascade delete associated expenses
  for (let i = expenses.length - 1; i >= 0; i--) {
    if (expenses[i].budgetId === numId) {
      expenses.splice(i, 1);
    }
  }

  return budgets.splice(index, 1)[0];
};

// Add Expense
const addExpense = async (budgetId, data) => {
  const nextId = expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;
  const initialStatus = data.status || 'Pending';
  const expense = {
    id: nextId,
    budgetId: Number(budgetId),
    createdAt: new Date().toISOString(),
    ...data,
    status: initialStatus,
  };

  expenses.push(expense);

  if (initialStatus === 'Approved') {
    const budget = budgets.find((item) => item.id === Number(budgetId));
    if (budget) {
      budget.spent += Number(data.amount || 0);
      budget.remaining = budget.totalBudget - budget.spent;
    }
  }

  return expense;
};

// Get Expenses
const getExpenses = async (budgetId) =>
  expenses.filter((expense) => expense.budgetId === Number(budgetId));

// Upload Invoice
const uploadInvoice = async (budgetId, data) => ({
  budgetId: Number(budgetId),
  invoiceName: data.invoiceName,
  invoiceUrl: data.invoiceUrl,
  uploadedAt: new Date().toISOString(),
});

// Approve Expense
const approveExpense = async (expenseId) => {
  const expense = expenses.find((e) => e.id === Number(expenseId));
  if (!expense) return null;

  if (expense.status !== 'Approved') {
    expense.status = 'Approved';
    const budget = budgets.find((item) => item.id === expense.budgetId);
    if (budget) {
      budget.spent += Number(expense.amount || 0);
      budget.remaining = budget.totalBudget - budget.spent;
    }
  }

  return {
    success: true,
    expense,
    approvedAt: new Date().toISOString(),
  };
};

// Remaining Budget
const getRemainingBudget = async (budgetId) => {
  const budget = budgets.find((item) => item.id === Number(budgetId));

  return budget
    ? {
        totalBudget: budget.totalBudget,
        spent: budget.spent,
        remaining: budget.remaining,
      }
    : null;
};

// Category-wise Spending
const getCategorySpending = async (budgetId) => {
  const budgetExpenses = expenses.filter((expense) => expense.budgetId === Number(budgetId));

  const categories = {};

  budgetExpenses.forEach((expense) => {
    categories[expense.category] =
      (categories[expense.category] || 0) + Number(expense.amount || 0);
  });

  return categories;
};

// Vendors
const getVendors = async () => vendors;

const addVendor = async (data) => {
  const vendor = {
    id: vendors.length + 1,
    ...data,
  };

  vendors.push(vendor);
  return vendor;
};

// Financial Reports
const getFinancialReports = async () => reports;

// Budget Alerts
const getBudgetAlerts = async () => alerts;

// Export Statements
const exportStatements = async () => ({
  format: 'PDF',
  generatedAt: new Date().toISOString(),
  downloadUrl: '/exports/budget-report.pdf',
});

// Budget History
const getBudgetHistory = async () => history;

export {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  addExpense,
  getExpenses,
  uploadInvoice,
  approveExpense,
  getRemainingBudget,
  getCategorySpending,
  getVendors,
  addVendor,
  getFinancialReports,
  getBudgetAlerts,
  exportStatements,
  getBudgetHistory,
};
