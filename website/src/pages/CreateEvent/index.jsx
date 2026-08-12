import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CreateEvent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Core Form Input State Management Object Hooks
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    capacity: '',
    tags: [],
    checklist: [],
    // ⚠️ Explicit isolation fields kept empty to force clean calendar interaction inputs
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isHybrid: false,
    videoLink: '',
    location: '',
  });

  // Intercept inbound configuration payloads when navigating from the Template Library
  useEffect(() => {
    if (location.state && location.state.template) {
      const template = location.state.template;

      setFormData((prev) => ({
        ...prev,
        title: `Copy of ${template.title}`,
        description: template.description || '',
        category: template.category || '',
        duration: template.defaultDuration || '',
        capacity: template.defaultCapacity || '',
        tags: template.tags || [],
        checklist: template.checklist
          ? typeof template.checklist === 'string'
            ? JSON.parse(template.checklist)
            : template.checklist
          : [],
        // 🔥 CRITICAL: Dates and times explicitly overwritten as completely blank values
        // This forces user entry configuration interaction tracking and drops styling collisions
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isHybrid: template.isHybrid || false,
        videoLink: template.videoLink || '',
        location: template.location || '',
      }));

      // Clean the history window entry location states to avoid form reset behaviors on screen refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Event</h1>

        {/* Entry Point Action Shortcut Link */}
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-blue-600 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
        >
          ✨ Create From Template
        </button>
      </div>

      <form className="space-y-5 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
        {/* Basic Input Implementations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            Location & Hybrid Mode
          </h3>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isHybrid"
              name="isHybrid"
              checked={formData.isHybrid}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isHybrid" className="text-sm font-medium text-gray-700">
              This is a hybrid event (Virtual + In-Person)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Physical Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Room 101 or Virtual only"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            {formData.isHybrid && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Link (Virtual attendees)
                </label>
                <input
                  type="url"
                  name="videoLink"
                  value={formData.videoLink}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* 🛡️ Strict Isolated Timeline Target Container Blocks */}
        <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-orange-800 uppercase tracking-wider">
            Event Scheduling (Required Field Inputs)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm"
        >
          Publish Event
        </button>
      </form>
    </div>
  );
}
