import { Report, User } from '../types';
import { db, firebase } from './firebase';
import { FIRESTORE_COLLECTIONS } from '../constants';

// --- User Management ---

export const getUser = async (uid: string): Promise<User | null> => {
    const userDoc = await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid).get();
    if (!userDoc.exists) {
        return null;
    }
    return userDoc.data() as User;
}

export const getEmailForUsername = async (username: string): Promise<string | null> => {
    const snapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS)
        .where('displayName', '==', username)
        .limit(1)
        .get();
        
    if (snapshot.empty) {
        return null;
    }
    const user = snapshot.docs[0].data() as User;
    return user.email;
};

export const getAllUsers = async (): Promise<User[]> => {
    const snapshot = await db.collection(FIRESTORE_COLLECTIONS.USERS)
        .orderBy('displayName')
        .get();
    return snapshot.docs.map(doc => doc.data() as User);
};

export const addUser = async (displayName: string, password: string): Promise<User> => {
    const usersRef = db.collection(FIRESTORE_COLLECTIONS.USERS);
    
    const existingUser = await usersRef.where('displayName', '==', displayName).get();
    if (!existingUser.empty) {
        throw new Error('A user with this username already exists.');
    }
    
    // NOTE: This only creates the user document in Firestore.
    // For a new user to log in, an administrator must manually create
    // a corresponding user in the Firebase Authentication console.
    const mockEmail = `${displayName.toLowerCase().replace(/\s/g, '')}@example.com`;
    const newUserDoc = usersRef.doc(); // Generate a new UID
    
    const newUser: User = {
        uid: newUserDoc.id,
        displayName,
        email: mockEmail,
        status: 'active',
    };
    
    await newUserDoc.set(newUser);
    return newUser;
};

export const updateUserStatus = async (userId: string, status: 'active' | 'blocked'): Promise<void> => {
    await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).update({ status });
};

export const deleteUser = async (userId: string): Promise<void> => {
    const batch = db.batch();
    
    // 1. Delete the user document
    const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId);
    batch.delete(userRef);
    
    // 2. Delete all reports by that user
    const reportsQuery = db.collection(FIRESTORE_COLLECTIONS.REPORTS).where('userId', '==', userId);
    const reportsSnapshot = await reportsQuery.get();
    reportsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();

    // NOTE: This does NOT delete the user from Firebase Authentication.
    // That requires admin privileges and should be done via a Cloud Function or manually in the console.
};


// --- Report Management ---

export const addReport = async (userId: string, content: string): Promise<void> => {
    const newReport = {
        userId,
        content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection(FIRESTORE_COLLECTIONS.REPORTS).add(newReport);
};

export const getReportsForUser = async (userId: string): Promise<Report[]> => {
    const snapshot = await db.collection(FIRESTORE_COLLECTIONS.REPORTS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
        
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

export const getAllReports = async (): Promise<Report[]> => {
    const snapshot = await db.collection(FIRESTORE_COLLECTIONS.REPORTS)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};

export const updateReport = async (reportId: string, newContent: string): Promise<void> => {
    await db.collection(FIRESTORE_COLLECTIONS.REPORTS).doc(reportId).update({ content: newContent });
};

export const deleteReport = async (reportId: string): Promise<void> => {
    await db.collection(FIRESTORE_COLLECTIONS.REPORTS).doc(reportId).delete();
};