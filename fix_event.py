
with open('server/services/eventEmitterService.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

res = []
i = 0
while i < len(lines):
    line = lines[i]
    if '} catch (error) {' in line and i+1 < len(lines) and 'WebSocket user broadcast failed' in lines[i+1]:
        # skip lines until }
        i += 1
        while i < len(lines) and not '}' in lines[i]:
            i += 1
        i += 1
        continue
    res.append(line)
    i += 1

with open('server/services/eventEmitterService.js', 'w', encoding='utf-8') as f:
    f.writelines(res)

