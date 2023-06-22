import * as admin from 'firebase-admin';
import { CollectionRegistry } from 'src/config';
import { Repository } from 'src/models';

const firebaseSecret = {
  private_key: '',
  client_email: '',
  project_id: '',
};

// Initialize firebase admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: firebaseSecret.client_email,
    privateKey: firebaseSecret.private_key.replace(/\n/gm, '\n'),
    projectId: firebaseSecret.project_id,
  }),
});

export const db = admin.firestore();

async function updateData<T>(id: string, updatedData: Partial<T>): Promise<T> {
  const _collection = await db.collection(CollectionRegistry.Repository).doc(id);
  const _snapshot = await _collection.get();
  const oldData = _snapshot.data();
  const _updatedRecord = {
    ...oldData,
    ...updatedData,
  };
  await _collection.update(_updatedRecord);
  return _updatedRecord as T;
}

const runBatch = async () => {
  const _collection = await db.collection(CollectionRegistry.Repository);
  const publicData = await _collection.get();
  const repositories = publicData.docs.map<Repository>(doc => doc.data() as Repository);
  for (const repository of repositories) {
    await updateData<Repository>(repository.id, {
      favorite_count: repository.favorites.length,
    });
  }
};

runBatch();
