import * as admin from 'firebase-admin';

import * as adminSdkConfig from './admin-sdk-config.json';

// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert(adminSdkConfig as any),
});

export const db = admin.firestore();
export const auth = admin.auth();

export const enum CollectionRegistry {
  Workspace = 'workspaces',
  User = 'users',
  Repository = 'repositories',
  RepositoryTab = 'repository-tabs',
  Category = 'category',
}
