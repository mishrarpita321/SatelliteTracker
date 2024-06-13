import { FaBell } from 'react-icons/fa';
import { useWebSocket } from '../../context/WebSocketContext';
import { Link } from 'react-router-dom';

const SocketStatus = () => {
    const { connectionStatus, notifications } = useWebSocket();
    const notificationCount = notifications.length;
 
    return (
        <header className="App-header">
            {connectionStatus && (
                <div className={`connection-ribbon ${connectionStatus === 'WebSocket connected' ? 'connected' : ''}`}>
                    {connectionStatus}
                </div>
            )}
            {/* <div className="notification-bell">
                <FaBell size={24} />
                {notificationCount > 0 && <span className="notification-count">{notificationCount}</span>}
            </div> */}
        </header>
    )
}

export default SocketStatus;