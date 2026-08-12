import os
import re

filepath = r'admin-dashboard/src/App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_statement = "import CommandMenu from './components/CommandMenu';\nimport { useAdminShortcuts } from './hooks/useAdminShortcuts';\n"
content = import_statement + content

dashboard_layout_hook = '''
function DashboardLayout() {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = React.useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = React.useState(false);

  useAdminShortcuts({
    onOpenCommandMenu: () => setIsCommandMenuOpen(true),
    onToggleShortcutsHelp: () => setIsShortcutsHelpOpen(prev => !prev),
  });

'''

content = content.replace("function DashboardLayout() {", dashboard_layout_hook)

dashboard_layout_component = '''      <MobileBottomNav />
      <Toast />
      <OnboardingTour />
      <CommandMenu isOpen={isCommandMenuOpen} onClose={() => setIsCommandMenuOpen(false)} />
      <CommandMenu isOpen={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} isHelpMode={true} />
    </div>
  );
}'''

content = content.replace("      <MobileBottomNav />\n      <Toast />\n      <OnboardingTour />\n    </div>\n  );\n}", dashboard_layout_component)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
