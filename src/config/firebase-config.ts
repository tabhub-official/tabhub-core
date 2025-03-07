import 'dotenv/config';
import * as admin from 'firebase-admin';

const firebaseSecret = JSON.parse(process.env.FIREBASE_SECRET);

// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: firebaseSecret.client_email,
    privateKey: firebaseSecret.private_key.replace(/\n/gm, '\n'),
    projectId: firebaseSecret.project_id,
  }),
  storageBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
});

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();
export const storage = admin.storage();

export const enum CollectionRegistry {
  Workspace = 'workspaces',
  User = 'users',
  TimeTracker = 'time-tracker',
  Repository = 'repositories',
  RepositoryTab = 'repository-tabs',
  Category = 'category',
  Directory = 'directory',
  Subscription = 'subscription',
}
