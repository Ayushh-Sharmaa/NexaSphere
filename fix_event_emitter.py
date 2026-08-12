
import re

with open('server/services/eventEmitterService.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the duplicate imports
text = re.sub(r'import \{\s*sendPushNotification,\s*sendToTopic,\s*\} from \"[\./]pushNotificationService\.js\";', '', text)

# Fix the isolated push notification blocks (lines 291-318 type stuff)
# We can just remove everything between // 2. Send Push Notification (Isolated) and // Send push notification (respect preferences)
text = re.sub(r'// 2\. Send Push Notification \(Isolated\).*?// Send push notification \(respect preferences\)', '// Send push notification (respect preferences)', text, flags=re.DOTALL)

# Do the same for Email
text = re.sub(r'// 1\. Send Email \(Isolated\).*?// Send email \(respect preferences\)', '// Send email (respect preferences)', text, flags=re.DOTALL)

# Do the same for WebSocket
# The pattern is: // 3. Broadcast to notifications room (WebSocket - Isolated) OR // 3. Broadcast event (WebSocket - Isolated)
# Followed by a try block, then another emitToRoom... wait, there is no // Send broadcast (respect preferences)
text = re.sub(r'// 3\. Broadcast.*?try \{\s*emitToRoom\(.*?,.*?, \{\s*// Broadcast.*?emitToRoom\(', 'try {\n      // Broadcast\n      emitToRoom(', text, flags=re.DOTALL)

# Wait, the duplicate methods were already removed. Let's see.

with open('server/services/eventEmitterService.js', 'w', encoding='utf-8') as f:
    f.write(text)

