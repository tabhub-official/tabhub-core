import { CollectionRegistry, db } from 'src/config/firebase-config';

export abstract class BaseCRUDService<T> {
  collectionRegistry: CollectionRegistry;
  constructor(_registry: CollectionRegistry) {
    this.collectionRegistry = _registry;
  }
  async updateData(id: string, updatedData: Partial<T>): Promise<void> {
    const _collection = await db.collection(this.collectionRegistry).doc(id);
    await _collection.update(updatedData);
  }

  async getAllData(): Promise<T[]> {
    const _collection = await db.collection(this.collectionRegistry).get();
    const _snapshot = await _collection.docs;
    const users = _snapshot.map(doc => doc.data());
    return users as T[];
  }

  async getDataById(id: string): Promise<T> {
    const _collection = await db.collection(this.collectionRegistry).doc(id);
    const _snapshot = await _collection.get();
    const workspace = _snapshot.data();
    return workspace as T;
  }

  async deleteData(id: string): Promise<void> {
    const _collection = await db.collection(this.collectionRegistry).doc(id);
    await _collection.delete({
      exists: true,
    });
  }
}
