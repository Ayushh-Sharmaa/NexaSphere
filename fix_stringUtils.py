import os

filepath = r'admin-dashboard/src/utils/stringUtils.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("maskChar.repeat(local.length)", "'*'.repeat(local.length)")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
