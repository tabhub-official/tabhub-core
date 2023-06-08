import 'dotenv/config';
import * as admin from 'firebase-admin';

// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
});

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();

export const enum CollectionRegistry {
  Workspace = 'workspaces',
  User = 'users',
  Repository = 'repositories',
  RepositoryTab = 'repository-tabs',
  Category = 'category',
  Directory = 'directory',
}
