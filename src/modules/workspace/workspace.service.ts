import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { AccessVisibility, Workspace } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class WorkspaceService {
  /** Update workspace method: Providing new workspace data partially to update */
  updateWorkspace = async (id: string, newWorkspaceData: Partial<Workspace>): Promise<void> => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace).doc(id);
    await workspaceCol.update(newWorkspaceData);
  };

  /** Get all workspaces */
  getAllWorkspaces = async (): Promise<Workspace[]> => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace).get();
    const workspaceSnapshot = await workspaceCol.docs;
    const workspaces = workspaceSnapshot.map(doc => doc.data());
    return workspaces as Workspace[];
  };

  /** Get workspace by ID */
  getWorkspaceById = async (id: string): Promise<Workspace> => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace).doc(id);
    const workspaceSnapshot = await workspaceCol.get();
    const workspace = workspaceSnapshot.data();
    return workspace as Workspace;
  };

  /** Delete workspace by ID */
  deleteWorkspace = async (id: string): Promise<void> => {
    const workspaceCol = await db.collection(CollectionRegistry.Workspace).doc(id);
    await workspaceCol.delete({
      exists: true,
    });
  };

  /** Create a new workspace */
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
