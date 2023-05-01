import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { AccessVisibility, Workspace } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';
import * as moment from 'moment';

@Injectable()
export class WorkspaceService extends BaseCRUDService<Workspace> {
  constructor() {
    super(CollectionRegistry.Workspace);
  }

  getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
    const _collection = await db.collection(CollectionRegistry.Workspace);
    const query = await _collection.where('members', 'array-contains', userId).get();
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
      repositories: [],
    };
    await _collection.doc(workspaceId).create(data);
  };
}
