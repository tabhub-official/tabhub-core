import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { AccessVisibility, Workspace } from 'src/models';
import { UserRole, checkPermission } from 'src/models/role.model';
import { v4 as uuidV4 } from 'uuid';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class WorkspaceService extends BaseCRUDService<Workspace> {
  constructor() {
    super(CollectionRegistry.Workspace);
  }

  findUserRoleInWorkspace(_workspace: Workspace, userId: string): UserRole | undefined {
    const userWorkspaceIndx = _workspace.members.findIndex(member => member === userId);
    if (userWorkspaceIndx === -1) return undefined;
    const userRole = _workspace.roles[userWorkspaceIndx];
    return userRole;
  }

  async isWorkspaceMember(workspaceId: string, userId: string) {
    const workspace = await this.getDataById(workspaceId);
    if (!workspace) return false;
    return (workspace.members || []).some(member => member === userId);
  }

  private userCanViewWorkspace(userId: string, foundWorkspace: Workspace) {
    /** Check user role permission */
    const userRole = this.findUserRoleInWorkspace(foundWorkspace, userId);
    const isPrivate = foundWorkspace.visibility === AccessVisibility.Private;
    return !isPrivate || checkPermission(userRole, ['workspace', 'read']);
  }

  /** Method: Get Workspace By Id */
  getAuthWorkspaceById = async (
    authUserId: string | undefined,
    id: string
  ): Promise<Workspace | undefined> => {
    const _collection = await db.collection(this.collectionRegistry);
    const query = await _collection.where('id', '==', id).get();
    if (query.empty) return undefined;
    const foundWorkspace = query.docs.map<Workspace>(doc => doc.data() as Workspace)[0];

    if (this.userCanViewWorkspace(authUserId, foundWorkspace)) {
      return foundWorkspace;
    }
    return undefined;
  };

  getAuthUserWorkspaceByName = async (
    authUserId: string | undefined,
    name: string
  ): Promise<Workspace | undefined> => {
    const _collection = await db.collection(this.collectionRegistry);
    const query = await _collection.where('name', '==', name).get();
    if (query.empty) return undefined;
    const foundWorkspace = query.docs.map<Workspace>(doc => doc.data() as Workspace)[0];

    if (this.userCanViewWorkspace(authUserId, foundWorkspace)) {
      return foundWorkspace;
    }
    return undefined;
  };

  /** Method: Get Workspaces */
  getPublicWorkspaces = async (): Promise<Workspace[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const query = await _collection.where('visibility', '==', AccessVisibility.Public).get();
    return query.docs.map<Workspace>(doc => doc.data() as Workspace) || [];
  };

  /** Method: Get User Workspaces */
  getAuthUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const query = await _collection.where('members', 'array-contains', userId).get();
    return query.docs.map<Workspace>(doc => doc.data() as Workspace) || [];
  };

  getUserPublicWorkspaces = async (userId: string): Promise<Workspace[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const query = await _collection
      .where('members', 'array-contains', userId)
      .where('visibility', '==', AccessVisibility.Public)
      .get();
    return query.docs.map<Workspace>(doc => doc.data() as Workspace) || [];
  };

  /** Create a new workspace */
  createNewWorkspace = async (
    userId: string,
    name: string,
    description: string,
    owner: string,
    visibility: AccessVisibility
  ): Promise<void> => {
    const _collection = await db.collection(CollectionRegistry.Workspace);
    const workspaceId = uuidV4();
    const data: Partial<Workspace> = {
      id: workspaceId,
      name,
      description,
      visibility: visibility,
      owner,
      created_date: moment().unix(),
      updated_date: moment().unix(),
      members: [userId],
      roles: [UserRole.WorkspaceOwner],
      repositories: [],
    };
    await _collection.doc(workspaceId).create(data);
  };
}
