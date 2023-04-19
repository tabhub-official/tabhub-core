import { Injectable } from '@nestjs/common';
import { collection, getDocs } from 'firebase/firestore/lite';
import { CollectionRegistry, db } from 'src/config/firebase-config';

@Injectable()
export class FirebaseService {
  getAllWorkspaces = async () => {
    const workspaceCol = collection(db, CollectionRegistry.Workspace);
    const workspaceSnapshot = await getDocs(workspaceCol);
    const workspaces = workspaceSnapshot.docs.map((doc) => doc.data());
    return workspaces;
  };
}
