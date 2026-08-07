import { financialService } from "../services/financialService.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      let status = 500;
      const msg = e.message || "";

      if (msg.includes("Forbidden") || msg.includes("permission")) {
        status = 403;
      } else if (msg.includes("Authentication") || msg.includes("authorized")) {
        status = 401;
      } else if (msg.includes("not found")) {
        status = 404;
      } else if (msg.includes("invalid") || msg.includes("required")) {
        status = 400;
      }

      sendError(req, res, msg || "Internal server error", status);
    });
}

// --- Budgets ---
export const createBudget = wrapAsync(async (req, res) => {
  const {
    eventId,
    name,
    totalAmount,
    startDate,
    endDate,
    categoryAllocations,
  } = req.body;
  if (!name) {
    return sendError(
      req,
      res,
      "Budget name is required",
      400,
      "VALIDATION_ERROR"
    );
  }

  const budget = await financialService.createBudget(
    { eventId, name, totalAmount, startDate, endDate, categoryAllocations },
    req.studentUser
  );
  return sendSuccess(res, budget, 201);
});

export const getBudgets = wrapAsync(async (req, res) => {
  const budgets = await financialService.getBudgets(req.studentUser);
  return sendSuccess(res, { budgets });
});

export const getBudgetById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const budget = await financialService.getBudgetById(id, req.studentUser);
  return sendSuccess(res, budget);
});

export const updateBudget = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await financialService.updateBudget(
    id,
    req.body,
    req.studentUser
  );
  return sendSuccess(res, updated);
});

export const deleteBudget = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const success = await financialService.deleteBudget(id, req.studentUser);
  return sendSuccess(res, { success });
});

export const cloneBudget = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { newEventId } = req.body;
  if (!newEventId) {
    return sendError(
      req,
      res,
      "newEventId is required to clone a budget",
      400,
      "VALIDATION_ERROR"
    );
  }
  const cloned = await financialService.cloneBudget(
    id,
    newEventId,
    req.studentUser
  );
  return sendSuccess(res, cloned, 201);
});

// --- Expenses ---
export const createExpense = wrapAsync(async (req, res) => {
  const { budgetId, eventId, name, amount, category, receiptUrl } = req.body;
  if (!name || amount === undefined || !category) {
    return sendError(
      req,
      res,
      "Name, amount, and category are required",
      400,
      "VALIDATION_ERROR"
    );
  }

  const expense = await financialService.createExpense(
    { budgetId, eventId, name, amount, category, receiptUrl },
    req.studentUser
  );
  return sendSuccess(res, expense, 201);
});

export const getExpenses = wrapAsync(async (req, res) => {
  const { budgetId } = req.query;
  if (!budgetId) {
    return sendError(
      req,
      res,
      "budgetId is required as query param",
      400,
      "VALIDATION_ERROR"
    );
  }
  const expenses = await financialService.getExpenses(
    budgetId,
    req.studentUser
  );
  return sendSuccess(res, { expenses });
});

export const updateExpense = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await financialService.updateExpense(
    id,
    req.body,
    req.studentUser
  );
  return sendSuccess(res, updated);
});

export const deleteExpense = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const success = await financialService.deleteExpense(id, req.studentUser);
  return sendSuccess(res, { success });
});

// --- Revenue ---
export const createRevenue = wrapAsync(async (req, res) => {
  const { budgetId, eventId, source, amount, description, receivedAt } =
    req.body;
  if (!source || amount === undefined) {
    return sendError(
      req,
      res,
      "Source and amount are required",
      400,
      "VALIDATION_ERROR"
    );
  }

  const revenue = await financialService.createRevenue(
    { budgetId, eventId, source, amount, description, receivedAt },
    req.studentUser
  );
  return sendSuccess(res, revenue, 201);
});

export const getRevenues = wrapAsync(async (req, res) => {
  const { budgetId } = req.query;
  if (!budgetId) {
    return sendError(
      req,
      res,
      "budgetId is required as query param",
      400,
      "VALIDATION_ERROR"
    );
  }
  const revenues = await financialService.getRevenues(
    budgetId,
    req.studentUser
  );
  return sendSuccess(res, { revenues });
});

export const deleteRevenue = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const success = await financialService.deleteRevenue(id, req.studentUser);
  return sendSuccess(res, { success });
});

// --- Reports & Calculations ---
export const getBudgetVariance = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const report = await financialService.getBudgetVariance(id, req.studentUser);
  return sendSuccess(res, report);
});

export const getIncomeStatement = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const report = await financialService.getIncomeStatement(id, req.studentUser);
  return sendSuccess(res, report);
});

export const getBudgetsUtilizationReport = wrapAsync(async (req, res) => {
  const report = await financialService.getBudgetsUtilizationReport(
    req.studentUser
  );
  return sendSuccess(res, { budgets: report });
});

export const exportReport = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { format = "csv" } = req.query;

  const result = await financialService.exportReport(
    id,
    format,
    req.studentUser
  );

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=budget_${id}_report.csv`
    );
    return res.status(200).send(result);
  }

  try {
    return sendSuccess(res, JSON.parse(result));
  } catch (error) {
    return sendError(res, 500, "Failed to parse report data as JSON");
  }
});

export const getRevenueReport = wrapAsync(async (req, res) => {
  const report = await financialService.getRevenueReport(req.studentUser);
  return sendSuccess(res, report);
});
