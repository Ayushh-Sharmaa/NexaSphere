import React from 'react';

const fieldTypes = [
  { type: 'text', label: 'Short Text' },
  { type: 'textarea', label: 'Long Text' },
  { type: 'email', label: 'Email' },
  { type: 'number', label: 'Number' },
  { type: 'select', label: 'Dropdown' },
  { type: 'radio', label: 'Single Choice' },
  { type: 'checkbox', label: 'Multiple Choice' },
  { type: 'date', label: 'Date' },
  { type: 'file', label: 'File Upload' },
];

export const Sidebar = ({ onAddField }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Form Elements</h3>
      <div className="space-y-2">
        {fieldTypes.map((field) => (
          <button
            key={field.type}
            onClick={() => onAddField(field.type)}
            className="w-full text-left px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-blue-500 text-sm font-medium text-gray-700 transition-colors"
          >
            + {field.label}
          </button>
        ))}
      </div>
    </div>
  );
};
