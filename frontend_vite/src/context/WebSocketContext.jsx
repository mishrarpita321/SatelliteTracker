import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import WebSocketService from '../service/WebSocketService';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const [wsService] = useState(() => WebSocketService);
    const [connectionStatus, setConnectionStatus] = useState('WebSocket connecting...');
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        wsService.setConnectionStatusHandler(status => {
            setConnectionStatus(status);
            if (status === 'WebSocket connected') {
                setTimeout(() => {
                    setConnectionStatus('');
                }, 2000);
            }
        });

        wsService.connect().then(() => {
            console.log('Connected to WebSocket');
        }).catch(error => {
            console.error('Failed to connect to WebSocket', error);
        });

        return () => {
            wsService.clearMessageHandlers();
            wsService.setConnectionStatusHandler(null);
            if (wsService.socket && wsService.socket.readyState === WebSocket.OPEN) {
                wsService.socket.close();
            }
        };
    }, [wsService]);

    const handleMessage = useCallback((message) => {
        // console.log('Received message:', message);
        if (message.type === 'notification') {
            setNotifications(prev => [...prev, message]);
        }
    }, []);

    useEffect(() => {
        wsService.setMessageHandler(handleMessage);
    }, [handleMessage, wsService]);

    const addMessageHandler = (handler) => {
        wsService.setMessageHandler(handler);
    };

    const sendMessage = (message) => {
        return wsService.sendMessage(message);
    };

    return (
        <WebSocketContext.Provider value={{ connectionStatus, notifications, addMessageHandler, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
