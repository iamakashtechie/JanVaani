import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload a single photo and return its download URL.
 */
export const uploadPhoto = async (file, issueId, index = 0) => {
    const storageRef = ref(storage, `issues/${issueId}/photo_${index}_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
};

/**
 * Upload multiple photos and return an array of download URLs.
 */
export const uploadPhotos = async (files, issueId) => {
    const uploadPromises = files.map((file, index) => uploadPhoto(file, issueId, index));
    return Promise.all(uploadPromises);
};