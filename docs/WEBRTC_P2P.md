# WebRTC-based Peer-to-Peer Voice/Video Channels

We have implemented native, synchronous voice and video channels within the Collaboration Hub to eliminate the need for external tools like Zoom.

## Architecture

This feature is built using **WebRTC** for Peer-to-Peer (P2P) media transmission, leveraging our existing Node.js backend as a signaling server.

### 1. Signaling Server (\`webrtcSignaling.js\`)
To establish a direct P2P connection, clients first need to discover each other and exchange networking metadata. We use \`socket.io\` on a dedicated \`/webrtc\` namespace.
The server relays:
- **SDP Offers & Answers**: Session Description Protocol payloads detailing media capabilities (codecs, resolutions).
- **ICE Candidates**: Network routing information (IPs, ports) discovered via STUN servers.

### 2. Client Hook (\`useWebRTC.js\`)
A custom React hook that manages the complex lifecycle of \`RTCPeerConnection\`:
- Acquires local microphone/camera access via \`navigator.mediaDevices.getUserMedia\`.
- Connects to the signaling server.
- Automatically initiates calls when new peers join the channel.
- Manages an object mapping of peer IDs to incoming \`MediaStream\` tracks.

### 3. UI Component (\`WebRTCChannel.jsx\`)
A responsive grid layout that renders \`<video>\` tags for the local stream and all active remote peer streams.

## Scalability Note
Because this uses a P2P Mesh topology, every client must upload their video stream to *every other* client. This scales well for 1-to-1 or small group calls (up to ~5 people). For larger webinars or team meetings in the future, we will need to pivot to an SFU (Selective Forwarding Unit) architecture like Mediasoup or mediasoup-client to prevent bandwidth exhaustion.
