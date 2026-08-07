import React, { useState } from 'react';
import { E2EEService } from '../../services/e2eeService';

export const E2EEMessageInput = ({ onSendEncryptedMessage, sharedKey }) => {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim() || !sharedKey) return;
    
    try {
      const encryptedData = await E2EEService.encryptMessage(sharedKey, message);
      onSendEncryptedMessage(encryptedData);
      setMessage('');
    } catch (err) {
      console.error('Failed to encrypt message', err);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md">
      <input 
        type="text" 
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type an end-to-end encrypted message..."
        className="flex-1 p-2 outline-none"
      />
      <button 
        onClick={handleSend}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
      >
        Send Securely
      </button>
    </div>
  );
};
