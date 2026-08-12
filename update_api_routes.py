import os
import re

filepath = r'server/routes/api.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import adminSearchRoutes from './adminSearchRoutes.js';\n"
content = import_stmt + content

content = content.replace("export default router;", "router.use('/admin/search', adminSearchRoutes);\nexport default router;")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
