import React, { useState, useCallback } from 'react';
import { searchPrompts } from '../../lib/promptStore';
import './SearchBar.css';

const SearchBar = ({ onSelectPrompt, workspace = 'default' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const resultsPanelId = 'chat-history-search-results';
  const isResultsExpanded = showResults && Boolean(query);

  const handleSearch = useCallback(
    async (searchQuery) => {
      setQuery(searchQuery);
      setSearchError('');

      if (!searchQuery.trim()) {
        setResults([]);
        setShowResults(false);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      try {
        const foundPrompts = await searchPrompts(searchQuery, workspace, { throwOnError: true });
        setResults(foundPrompts);
        setShowResults(true);
      } catch (error) {
        setResults([]);
        setShowResults(true);
        setSearchError('Search is temporarily unavailable.');
        if (import.meta.env.DEV) {
          console.error('[HistorySearchBar] Search error:', error.message);
        }
        setSearchError('Search service is currently unavailable. Please try again later.');
        setResults([]);
        setShowResults(true);
      } finally {
        setIsSearching(false);
      }
    },
    [workspace]
  );

  const handleSelectResult = (prompt) => {
    onSelectPrompt(prompt);
    setQuery('');
    setShowResults(false);
  };

  const formatPreview = (text, maxLen = 60) => {
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  return (
    <div className="search-bar-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search conversations..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          role="combobox"
          aria-label="Search conversation history"
          aria-expanded={isResultsExpanded}
          aria-controls={resultsPanelId}
          aria-autocomplete="list"
        />
        {isSearching && <span className="search-spinner">⟳</span>}
        {query && (
          <button
            className="clear-search"
            aria-label="Clear conversation search"
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
              setSearchError('');
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div id={resultsPanelId} className="search-results" role="listbox">
          {results.slice(0, 5).map((prompt) => (
            <div
              key={prompt.id}
              className="result-item"
              role="option"
              aria-selected="false"
              tabIndex={0}
              onClick={() => handleSelectResult(prompt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectResult(prompt);
                }
              }}
            >
              <div className="result-content">
                <p className="result-query">{formatPreview(prompt.userPrompt)}</p>
                <p className="result-response">{formatPreview(prompt.botResponse)}</p>
              </div>
            </div>
          ))}
          {results.length > 5 && (
            <div className="result-more">+{results.length - 5} more results</div>
          )}
        </div>
      )}

      {showResults && query && results.length === 0 && !isSearching && (
        <div id={resultsPanelId} className="search-empty" role="status">
          {searchError ? (
            <p className="error-message" style={{ color: '#ef4444' }}>
              {searchError}
            </p>
          ) : (
            <p>No results found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
