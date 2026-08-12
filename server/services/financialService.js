import { financialRepository } from '../repositories/financialRepository.js';

export class FinancialService {
  checkAccess(user, action, resource = null) {
    if (!user) {
      throw new Error('Authentication required');
    }

    const { role, id: userId } = user;

    if (role === 'admin' || role === 'treasurer') {
      return true;
    }

    if (role === 'organizer') {
      if (action === 'view_revenue_report') {
        throw new Error('Forbidden: Insufficient permissions');
      }
      if (!resource) {
        return true;
      }
      if (
        resource.createdBy === userId ||
        resource.submittedBy === userId ||
        resource.created_by === userId
      ) {
        return true;
      }
      throw new Error('Forbidden: Insufficient permissions for this resource');
    }

    throw new Error('Forbidden: Insufficient permissions');
  }

  // --- Budgets ---
  async createBudget(budgetData, user) {
    this.checkAccess(user, 'create_budget');

    const budget = {
      ...budgetData,
      createdBy: user.id,
    };

    const newBudget = await financialRepository.createBudget(budget);

    await financialRepository.insertAuditLog({
      action: 'CREATE_BUDGET',
      recordType: 'budget',
      recordId: newBudget.id,
      userId: user.id,
      changes: { new: newBudget },
    });

    return newBudget;
  }

