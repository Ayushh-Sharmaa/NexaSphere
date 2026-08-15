import React, { useState } from 'react';
import useSavedSearches from '../../hooks/useSavedSearches';
import { Bookmark, Edit2, Trash2, Share2, Save, X, Check } from 'lucide-react';
import './SavedSearches.css';

const SavedSearches = ({ currentQuery, currentFilters, onLoadSearch }) => {
  const { savedSearches, addSearch, deleteSearch, editSearch } = useSavedSearches();
  const [isSaving, setIsSaving] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleSaveClick = () => {
    setIsSaving(true);
    setNewSearchName(currentQuery || 'My Saved Search');
  };

  const confirmSave = () => {
    if (newSearchName.trim()) {
      addSearch(newSearchName, currentQuery, currentFilters);
      setIsSaving(false);
      setNewSearchName('');
    }
  };

  const startEditing = (search) => {
    setEditingId(search.id);
    setEditName(search.name);
  };

  const saveEdit = (id) => {
    if (editName.trim()) {
      editSearch(id, editName);
    }
    setEditingId(null);
  };

  const handleShare = (search) => {
    const params = new URLSearchParams();
    if (search.query) params.set('q', search.query);
    if (search.filters) {
      Object.entries(search.filters).forEach(([key, values]) => {
        values.forEach((val) => params.append(`f_${key}`, val));
      });
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    alert('Search URL copied to clipboard!');
  };

  return (
    <div className="saved-searches-container">
      <div className="saved-searches-header">
        <h4>
          <Bookmark size={16} /> Saved Searches
        </h4>
        {(currentQuery || Object.keys(currentFilters).length > 0) && (
          <button className="btn-save-new" onClick={handleSaveClick}>
            <Save size={14} /> Save Current
          </button>
        )}
      </div>

      {isSaving && (
        <div className="save-search-form">
          <input
            type="text"
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
            placeholder="Search name..."
            autoFocus
          />
          <button onClick={confirmSave} className="btn-confirm">
            <Check size={14} />
          </button>
          <button onClick={() => setIsSaving(false)} className="btn-cancel">
            <X size={14} />
          </button>
        </div>
      )}

      {savedSearches.length === 0 ? (
        <div className="no-saved-searches">No saved searches yet.</div>
      ) : (
        <ul className="saved-searches-list">
          {savedSearches.map((s) => (
            <li key={s.id} className="saved-search-item">
              {editingId === s.id ? (
                <div className="edit-search-form">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => saveEdit(s.id)} className="btn-confirm">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-cancel">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="saved-search-info" onClick={() => onLoadSearch(s)}>
                    <span className="search-name">{s.name}</span>
                  </div>
                  <div className="saved-search-actions">
                    <button onClick={() => handleShare(s)} title="Share URL">
                      <Share2 size={14} />
                    </button>
                    <button onClick={() => startEditing(s)} title="Edit Name">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteSearch(s.id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedSearches;
