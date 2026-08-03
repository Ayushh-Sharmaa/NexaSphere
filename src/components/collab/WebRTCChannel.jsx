import React, { useEffect, useRef } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';

const VideoPlayer = ({ stream, isLocal }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      muted={isLocal} 
      className={`rounded-lg object-cover w-full h-full border-2 ${isLocal ? 'border-blue-500' : 'border-gray-300'}`}
    />
  );
};

export const WebRTCChannel = ({ channelId }) => {
  const { localStream, remoteStreams } = useWebRTC(channelId);

  return (
    <div className="flex flex-col h-full bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-xl font-bold">Voice & Video Channel</h2>
        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold cursor-pointer hover:bg-red-600 transition">
          Leave Call
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
        {/* Local Video */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
          <VideoPlayer stream={localStream} isLocal={true} />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 text-xs rounded">
            You
          </div>
        </div>

        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([peerId, stream]) => (
          <div key={peerId} className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <VideoPlayer stream={stream} isLocal={false} />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 text-xs rounded">
              Peer {peerId.substring(0, 5)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