  async getBudgetById(id, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'view_budget', budget);
    return budget;
  }

  async getBudgets(user) {
    this.checkAccess(user, 'list_budgets');
    const allBudgets = await financialRepository.getBudgets();

    if (user.role === 'organizer') {
      return allBudgets.filter((b) => b.createdBy === user.id);
    }
    return allBudgets;
  }

  async updateBudget(id, patch, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'edit_budget', budget);

    const updated = await financialRepository.updateBudget(id, patch);

    await financialRepository.insertAuditLog({
      action: 'UPDATE_BUDGET',
      recordType: 'budget',
      recordId: id,
      userId: user.id,
      changes: { old: budget, new: updated },
    });

    return updated;
  }

  async deleteBudget(id, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'delete_budget', budget);

    const success = await financialRepository.deleteBudget(id);
    if (success) {
      await financialRepository.insertAuditLog({
        action: 'DELETE_BUDGET',
        recordType: 'budget',
        recordId: id,
        userId: user.id,
        changes: { deleted: budget },
      });
    }
    return success;
  }

  async cloneBudget(id, newEventId, user) {
    const budget = await financialRepository.getBudgetById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }
    this.checkAccess(user, 'create_budget');

    const clonedData = {
      eventId: newEventId,
      name: `${budget.name} (Cloned)`,
      totalAmount: budget.totalAmount,
      startDate: budget.startDate,
      endDate: budget.endDate,
      categoryAllocations: budget.categoryAllocations,
    };

    return this.createBudget(clonedData, user);
  }

  // --- Expenses ---
  async createExpense(expenseData, user) {
    this.checkAccess(user, 'create_expense');

    const expense = {
      ...expenseData,
      status: 'submitted',
      submittedBy: user.id,
    };

    const newExpense = await financialRepository.createExpense(expense);

    await financialRepository.insertAuditLog({
      action: 'CREATE_EXPENSE',
      recordType: 'expense',
      recordId: newExpense.id,
      userId: user.id,
      changes: { new: newExpense },
    });

    return newExpense;
  }

  async getExpenseById(id, user) {
    const expense = await financialRepository.getExpenseById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    this.checkAccess(user, 'view_expense', expense);
    return expense;
  }

  async getExpenses(budgetId, user) {
    this.checkAccess(user, 'list_expenses');
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    if (user.role === 'organizer') {
      return expenses.filter((e) => e.submittedBy === user.id);
    }
    return expenses;
  }

  async updateExpense(id, patch, user) {
    const expense = await financialRepository.getExpenseById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    this.checkAccess(user, 'edit_expense', expense);

    if (patch.status && patch.status !== expense.status) {
      if (user.role !== 'admin' && user.role !== 'treasurer') {
        throw new Error('Forbidden: Only admins or treasurers can update expense status');
      }
      if (patch.status === 'approved' || patch.status === 'reimbursed') {
        patch.approvedBy = user.id;
      }
    }

    const updated = await financialRepository.updateExpense(id, patch);

    await financialRepository.insertAuditLog({
      action: patch.status ? `TRANSITION_EXPENSE_${patch.status.toUpperCase()}` : 'UPDATE_EXPENSE',
      recordType: 'expense',
      recordId: id,
      userId: user.id,
      changes: { old: expense, new: updated },
    });

    return updated;
  }

  async deleteExpense(id, user) {
    const expense = await financialRepository.getExpenseById(id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    this.checkAccess(user, 'delete_expense', expense);

    const success = await financialRepository.deleteExpense(id);
    if (success) {
      await financialRepository.insertAuditLog({
        action: 'DELETE_EXPENSE',
        recordType: 'expense',
        recordId: id,
        userId: user.id,
        changes: { deleted: expense },
      });
    }
    return success;
  }

  // --- Revenue ---
  /**
   * Creates a new revenue entry.
   *
   * Accepts an optional `idempotencyKey` inside `revenueData` (typically the
   * payment-provider transaction or webhook event ID).  When present, the
   * underlying INSERT is idempotent: concurrent or retried webhook deliveries
   * carrying the same key are deduplicated at the database level and return
   * the existing record rather than creating a duplicate.
   */
  async createRevenue(revenueData, user) {
    this.checkAccess(user, 'create_revenue');

    const revenue = {
      ...revenueData,
      createdBy: user.id,
      // Forward the idempotency key to the repository layer unchanged.
      idempotencyKey: revenueData.idempotencyKey || null,
    };

    const newRevenue = await financialRepository.createRevenue(revenue);

    await financialRepository.insertAuditLog({
      action: 'CREATE_REVENUE',
      recordType: 'revenue',
      recordId: newRevenue.id,
      userId: user.id,
      changes: { new: newRevenue },
    });

    return newRevenue;
  }

  async getRevenues(budgetId, user) {
    this.checkAccess(user, 'list_revenues');
    const revenues = await financialRepository.getRevenuesByBudgetId(budgetId);

    if (user.role === 'organizer') {
      return revenues.filter((r) => r.createdBy === user.id);
    }
    return revenues;
  }

  async deleteRevenue(id, user) {
    const revenue = await financialRepository.getRevenueById(id);
    if (!revenue) {
      throw new Error('Revenue entry not found');
    }
    this.checkAccess(user, 'delete_revenue', revenue);

    const success = await financialRepository.deleteRevenue(id);
    if (success) {
      await financialRepository.insertAuditLog({
        action: 'DELETE_REVENUE',
        recordType: 'revenue',
        recordId: id,
        userId: user.id,
        changes: { deleted: revenue },
      });
    }
    return success;
  }

  // --- Reports & Calculations ---
  async getBudgetVariance(budgetId, user) {
    const budget = await this.getBudgetById(budgetId, user);
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    const actualByCategory = {};
    expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .forEach((e) => {
        actualByCategory[e.category] = (actualByCategory[e.category] || 0) + e.amount;
      });

    const categories = Object.keys(budget.categoryAllocations);
    Object.keys(actualByCategory).forEach((cat) => {
      if (!categories.includes(cat)) {
        categories.push(cat);
      }
    });

    const comparisons = categories.map((category) => {
      const budgeted = budget.categoryAllocations[category] || 0;
      const actual = actualByCategory[category] || 0;
      const variance = budgeted - actual;
      return {
        category,
        budgeted,
        actual,
        variance,
        status: variance >= 0 ? 'under_budget' : 'over_budget',
      };
    });

    const totalBudgeted = budget.totalAmount;
    const totalActual = comparisons.reduce((sum, c) => sum + c.actual, 0);
    const totalVariance = totalBudgeted - totalActual;

    const utilization = totalBudgeted > 0 ? totalActual / totalBudgeted : 0;
    let alert = null;
    if (utilization >= 0.9) {
      alert = { alertLevel: '90%' };
    } else if (utilization >= 0.8) {
      alert = { alertLevel: '80%' };
    }

    return {
      budgetId,
      budgetName: budget.name,
      totalBudgeted,
      totalActual,
      totalVariance,
      comparisons,
      alert,
    };
  }

  async getCashFlowStatement(budgetId, user) {
    const budget = await this.getBudgetById(budgetId, user);
    const revenues = await financialRepository.getRevenuesByBudgetId(budgetId);
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    const approvedExpenses = expenses.filter(
      (e) => e.status === 'approved' || e.status === 'reimbursed'
    );

    const flows = [];

    revenues.forEach((r) => {
      flows.push({
        type: 'inflow',
        source: r.source,
        amount: r.amount,
        date: r.receivedAt,
      });
    });

    approvedExpenses.forEach((e) => {
      flows.push({
        type: 'outflow',
        source: e.name,
        amount: e.amount,
        date: e.createdAt,
      });
    });

    // Sort flows by date ascending
    flows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    const flowsWithBalance = flows.map((f) => {
      if (f.type === 'inflow') {
        runningBalance += f.amount;
      } else {
        runningBalance -= f.amount;
      }
      return {
        ...f,
        balance: runningBalance,
      };
    });

    return {
      budgetId,
      budgetName: budget.name,
      finalBalance: runningBalance,
      flows: flowsWithBalance,
    };
  }

  async getIncomeStatement(budgetId, user) {
    const budget = await this.getBudgetById(budgetId, user);
    const revenues = await financialRepository.getRevenuesByBudgetId(budgetId);
    const expenses = await financialRepository.getExpensesByBudgetId(budgetId);

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses
      .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfitOrLoss = totalRevenue - totalExpenses;

    return {
      budgetId,
      budgetName: budget.name,
      totalRevenue,
      totalExpenses,
      netProfitOrLoss,
      statementType: netProfitOrLoss >= 0 ? 'Profit' : 'Loss',
    };
  }

  async getBudgetsUtilizationReport(user) {
    const budgets = await this.getBudgets(user);
    const report = [];

    for (const budget of budgets) {
      const expenses = await financialRepository.getExpensesByBudgetId(budget.id);
      const spent = expenses
        .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
        .reduce((sum, e) => sum + e.amount, 0);

      report.push({
        budgetId: budget.id,
        name: budget.name,
        eventId: budget.eventId,
        totalAmount: budget.totalAmount,
        utilizedAmount: spent,
        remainingAmount: budget.totalAmount - spent,
        utilizationPercentage:
          budget.totalAmount > 0 ? Math.round((spent / budget.totalAmount) * 100) : 0,
      });
    }

    return report;
  }

  async exportReport(budgetId, format, user) {
    const budget = await this.getBudgetById(budgetId, user);

    if (format.toLowerCase() === 'csv') {
      const variance = await this.getBudgetVariance(budgetId, user);

      let csv = 'Category,Budgeted Amount,Actual Amount,Variance,Status\n';
      variance.comparisons.forEach((c) => {
        csv += `"${c.category}",${c.budgeted},${c.actual},${c.variance},"${c.status}"\n`;
      });
      csv += `\n"Total",${variance.totalBudgeted},${variance.totalActual},${variance.totalVariance},""\n`;
      return csv;
    }

    if (format.toLowerCase() === 'json') {
      const variance = await this.getBudgetVariance(budgetId, user);
      const income = await this.getIncomeStatement(budgetId, user);
      return JSON.stringify({ budget, variance, income }, null, 2);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  async getRevenueReport(user) {
    this.checkAccess(user, 'view_revenue_report');

    const revenues = await financialRepository.getAllRevenues();
    const eventMap = await financialRepository.getEventMap();

    // Total revenue by event
    const revenueByEventMap = {};
    revenues.forEach((r) => {
      if (r.isRefunded) return;
      const eventName = eventMap[r.eventId] || r.eventId || 'General / Non-Event';
      revenueByEventMap[eventName] = (revenueByEventMap[eventName] || 0) + r.amount;
    });
    const revenueByEvent = Object.keys(revenueByEventMap).map((name) => ({
      eventName: name,
      revenue: revenueByEventMap[name],
    }));

    // Payment method breakdown
    const paymentBreakdownMap = {};
    let totalPaidCount = 0;
    revenues.forEach((r) => {
      if (r.isRefunded) return;
      const method = r.paymentMethod || 'card';
      paymentBreakdownMap[method] = (paymentBreakdownMap[method] || 0) + r.amount;
      totalPaidCount++;
    });
    const paymentMethodBreakdown = Object.keys(paymentBreakdownMap).map((method) => ({
      method: method.toUpperCase(),
      amount: paymentBreakdownMap[method],
      percentage:
        totalPaidCount > 0
          ? Math.round(
              (paymentBreakdownMap[method] /
                revenues.reduce((sum, rev) => sum + (rev.isRefunded ? 0 : rev.amount), 0)) *
                100
            )
          : 0,
      percentage: totalPaidCount > 0 ? Math.round((paymentBreakdownMap[method] / revenues.reduce((sum, rev) => sum + (rev.isRefunded ? 0 : rev.amount), 0)) * 100) : 0,
    }));

    // Refund tracking
    const refunds = revenues
      .filter((r) => r.isRefunded || r.refundAmount > 0)
      .map((r) => ({
        id: r.id,
        eventName: eventMap[r.eventId] || r.eventId || 'General / Non-Event',
        source: r.source,
        amount: r.amount,
        refundAmount: r.refundAmount || r.amount,
        receivedAt: r.receivedAt,
      }));
    const totalRefunded = refunds.reduce((sum, r) => sum + r.refundAmount, 0);

    // Revenue by date trend
    const dailyRevenueMap = {};
    revenues.forEach((r) => {
      if (r.isRefunded) return;
      const dateStr = new Date(r.receivedAt).toISOString().split('T')[0];
      dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + r.amount;
    });
    const revenueTrend = Object.keys(dailyRevenueMap)
      .sort()
      .map((date) => ({
        date,
        revenue: dailyRevenueMap[date],
      }));

    // Tax summary
    const totalTax = revenues.reduce((sum, r) => sum + (r.isRefunded ? 0 : r.taxAmount), 0);
    const totalBeforeTax = revenues.reduce(
      (sum, r) => sum + (r.isRefunded ? 0 : r.amount - r.taxAmount),
      0
    );
    const totalRevenue = revenues.reduce((sum, r) => sum + (r.isRefunded ? 0 : r.amount), 0);

    return {
      stats: {
        totalRevenue,
        totalRefunded,
        totalTax,
        netRevenue: totalRevenue - totalRefunded,
      },
      revenueByEvent,
      paymentMethodBreakdown,
      refunds,
      revenueTrend,
      taxSummary: {
        totalBeforeTax,
        totalTax,
        totalRevenue,
      },
    };
  }
}

export const financialService = new FinancialService();
