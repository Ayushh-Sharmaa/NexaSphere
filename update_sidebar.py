import os

filepath = r'admin-dashboard/src/components/Sidebar.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

search_button = '''
      <div className="sidebar-search-container" style={{ padding: '0 16px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true
            });
            window.dispatchEvent(event);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AdminIcon name="Search" size={16} />
            Search...
          </span>
          <kbd style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>Cmd+K</kbd>
        </button>
      </div>
'''

content = content.replace('<nav className="sidebar-nav">', search_button + '\n      <nav className="sidebar-nav">')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
