class WebSocketService {
    constructor() {
        if (!WebSocketService.instance) {
            this.socket = null;
            this.url = '';
            this.reconnectInterval = 1000; // Start with 1 second
            this.maxReconnectInterval = 30000; // Max interval to 30 seconds
            this.messageHandlers = []; // Initialize an array to store multiple handlers
            this.connectionStatusHandler = null; // Initialize a connection status handler

            WebSocketService.instance = this;
        }
        return WebSocketService.instance;
    }

    connect(url = import.meta.env.VITE_REACT_APP_SOCKET_URL) {
        console.log('Connecting to WebSocket:', url);
        if (this.connectionStatusHandler) this.connectionStatusHandler('WebSocket connecting...');

        return new Promise((resolve, reject) => {
            if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
                console.log('WebSocket is already connected or connecting.');
                resolve();
                return;
            }

            this.url = url;
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log('WebSocket Connected');
                if (this.connectionStatusHandler) this.connectionStatusHandler('WebSocket connected');
                this.reconnectInterval = 1000; // Reset on successful connection
                resolve();
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.messageHandlers.forEach(handler => handler(data)); // Trigger all handlers
            };

            this.socket.onclose = () => {
                console.log('WebSocket Disconnected');
                if (this.connectionStatusHandler) this.connectionStatusHandler('WebSocket disconnected. Retrying...');
                this.reconnect(); // Attempt to reconnect
                reject(new Error('WebSocket Disconnected'));
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
                this.socket.close(); // Ensures we trigger onclose
                reject(error);
            };
        });
    }

    setMessageHandler(handler) {
        if (!this.messageHandlers.includes(handler)) {
            this.messageHandlers.push(handler); // Add new handler to the array
        }
    }

    clearMessageHandlers() {
        this.messageHandlers = []; // Clear all handlers
    }

    setConnectionStatusHandler(handler) {
        this.connectionStatusHandler = handler;
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify(message));
                resolve();
            } else {
                console.log('WebSocket is not connected.');
                reject(new Error('WebSocket is not connected.'));
            }
        });
    }

    reconnect() {
        clearTimeout(this.reconnectTimeout); // Clear any existing timeout to avoid stacking reconnect attempts
        this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect(this.url)
                .then(() => {
                    console.log("WebSocket Reconnected successfully!");
                    if (this.connectionStatusHandler) this.connectionStatusHandler('WebSocket connected');
                    this.reconnectInterval = 1000; // Reset reconnect interval on successful reconnection
                })
                .catch((error) => {
                    console.log("WebSocket Reconnection failed: ", error);
                    this.reconnectInterval = Math.min(this.reconnectInterval * 2, this.maxReconnectInterval);
                    this.reconnect(); // Schedule next reconnect attempt
                });
        }, this.reconnectInterval);
    }
}

// Create a single instance
const instance = new WebSocketService();
export default instance;
