import { db } from '../config/firebase';
import {
    collection, addDoc, query, where, orderBy,
    onSnapshot, updateDoc, doc, writeBatch, getDocs, Timestamp
} from 'firebase/firestore';

/**
 * Create a status-change notification for the issue reporter.
 */
export const createStatusNotification = async (issue, newStatus) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId: issue.userId,
            issueId: issue.id,
            issueTitle: issue.title || issue.description?.slice(0, 60) || 'Your issue',
            message: `Your issue "${issue.title || issue.description?.slice(0, 60)}" status changed to "${newStatus}"`,
            oldStatus: issue.status,
            newStatus,
            read: false,
            createdAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

/**
 * Subscribe to real-time notifications for a user.
 * @returns unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(notifications);
    });
};

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (notificationId) => {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllNotificationsRead = async (userId) => {
    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
};
