import os

filepath = r'admin-dashboard/src/components/CommandMenu.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the search state and input logic
search_logic = '''
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/admin/search?q=, {
          credentials: 'include'
        });
        const data = await res.json();
        setResults(data.data?.results || data.results || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [search]);
'''

content = content.replace("  const [search, setSearch] = useState('');\n  const inputRef = useRef(null);\n  const navigate = useNavigate();\n\n  useEffect(() => {\n    if (isOpen && inputRef.current) {\n      setTimeout(() => inputRef.current.focus(), 50);\n    }\n  }, [isOpen]);", search_logic.strip())

# Replace the UI list
ui_logic = '''
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {search.length > 0 ? (
                loading ? (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>Searching...</div>
                ) : results.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (r.type === 'user') navigate(/dashboard/users/);
                          if (r.type === 'event') navigate(/dashboard/events/);
                          if (r.type === 'post') navigate(/dashboard/announcements/);
                          onClose();
                        }}
                        style={{
                          padding: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        className="search-result-item"
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{r.title}</div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>{r.subtitle}</div>
                        </div>
                        <div style={{ fontSize: '10px', padding: '2px 6px', background: '#333', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {r.type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No results found</div>
                )
              ) : (
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Type to start searching...
                </div>
              )}
            </div>
'''

old_ui = '''
            <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {search.length > 0 ? (
                <div style={{ color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
                  Search functionality will be implemented in the Global Search feature.
                </div>
              ) : (
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Type to start searching...
                </div>
              )}
            </div>
'''

content = content.replace(old_ui.strip(), ui_logic.strip())

# Add some CSS for hover
style_inject = '''
      <style>
        {
          .search-result-item:hover {
            background: rgba(255,255,255,0.1) !important;
          }
        }
      </style>
      <div
'''
content = content.replace("<div\n        style={{\n          background: '#1a1a2e',", style_inject + "        style={{\n          background: '#1a1a2e',")


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
