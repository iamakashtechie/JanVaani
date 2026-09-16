import { db } from '../config/firebase';
import {
    doc, setDoc, deleteDoc, getDoc,
    collection, query, where, getDocs
} from 'firebase/firestore';

/**
 * Toggle a vote. Voting the same type again removes the vote.
 * @returns {'upvote'|'downvote'|'removed'}
 */
export const handleVote = async (issueId, userId, voteType) => {
    const voteId = `${issueId}_${userId}`;
    const voteRef = doc(db, 'votes', voteId);

    try {
        const existing = await getDoc(voteRef);

        if (existing.exists() && existing.data().voteType === voteType) {
            // Same vote clicked again → toggle off
            await deleteDoc(voteRef);
            return 'removed';
        } else {
            // New vote or switching from up to down (or vice versa)
            await setDoc(voteRef, {
                issueId,
                userId,
                voteType,
                timestamp: new Date(),
            });
            return voteType;
        }
    } catch (error) {
        console.error('Error voting:', error);
        throw error;
    }
};

/**
 * Get the current user's vote for a specific issue.
 * @returns {'upvote'|'downvote'|null}
 */
export const getUserVote = async (issueId, userId) => {
    if (!userId) return null;
    const voteRef = doc(db, 'votes', `${issueId}_${userId}`);
    const snap = await getDoc(voteRef);
    return snap.exists() ? snap.data().voteType : null;
};

/**
 * Get upvote and downvote counts for an issue.
 */
export const getVoteCounts = async (issueId) => {
    const votesRef = collection(db, 'votes');
    const q = query(votesRef, where('issueId', '==', issueId));

    const snapshot = await getDocs(q);
    let upvotes = 0;
    let downvotes = 0;

    snapshot.forEach(doc => {
        if (doc.data().voteType === 'upvote') upvotes++;
        if (doc.data().voteType === 'downvote') downvotes++;
    });

    return { upvotes, downvotes };
};