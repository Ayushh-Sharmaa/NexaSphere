import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableField = ({ field }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 mb-2 bg-white border rounded-md shadow-sm cursor-move hover:border-blue-500"
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-700">{field.label}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{field.type}</span>
      </div>
    </div>
  );
};
