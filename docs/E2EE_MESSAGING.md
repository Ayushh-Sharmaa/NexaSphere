# End-to-End Encryption (E2EE) for Direct Messaging Channels

To protect sensitive communications, we have implemented End-to-End Encryption for direct messaging.

## How it works (Signal Protocol / ECDH)

1. **Key Generation**: When a user logs in on a new device, a public/private ECDH key pair is generated using the Web Crypto API. The private key never leaves the device.
2. **Key Distribution**: The public key is uploaded to the NexaSphere server (\`/api/keys/upload\`).
3. **Key Exchange**: To message another user, the sender fetches the recipient's public key from the server (\`/api/keys/:userId\`).
4. **Shared Secret**: The sender derives a shared secret using their own private key and the recipient's public key.
5. **Encryption**: Messages are encrypted using AES-GCM before being sent to the server.
6. **Decryption**: The recipient derives the same shared secret (using their private key and the sender's public key) and decrypts the message.

## UI Implementation
- The \`E2EEMessageInput\` component handles encryption before transmission.
- The \`E2EEBadge\` component is displayed in E2EE-enabled channels to reassure users.

## Search limitations
Because the server cannot read the messages, server-side search is disabled for E2EE channels. Client-side search (using IndexedDB) will be implemented in a future iteration.
