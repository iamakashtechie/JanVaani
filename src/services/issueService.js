import { db } from '../config/firebase';
import {
    collection, addDoc, updateDoc, doc,
    query, orderBy, where, onSnapshot,
    Timestamp, serverTimestamp, getDocs
} from 'firebase/firestore';
import { uploadPhotos } from './photoService';

/**
 * Submit a new civic issue to Firestore.
 */
export const submitIssue = async (formData, user) => {
    // 1. Create the issue document first
    const issueRef = await addDoc(collection(db, 'issues'), {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        coordinates: formData.coordinates || null,
        photoURLs: [],
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        status: 'pending',
        adminNote: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    // 2. Upload photos (if any) and update document with URLs
    if (formData.photos && formData.photos.length > 0) {
        const photoURLs = await uploadPhotos(formData.photos, issueRef.id);
        await updateDoc(issueRef, { photoURLs });
    }

    return issueRef.id;
};

/**
 * Subscribe to all issues (real-time), ordered by date desc.
 * @returns unsubscribe function
 */
export const subscribeToIssues = (callback) => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const issues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(issues);
    });
};

/**
 * Subscribe to a single user's issues (real-time).
 * @returns unsubscribe function
 */
export const subscribeToUserIssues = (userId, callback) => {
    const q = query(
        collection(db, 'issues'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const issues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(issues);
    });
};

/**
 * Update issue status (admin only).
 */
export const updateIssueStatus = async (issueId, newStatus, adminNote = '') => {
    await updateDoc(doc(db, 'issues', issueId), {
        status: newStatus,
        adminNote,
        updatedAt: serverTimestamp(),
    });
};
