// Firebase configuration
export { db, auth } from './config';

// Auth utilities
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
  getUserProfile,
  updateUserSettings,
  type UserProfile,
} from './auth';

// Firestore utilities
export * from './firestore';

// Converters
export {
  newsItemConverter,
  sourceConverter,
  styleTemplateConverter,
  timestampToISOString,
  isoStringToTimestamp,
} from './converters';
