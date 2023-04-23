import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { AccessVisibility, Workspace } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class WorkspaceService {
  getAllWorkspaces = async () => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace).get();
    const workspaceSnapshot = await workspaceCol.docs;
    const workspaces = workspaceSnapshot.map(doc => doc.data());
    return workspaces;
  };

  getWorkspaceById = async (id: string) => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace).doc(id);
    const workspaceSnapshot = await workspaceCol.get();
    const workspace = workspaceSnapshot.data();
    return workspace;
  };

  createNewWorkspace = async (
    name: string,
    description: string,
    visibility: AccessVisibility
  ): Promise<void> => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace);
    const workspaceId = uuidV4();
    const data: Partial<Workspace> = {
      id: workspaceId,
      name,
      description,
      visibility: visibility,
    };
    await workspaceCol.doc(workspaceId).create(data);
  };
}
