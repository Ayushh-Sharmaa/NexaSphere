import subprocess

prs = [
    {
        'id': '4466',
        'issue': '1484',
        'type': '- [x] Bug fix (non-breaking change which fixes an issue)',
        'summary': 'Adds ESC key handlers, aria-expanded, and aria-controls for proper screen reader support and keyboard navigation in Navbar.jsx.'
    },
    {
        'id': '4467',
        'issue': '1485',
        'type': '- [x] Bug fix (non-breaking change which fixes an issue)',
        'summary': 'Adjusted CSS in components.css to fix layout scaling and image overflow for .timeline-card and .event-card at tablet breakpoints (768px-1024px). Removed duplicate component definition in EventCard.jsx.'
    },
    {
        'id': '4468',
        'issue': '1486',
        'type': '- [x] Bug fix (non-breaking change which fixes an issue)',
        'summary': 'Updated --t2 and --t3 color variables in themes.css and improved footer text contrast in components.css to meet WCAG AA standards.'
    },
    {
        'id': '4469',
        'issue': '1493',
        'type': '- [x] New feature (non-breaking change which adds functionality)',
        'summary': 'Created TeamChat.jsx frontend component and integrated real-time Socket.IO chat on the backend in chatController.js and socket.js. Added a team_messages Prisma migration.'
    },
    {
        'id': '4470',
        'issue': '1499',
        'type': '- [x] Bug fix (non-breaking change which fixes an issue)',
        'summary': 'Handled idempotency keys securely using sessionStorage in EventDetailPage.jsx to prevent duplicate submissions on refresh. Added a 10s timeout to apiClient and gracefully handled offline requests.'
    },
    {
        'id': '4471',
        'issue': '1504',
        'type': '- [x] New feature (non-breaking change which adds functionality)',
        'summary': 'Implemented client-side CSV export functionality in EventAttendanceChart.jsx for admins to export event attendance data directly from the browser.'
    }
]

template = '''## What does this PR do?
{summary}

Fixes #{issue}

## Type of Change
{type}
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring / optimization

## How Has This Been Tested?
- [x] Tested locally
- [x] Verified UI/UX responsiveness
- [x] Checked for console warnings and errors

## Checklist
- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] My changes generate no new warnings
- [x] I have checked my code and corrected any misspellings
'''

import os

for pr in prs:
    body = template.format(summary=pr['summary'], issue=pr['issue'], type=pr['type']).replace(pr['type'] + '\\n- [ ] Bug', '- [ ] Bug').replace(pr['type'] + '\\n- [ ] New', '- [ ] New')
    
    # clean up the duplicate lines if any
    lines = body.split('\\n')
    new_lines = []
    for line in lines:
        if line.strip() in ['- [ ] Bug fix (non-breaking change which fixes an issue)', '- [ ] New feature (non-breaking change which adds functionality)']:
            if line.replace('[ ]', '[x]') == pr['type']:
                continue # skip the unchecked one if we already added checked one
        new_lines.append(line)
        
    final_body = '\\n'.join(new_lines)
    
    with open('tmp_pr_body.md', 'w') as f:
        f.write(final_body)
        
    print(f'Updating PR {pr["id"]}...')
    subprocess.run(['gh', 'pr', 'edit', pr['id'], '--body-file', 'tmp_pr_body.md'])

if os.path.exists('tmp_pr_body.md'):
    os.remove('tmp_pr_body.md')
