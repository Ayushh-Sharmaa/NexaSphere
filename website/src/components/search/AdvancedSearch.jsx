import React, { useState } from 'react';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import {
  Search,
  Filter,
  Calendar,
  User,
  Briefcase,
  FileText,
  Star,
  X,
  Save,
  TrendingUp,
  History,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import './AdvancedSearch.css';

const TYPE_ICONS = {
  Event: <Calendar size={16} />,
  User: <User size={16} />,
  Project: <Briefcase size={16} />,
  Announcement: <FileText size={16} />,
};

const AdvancedSearch = () => {
  const {
    query,
    setQuery,
    results,
    loading,
    facets,
    activeFilters,
    toggleFilter,
    clearFilters,
    suggestions,
    recentSearches,
    saveSearch,
  } = useGlobalSearch();

  const [sortBy, setSortBy] = useState('relevance');

  const highlightMatch = (text) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={`segment-${i}-${part}`} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Group results by type for the "Grouped View"
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="advanced-search-container">
      {/* Sidebar: Faceted Filters */}
      <aside className="search-sidebar">
        <div className="sidebar-header">
          <h3>Filters</h3>
          {Object.keys(activeFilters).length > 0 && (
            <button className="clear-all" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>

        {Object.entries(facets).map(([category, items]) => (
          <div key={category} className="facet-group">
            <h4>{category.replace(/([A-Z])/g, ' $1')}</h4>
            {items.map((item) => (
              <div
                key={item.name}
                className={`facet-item ${activeFilters[category]?.includes(item.name) ? 'active' : ''}`}
                onClick={() => toggleFilter(category, item.name)}
              >
                <span>{item.name}</span>
                <span className="facet-count">{item.count}</span>
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main Search Area */}
      <main className="search-main">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search events, users, projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="save-search-btn" onClick={saveSearch} title="Save Search">
              <Save size={18} />
            </button>
          )}
        </div>

        {/* Suggestions & Context */}
        <div className="search-context">
          {suggestions.length > 0 && (
            <div className="did-you-mean">
              Did you mean:{' '}
              {suggestions.map((s) => (
                <button key={s} onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="recent-searches">
              <h4>
                <History size={14} /> Recent
              </h4>
              {recentSearches.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="recent-search-tag"
                  onClick={() => setQuery(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="results-toolbar">
          <div className="result-stats">
            {loading ? 'Searching...' : `Found ${results.length} results`}
          </div>
          <div className="sort-wrapper">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="date">Latest</option>
              <option value="popular">Popularity</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="results-list">
          {Object.entries(groupedResults).map(([type, items]) => (
            <section key={type} className="result-group">
              <h3 className="group-title">{type}s</h3>
              {items.map((item) => (
                <div key={item.id} className="result-card">
                  <div className="result-header">
                    <span className="type-badge">
                      {TYPE_ICONS[item.type]} {item.type}
                    </span>
                    <h3 className="result-title">{highlightMatch(item.title)}</h3>
                  </div>
                  <p className="result-snippet">{highlightMatch(item.snippet)}</p>
                  <div className="result-footer">
                    <div className="result-tags">
                      {item.tags?.map((tag) => (
                        <span key={tag} className="tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button className="view-btn">View Details</button>
                  </div>
                </div>
              ))}
            </section>
          ))}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="no-results">
              <TrendingUp size={48} />
              <h3>No results found for "{query}"</h3>
              <p>Try adjusting your filters or searching for something else.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdvancedSearch;
