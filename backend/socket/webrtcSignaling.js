/**
 * WebRTC Signaling Server via Socket.io
 * Facilitates the exchange of SDP Offers/Answers and ICE candidates
 * between peers for establishing direct P2P connections.
 */
module.exports = function (io) {
  const webrtcNamespace = io.of('/webrtc');

  webrtcNamespace.on('connection', (socket) => {
    console.log(`[WebRTC] Peer connected: ${socket.id}`);

    // Join a specific voice/video channel room
    socket.on('join-channel', (channelId) => {
      socket.join(channelId);
      console.log(`[WebRTC] Peer ${socket.id} joined channel ${channelId}`);
      // Notify others in the room that a new peer joined
      socket.to(channelId).emit('peer-joined', socket.id);
    });

    // Relay SDP Offer
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        caller: socket.id,
        sdp: data.sdp
      });
    });

    // Relay SDP Answer
    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        caller: socket.id,
        sdp: data.sdp
      });
    });

    // Relay ICE Candidate
    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        caller: socket.id,
        candidate: data.candidate
      });
    });

    socket.on('disconnect', () => {
      console.log(`[WebRTC] Peer disconnected: ${socket.id}`);
      // Broadcast disconnect to all rooms this socket was in
      webrtcNamespace.emit('peer-disconnected', socket.id);
    });
  });
};
