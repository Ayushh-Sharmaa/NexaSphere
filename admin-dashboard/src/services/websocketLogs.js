class WebSocketLogService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 3000;
  }

  connect(url = 'ws://localhost:8080/api/logs/stream') {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // In a real application, URL might come from env vars
    const wsUrl = import.meta.env.VITE_WS_LOGS_URL || url;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (error) {
        console.error('Failed to parse log message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onerror is usually followed by onclose
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
    } else {
      console.error('Max reconnect attempts reached. Could not connect to WebSocket.');
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.socket) {
        this.disconnect();
      }
    };
  }

  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const websocketLogs = new WebSocketLogService();
