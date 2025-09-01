import firebase from 'firebase/compat/app';

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  // The 'password' field is removed as it's a security risk.
  // Passwords are managed securely by Firebase Authentication, not stored in the database.
  status: 'active' | 'blocked';
}

export interface Report {
  id: string;
  userId: string;
  content: string;
  createdAt: firebase.firestore.Timestamp; // Use Firebase's Timestamp for querying
}