import os
import re

filepath = r'admin-dashboard/src/pages/dashboard/AuditLogViewer.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import for exportToPDF
content = content.replace(
    "import { useState, useEffect, useCallback } from 'react';",
    "import { useState, useEffect, useCallback } from 'react';\nimport { exportToPDF } from '../../utils/exportPDF';"
)

# Find the Export CSV button and add Export PDF next to it
pattern_export = r'<button\s+onClick=\{\(\) => exportCSV\(logs\)\}\s+className="btn btn-sm btn-outline"\s*>\s*Export CSV\s*</button>'

# Also add the exportPDF wrapper just like exportCSV? 
# The exportToPDF takes (columns, data, filename)
export_pdf_button = '''<button
            onClick={() => exportCSV(logs)}
            className="btn btn-sm btn-outline"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              const columns = ['Timestamp', 'Admin ID', 'Action', 'IP Address', 'User Agent'];
              const data = logs.map(l => [
                new Date(l.timestamp).toLocaleString(),
                l.admin_id,
                l.action,
                l.ip_address || '-',
                l.user_agent || '-'
              ]);
              exportToPDF(columns, data, udit-logs-);
            }}
            className="btn btn-sm btn-outline"
            style={{ marginLeft: '8px' }}
          >
            Export PDF
          </button>'''

if re.search(pattern_export, content):
    content = re.sub(pattern_export, export_pdf_button, content)
else:
    # Let's search for "Export CSV" text
    content = content.replace(
        '''<button onClick={() => exportCSV(logs)} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 shadow-sm transition-colors">
              Export CSV
            </button>''',
        '''<button onClick={() => exportCSV(logs)} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 shadow-sm transition-colors">
              Export CSV
            </button>
            <button onClick={() => {
              const columns = ['Timestamp', 'Admin ID', 'Action', 'IP Address'];
              const data = logs.map(l => [
                new Date(l.timestamp).toLocaleString(),
                l.admin_id,
                l.action,
                l.ip_address || '-'
              ]);
              exportToPDF(columns, data, udit-logs-);
            }} className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 shadow-sm transition-colors ml-2">
              Export PDF
            </button>'''
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
