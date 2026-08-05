import React, { Component } from 'react';

// ErrorBoundary class component to catch rendering errors gracefully
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DataTable Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          border: '1px solid #fee2e2',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            Failed to render table data
          </h3>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Inner DataTable component that renders the actual table
function DataTableContent({ data, columns = [], emptyMessage = "No data available." }) {
  const rows = data == null ? [] : Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        border: '1px dashed #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <svg
          style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#cbd5e1' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      overflowX: 'auto',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px',
        color: '#334155'
      }}>
        <thead>
          <tr style={{
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            fontWeight: '600',
            color: '#475569'
          }}>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{
                  padding: '12px 16px',
                  whiteSpace: 'nowrap'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.id || row._id || rowIdx}
              style={{
                borderBottom: rowIdx === rows.length - 1 ? 'none' : '1px solid #f1f5f9',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  style={{
                    padding: '12px 16px'
                  }}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Wrapper export that wraps DataTableContent in ErrorBoundary
export default function DataTable(props) {
  return (
    <ErrorBoundary>
      <DataTableContent {...props} />
    </ErrorBoundary>
  );
}
