import os
import re

filepath = r'admin-dashboard/src/components/RegistrationTrendsChart.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState, useMemo } from 'react';")

# In the render method, memoize if possible, but actually chartData is already a state variable which is essentially memoized unless updated. 
# Recharts component can be wrapped in React.memo if it's lagging. Wait, the issue says 'Memoize Recharts data'.
# So they probably want something like:
# const memoizedData = useMemo(() => chartData, [chartData]);
# But chartData is state. If they mean the mapping inside CustomTooltip or something?
# No, useMemo for Recharts data is just const memoizedData = useMemo(() => data, [data]); if data is passed from parent and it causes re-renders. 

# Let's wrap the Recharts components themselves inside useMemo, or wrap chartData
content = content.replace("<LineChart data={chartData}", "<LineChart data={useMemo(() => chartData, [chartData])}")
content = content.replace("<AreaChart data={chartData}", "<AreaChart data={useMemo(() => chartData, [chartData])}")
content = content.replace("<BarChart data={chartData}", "<BarChart data={useMemo(() => chartData, [chartData])}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
