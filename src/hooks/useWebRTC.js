import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useWebRTC = (channelId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({});
  const socketRef = useRef();

  useEffect(() => {
    // Connect to WebRTC signaling namespace
    socketRef.current = io('http://localhost:5000/webrtc');
    
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        socketRef.current.emit('join-channel', channelId);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    };

    initCamera();

    socketRef.current.on('peer-joined', (peerId) => {
      callPeer(peerId);
    });

    socketRef.current.on('offer', handleReceiveOffer);
    socketRef.current.on('answer', handleReceiveAnswer);
    socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
    
    socketRef.current.on('peer-disconnected', (peerId) => {
      if (peersRef.current[peerId]) {
        peersRef.current[peerId].close();
        delete peersRef.current[peerId];
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
      }
    });

    return () => {
      socketRef.current.disconnect();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [channelId]);

  function createPeer(peerId) {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit('ice-candidate', { target: peerId, candidate: e.candidate });
      }
    };

    peer.ontrack = (e) => {
      setRemoteStreams(prev => ({ ...prev, [peerId]: e.streams[0] }));
    };

    localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
    return peer;
  }

  async function callPeer(peerId) {
    const peer = createPeer(peerId);
    peersRef.current[peerId] = peer;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current.emit('offer', { target: peerId, sdp: offer });
  }

  async function handleReceiveOffer({ caller, sdp }) {
    const peer = createPeer(caller);
    peersRef.current[caller] = peer;
    
    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    
    socketRef.current.emit('answer', { target: caller, sdp: answer });
  }

  async function handleReceiveAnswer({ caller, sdp }) {
    await peersRef.current[caller].setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async function handleNewICECandidateMsg({ caller, candidate }) {
    if (peersRef.current[caller]) {
      await peersRef.current[caller].addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  return { localStream, remoteStreams };
};
