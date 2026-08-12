import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableField } from './SortableField';
import { Sidebar } from './Sidebar';
import { LogicEditor } from './LogicEditor';

export const FormBuilder = () => {
  const [fields, setFields] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} Field`,
      required: false,
      options: [],
    };
    setFields([...fields, newField]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onAddField={addField} />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">Form Builder</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {fields.map((field) => (
                  <SortableField key={field.id} field={field} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
      <LogicEditor fields={fields} />
    </div>
  );
};
