import React, { useState, useEffect, useCallback } from 'react';

// Validates a date value before formatting — avoids rendering literal
// "Invalid Date" text when the API returns a null or malformed timestamp.
function formatRevDate(value) {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString();
}
import { buildUrl } from '../../utils/runtimeConfig';

const pageStyle = {
  minHeight: '100vh',
  background: 'var(--bg, #0f172a)',
  color: 'var(--text, #f8fafc)',
  padding: '32px',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const cardStyle = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '16px',
};

const buttonStyle = (variant = 'primary') => ({
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  background:
    variant === 'primary'
      ? '#3b82f6'
      : variant === 'danger'
        ? '#ef4444'
        : variant === 'success'
          ? '#22c55e'
          : 'rgba(255,255,255,0.1)',
  color: '#ffffff',
  transition: 'all 0.2s ease',
});

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--text, #f8fafc)',
  fontSize: '14px',
  outline: 'none',
  marginBottom: '12px',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '500',
  color: 'var(--text-secondary, #94a3b8)',
  marginBottom: '6px',
};

const statusBadgeStyle = (status) => {
  const colors = {
    draft: { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' },
    submitted: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
    approved: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
    reimbursed: { bg: 'rgba(139, 92, 246, 0.2)', text: '#8b5cf6' },
    rejected: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  };
  const c = colors[status] || colors.draft;
  return {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    background: c.bg,
    color: c.text,
  };
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  textAlign: 'left',
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  fontSize: '12px',
  fontWeight: '600',
  color: 'var(--text-secondary, #94a3b8)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: '14px',
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  background: '#1e293b',
  borderRadius: '16px',
  padding: '32px',
  maxWidth: '560px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto',
  border: '1px solid rgba(255,255,255,0.1)',
};

const BUDGET_CATEGORIES = [
  'Venue',
  'Food & Drinks',
  'Equipment',
  'Marketing',
  'Speaker Fees',
  'Prizes',
  'Misc',
];
const REVENUE_SOURCES = ['Ticket Sales', 'Sponsorship', 'Donations', 'Merchandise', 'Other'];

export default function EventBudgetPage() {
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [variance, setVariance] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const [budgetForm, setBudgetForm] = useState({
    name: '',
    eventId: '',
    totalAmount: '',
    startDate: '',
    endDate: '',
    categoryAllocations: {},
  });

  const [expenseForm, setExpenseForm] = useState({
    name: '',
    amount: '',
    category: 'Misc',
    receiptUrl: '',
  });

  const [revenueForm, setRevenueForm] = useState({
    source: 'Ticket Sales',
    amount: '',
    description: '',
  });

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl('/api/budgets'));
      if (!res.ok) throw new Error('Failed to fetch budgets');
      const data = await res.json();
      setBudgets(data.budgets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExpenses = useCallback(async (budgetId) => {
    try {
      const res = await fetch(buildUrl(`/api/expenses?budgetId=${budgetId}`));
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchRevenues = useCallback(async (budgetId) => {
    try {
      const res = await fetch(buildUrl(`/api/revenues?budgetId=${budgetId}`));
      if (!res.ok) throw new Error('Failed to fetch revenues');
      const data = await res.json();
      setRevenues(data.revenues || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchVariance = useCallback(async (budgetId) => {
    try {
      const res = await fetch(buildUrl(`/api/budgets/${budgetId}/variance`));
      if (!res.ok) throw new Error('Failed to fetch variance');
      const data = await res.json();
      setVariance(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchIncomeStatement = useCallback(async (budgetId) => {
    try {
      const res = await fetch(buildUrl(`/api/budgets/${budgetId}/income-statement`));
      if (!res.ok) throw new Error('Failed to fetch income statement');
      const data = await res.json();
      setIncomeStatement(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const selectBudget = useCallback(
    async (budget) => {
      setSelectedBudget(budget);
      await Promise.allSettled([
        fetchExpenses(budget.id),
        fetchRevenues(budget.id),
        fetchVariance(budget.id),
        fetchIncomeStatement(budget.id),
      ]);
    },
    [fetchExpenses, fetchRevenues, fetchVariance, fetchIncomeStatement]
  );

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleCreateBudget = async () => {
    try {
      const res = await fetch(buildUrl('/api/budgets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...budgetForm,
          totalAmount: parseFloat(budgetForm.totalAmount) || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to create budget');
      setShowBudgetModal(false);
      setBudgetForm({
        name: '',
        eventId: '',
        totalAmount: '',
        startDate: '',
        endDate: '',
        categoryAllocations: {},
      });
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      const res = await fetch(buildUrl(`/api/budgets/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete budget');
      if (selectedBudget?.id === id) {
        setSelectedBudget(null);
        setExpenses([]);
        setRevenues([]);
        setVariance(null);
        setIncomeStatement(null);
      }
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateExpense = async () => {
    try {
      const res = await fetch(buildUrl('/api/expenses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          budgetId: selectedBudget.id,
          amount: parseFloat(expenseForm.amount) || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to create expense');
      setShowExpenseModal(false);
      setExpenseForm({ name: '', amount: '', category: 'Misc', receiptUrl: '' });
      fetchExpenses(selectedBudget.id);
      fetchVariance(selectedBudget.id);
      fetchIncomeStatement(selectedBudget.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateExpenseStatus = async (expenseId, newStatus) => {
    try {
      const res = await fetch(buildUrl(`/api/expenses/${expenseId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      fetchExpenses(selectedBudget.id);
      fetchVariance(selectedBudget.id);
      fetchIncomeStatement(selectedBudget.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(buildUrl(`/api/expenses/${expenseId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      fetchExpenses(selectedBudget.id);
      fetchVariance(selectedBudget.id);
      fetchIncomeStatement(selectedBudget.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateRevenue = async () => {
    try {
      const res = await fetch(buildUrl('/api/revenues'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...revenueForm,
          budgetId: selectedBudget.id,
          amount: parseFloat(revenueForm.amount) || 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to create revenue');
      setShowRevenueModal(false);
      setRevenueForm({ source: 'Ticket Sales', amount: '', description: '' });
      fetchRevenues(selectedBudget.id);
      fetchIncomeStatement(selectedBudget.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRevenue = async (revenueId) => {
    if (!window.confirm('Are you sure you want to delete this revenue entry?')) return;
    try {
      const res = await fetch(buildUrl(`/api/revenues/${revenueId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete revenue');
      fetchRevenues(selectedBudget.id);
      fetchIncomeStatement(selectedBudget.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await fetch(
        buildUrl(`/api/budgets/${selectedBudget.id}/export?format=${format}`)
      );
      if (!res.ok) throw new Error('Failed to export');

      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget_${selectedBudget.id}_report.csv`;
        a.click();
      } else {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget_${selectedBudget.id}_report.json`;
        a.click();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : 'Unknown';
  };

  const totalSpent = expenses
    .filter((e) => e.status === 'approved' || e.status === 'reimbursed')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={pageStyle}>
      <div
        style={{
          marginBottom: '32px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
          Event Budget Management
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
          Track budgets, expenses, revenue, and generate financial reports
        </p>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.1)',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: '#ef4444' }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ ...buttonStyle('ghost'), padding: '6px 12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '12px',
        }}
      >
        {['budgets', 'expenses', 'revenue', 'reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={tab !== 'budgets' && !selectedBudget}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: tab !== 'budgets' && !selectedBudget ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              background: activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeTab === tab ? '#3b82f6' : 'var(--text-secondary, #94a3b8)',
              opacity: tab !== 'budgets' && !selectedBudget ? 0.5 : 1,
            }}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div
          style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #94a3b8)' }}
        >
          Loading...
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && !loading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>All Budgets</h3>
            <button style={buttonStyle('primary')} onClick={() => setShowBudgetModal(true)}>
              + New Budget
            </button>
          </div>

          {budgets.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: 'center',
                padding: '48px',
                color: 'var(--text-secondary, #94a3b8)',
              }}
            >
              No budgets yet. Create your first budget to start tracking finances.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '16px',
              }}
            >
              {budgets.map((budget) => {
                const spent = expenses
                  .filter(
                    (e) =>
                      e.budgetId === budget.id &&
                      (e.status === 'approved' || e.status === 'reimbursed')
                  )
                  .reduce((sum, e) => sum + e.amount, 0);
                const percentage = budget.totalAmount > 0 ? (spent / budget.totalAmount) * 100 : 0;

                return (
                  <div
                    key={budget.id}
                    style={{
                      ...cardStyle,
                      cursor: 'pointer',
                      borderColor:
                        selectedBudget?.id === budget.id ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                    }}
                    onClick={() => {
                      selectBudget(budget);
                      setActiveTab('expenses');
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                          {budget.name}
                        </h4>
                        {budget.eventId && (
                          <span
                            style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}
                          >
                            Event: {budget.eventId}
                          </span>
                        )}
                      </div>
                      <button
                        style={{ ...buttonStyle('danger'), padding: '6px 12px', fontSize: '12px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBudget(budget.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
                        Total Budget
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>
                        {formatCurrency(budget.totalAmount)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
                        Spent
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: percentage > 100 ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {formatCurrency(spent)} ({Math.round(percentage)}%)
                      </span>
                    </div>

                    <div
                      style={{
                        height: '8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                        marginTop: '8px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(percentage, 100)}%`,
                          background: percentage > 100 ? '#ef4444' : '#22c55e',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && !loading && selectedBudget && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Expenses for {selectedBudget.name}
              </h3>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                Total: {formatCurrency(selectedBudget.totalAmount)} | Spent:{' '}
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <button style={buttonStyle('primary')} onClick={() => setShowExpenseModal(true)}>
              + Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: 'center',
                padding: '48px',
                color: 'var(--text-secondary, #94a3b8)',
              }}
            >
              No expenses yet. Add your first expense to start tracking.
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td style={tdStyle}>{expense.name}</td>
                    <td style={tdStyle}>{expense.category}</td>
                    <td style={tdStyle}>{formatCurrency(expense.amount)}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(expense.status)}>{expense.status}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {expense.status === 'submitted' && (
                          <button
                            style={{
                              ...buttonStyle('primary'),
                              padding: '6px 12px',
                              fontSize: '12px',
                            }}
                            onClick={() => handleUpdateExpenseStatus(expense.id, 'approved')}
                          >
                            Approve
                          </button>
                        )}
                        {expense.status === 'approved' && (
                          <button
                            style={{
                              ...buttonStyle('success'),
                              padding: '6px 12px',
                              fontSize: '12px',
                            }}
                            onClick={() => handleUpdateExpenseStatus(expense.id, 'reimbursed')}
                          >
                            Reimburse
                          </button>
                        )}
                        <button
                          style={{
                            ...buttonStyle('danger'),
                            padding: '6px 12px',
                            fontSize: '12px',
                          }}
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && !loading && selectedBudget && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Revenue for {selectedBudget.name}
              </h3>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                Total Revenue: {formatCurrency(totalRevenue)}
              </p>
            </div>
            <button style={buttonStyle('primary')} onClick={() => setShowRevenueModal(true)}>
              + Add Revenue
            </button>
          </div>

          {revenues.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                textAlign: 'center',
                padding: '48px',
                color: 'var(--text-secondary, #94a3b8)',
              }}
            >
              No revenue entries yet.
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((revenue) => (
                  <tr key={revenue.id}>
                    <td style={tdStyle}>{revenue.source}</td>
                    <td style={tdStyle}>{revenue.description || '-'}</td>
                    <td style={tdStyle}>{formatCurrency(revenue.amount)}</td>
                    <td style={tdStyle}>{formatRevDate(revenue.receivedAt)}</td>
                    <td style={tdStyle}>{formatDate(revenue.receivedAt)}</td>
                    <td style={tdStyle}>
                      <button
                        style={{ ...buttonStyle('danger'), padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleDeleteRevenue(revenue.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && !loading && selectedBudget && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Financial Reports for {selectedBudget.name}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={buttonStyle('primary')} onClick={() => handleExport('csv')}>
                Export CSV
              </button>
              <button style={buttonStyle()} onClick={() => handleExport('json')}>
                Export JSON
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '8px',
                }}
              >
                Total Budget
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>
                {formatCurrency(selectedBudget.totalAmount)}
              </div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '8px',
                }}
              >
                Total Spent
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                {formatCurrency(totalSpent)}
              </div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '8px',
                }}
              >
                Total Revenue
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                {formatCurrency(totalRevenue)}
              </div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '8px',
                }}
              >
                Net Profit/Loss
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: totalRevenue - totalSpent >= 0 ? '#22c55e' : '#ef4444',
                }}
              >
                {formatCurrency(totalRevenue - totalSpent)}
              </div>
            </div>
          </div>

          {variance && (
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Budget vs. Actual
              </h4>
              {variance.comparisons && variance.comparisons.length > 0 ? (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Budgeted</th>
                      <th style={thStyle}>Actual</th>
                      <th style={thStyle}>Variance</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variance.comparisons.map((comp) => (
                      <tr key={comp.category}>
                        <td style={tdStyle}>{comp.category}</td>
                        <td style={tdStyle}>{formatCurrency(comp.budgeted)}</td>
                        <td style={tdStyle}>{formatCurrency(comp.actual)}</td>
                        <td
                          style={{ ...tdStyle, color: comp.variance >= 0 ? '#22c55e' : '#ef4444' }}
                        >
                          {formatCurrency(comp.variance)}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={statusBadgeStyle(
                              comp.status === 'under_budget' ? 'approved' : 'rejected'
                            )}
                          >
                            {comp.status === 'under_budget' ? 'Under Budget' : 'Over Budget'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px' }}>
                  No category data available.
                </p>
              )}
            </div>
          )}

          {incomeStatement && (
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
                Income Statement
              </h4>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)' }}>
                  Total Revenue
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                  {formatCurrency(incomeStatement.totalRevenue)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)' }}>
                  Total Expenses
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                  -{formatCurrency(incomeStatement.totalExpenses)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  fontWeight: '600',
                }}
              >
                <span style={{ fontSize: '16px' }}>Net {incomeStatement.statementType}</span>
                <span
                  style={{
                    fontSize: '16px',
                    color: incomeStatement.netProfitOrLoss >= 0 ? '#22c55e' : '#ef4444',
                  }}
                >
                  {formatCurrency(incomeStatement.netProfitOrLoss)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab !== 'budgets' && !selectedBudget && !loading && (
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '48px',
            color: 'var(--text-secondary, #94a3b8)',
          }}
        >
          Please select a budget from the Budgets tab to view details.
        </div>
      )}

      {/* Create Budget Modal */}
      {showBudgetModal && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowBudgetModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowBudgetModal(false)}
        >
          <div
            style={modalStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-budget-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-budget-title" style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
              Create Budget
            </h3>
            <label style={labelStyle}>Budget Name *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g., KSS #154 Budget"
              value={budgetForm.name}
              onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
            />
            <label style={labelStyle}>Event ID (optional)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g., kss-154"
              value={budgetForm.eventId}
              onChange={(e) => setBudgetForm({ ...budgetForm, eventId: e.target.value })}
            />
            <label style={labelStyle}>Total Budget Amount ($) *</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="5000"
              value={budgetForm.totalAmount}
              onChange={(e) => setBudgetForm({ ...budgetForm, totalAmount: e.target.value })}
            />
            <label style={labelStyle}>Start Date</label>
            <input
              style={inputStyle}
              type="date"
              value={budgetForm.startDate}
              onChange={(e) => setBudgetForm({ ...budgetForm, startDate: e.target.value })}
            />
            <label style={labelStyle}>End Date</label>
            <input
              style={inputStyle}
              type="date"
              value={budgetForm.endDate}
              onChange={(e) => setBudgetForm({ ...budgetForm, endDate: e.target.value })}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button style={buttonStyle('ghost')} onClick={() => setShowBudgetModal(false)}>
                Cancel
              </button>
              <button style={buttonStyle('primary')} onClick={handleCreateBudget}>
                Create Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Expense Modal */}
      {showExpenseModal && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowExpenseModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowExpenseModal(false)}
        >
          <div
            style={modalStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-expense-title" style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
              Add Expense
            </h3>
            <label style={labelStyle}>Expense Name *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g., Venue Rental"
              value={expenseForm.name}
              onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
            />
            <label style={labelStyle}>Amount ($) *</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="500"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
            <label style={labelStyle}>Category</label>
            <select
              style={selectStyle}
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            >
              {BUDGET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <label style={labelStyle}>Receipt URL (optional)</label>
            <input
              style={inputStyle}
              type="url"
              placeholder="https://..."
              value={expenseForm.receiptUrl}
              onChange={(e) => setExpenseForm({ ...expenseForm, receiptUrl: e.target.value })}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button style={buttonStyle('ghost')} onClick={() => setShowExpenseModal(false)}>
                Cancel
              </button>
              <button style={buttonStyle('primary')} onClick={handleCreateExpense}>
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Revenue Modal */}
      {showRevenueModal && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowRevenueModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowRevenueModal(false)}
        >
          <div
            style={modalStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-revenue-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-revenue-title" style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600' }}>
              Add Revenue
            </h3>
            <label style={labelStyle}>Revenue Source *</label>
            <select
              style={selectStyle}
              value={revenueForm.source}
              onChange={(e) => setRevenueForm({ ...revenueForm, source: e.target.value })}
            >
              {REVENUE_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
            <label style={labelStyle}>Amount ($) *</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="1000"
              value={revenueForm.amount}
              onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })}
            />
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g., Ticket sales for event"
              value={revenueForm.description}
              onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button style={buttonStyle('ghost')} onClick={() => setShowRevenueModal(false)}>
                Cancel
              </button>
              <button style={buttonStyle('primary')} onClick={handleCreateRevenue}>
                Add Revenue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
