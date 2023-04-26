import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { AccessVisibility, Workspace } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class WorkspaceService extends BaseCRUDService<Workspace> {
  constructor() {
    super(CollectionRegistry.Workspace);
  }

  /** Create a new workspace */
  createNewWorkspace = async (
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
    };
    await _collection.doc(workspaceId).create(data);
  };
}
