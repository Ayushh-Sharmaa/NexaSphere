import os
import re

filepath = r'admin-dashboard/src/components/CheckInStatsChart.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import React from 'react';", "import React, { useMemo } from 'react';")

content = content.replace("<BarChart data={stats.hourlyData || []}", "<BarChart data={useMemo(() => stats.hourlyData || [], [stats.hourlyData])}")
content = content.replace("<LineChart data={stats.hourlyData || []}", "<LineChart data={useMemo(() => stats.hourlyData || [], [stats.hourlyData])}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
