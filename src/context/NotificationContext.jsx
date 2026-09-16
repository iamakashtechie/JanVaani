import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    subscribeToNotifications,
    markNotificationRead,
    markAllNotificationsRead
} from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }
        const unsub = subscribeToNotifications(user.uid, setNotifications);
        return () => unsub();
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markRead = (id) => markNotificationRead(id);
    const markAllRead = () => user && markAllNotificationsRead(user.uid);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    );
};
