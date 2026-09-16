import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Create a new user profile document in Firestore.
 * All users are created as 'citizen' — admin role is set manually.
 */
export const createUserProfile = async (userId, userData) => {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            ...userData,
            role: 'citizen', // Always default to citizen — security fix
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error in createUserProfile:', error);
        throw error;
    }
};

/**
 * Get a user profile document from Firestore.
 */
export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        throw error;
    }
};

/**
 * Update a user profile document.
 */
export const updateUserProfile = async (userId, updates) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        return true;
    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        throw error;
    }
};