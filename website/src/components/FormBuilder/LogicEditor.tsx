import React from 'react';

export const LogicEditor = ({ fields }) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Conditional Logic</h3>
      {fields.length === 0 ? (
        <p className="text-sm text-gray-500">Add fields to configure logic.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Configure show/hide rules based on previous answers.
          </p>
          <button className="w-full bg-blue-50 text-blue-600 border border-blue-200 rounded-md py-2 text-sm font-medium hover:bg-blue-100">
            + Add Rule
          </button>
        </div>
      )}
    </div>
  );
};
