import React, { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import socketService from '../../services/socketService';

const WebSocketStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const connected = socketService.isSocketConnected();
      setIsConnected(connected);
      console.log('WebSocket connection status:', connected);
    };

    // Check connection status initially
    checkConnection();

    // Check connection status periodically
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleReconnect = () => {
      setIsReconnecting(true);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
    };
  }, []);

  if (isConnected) {
    return (
      <div className="flex items-center space-x-1 text-green-600">
        <WifiIcon className="h-4 w-4" />
        <span className="text-xs">Connected</span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="flex items-center space-x-1 text-yellow-600">
        <WifiIcon className="h-4 w-4 animate-pulse" />
        <span className="text-xs">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-red-600">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <span className="text-xs">Disconnected</span>
    </div>
  );
};

export default WebSocketStatus;
