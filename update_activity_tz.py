import os
import re

filepath = r'website/src/pages/Activities/ActivityDetailPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { formatWithTimezone } from '../../utils/timezoneUtils';\n"
content = content.replace("import { getApiBase } from '../../utils/runtimeConfig';", "import { getApiBase } from '../../utils/runtimeConfig';\n" + import_stmt)

# Replace dates in the JSX
content = content.replace(
    "{event.dateText ?? event.date}",
    "{event.dateText ? event.dateText : formatWithTimezone(event.date)}"
)

# Add a timezone selector right below the Activity title / description area.
# I'll put it at the very top of the page container.
timezone_selector = """
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0' }}>
          <label style={{ fontSize: '0.85rem', marginRight: '8px', color: 'var(--t2)' }}>Timezone:</label>
          <select 
            style={{ fontSize: '0.85rem', padding: '4px', borderRadius: '4px', background: 'var(--bg2)', color: 'var(--t1)', border: '1px solid var(--bdr1)' }}
            onChange={(e) => {
              if (e.target.value) {
                localStorage.setItem('preferredTimezone', e.target.value);
              } else {
                localStorage.removeItem('preferredTimezone');
              }
              window.location.reload();
            }}
            defaultValue={typeof window !== 'undefined' ? localStorage.getItem('preferredTimezone') || '' : ''}
          >
            <option value="">Browser Default</option>
            <option value="America/New_York">EST (New York)</option>
            <option value="America/Los_Angeles">PST (Los Angeles)</option>
            <option value="Europe/London">GMT (London)</option>
            <option value="Asia/Kolkata">IST (Kolkata)</option>
            <option value="Asia/Tokyo">JST (Tokyo)</option>
          </select>
        </div>
"""

content = content.replace(
    """<div className="container" style={{ paddingTop: '32px' }}>""",
    """<div className="container" style={{ paddingTop: '32px' }}>""" + timezone_selector
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
