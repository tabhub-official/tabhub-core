import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { AccessVisibility, Repository } from 'src/models';
import { v4 as uuidV4 } from 'uuid';
import { BaseCRUDService } from '../_base/baseCRUD.service';
import { RepositoryTabService } from '../repository-tab';
import { RepositoryTabAsInput } from 'src/dto';

@Injectable()
export class RepositoryService extends BaseCRUDService<Repository> {
  constructor(private readonly repositoryTabService: RepositoryTabService) {
    super(CollectionRegistry.Repository);
  }

  getAllPublicRepositories = async (): Promise<Repository[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection.where('visibility', '==', AccessVisibility.Public).get();
    return publicData.docs.map<Repository>(doc => doc.data() as Repository);
  };

  getWorkspaceRepositories = async (workspaceId: string): Promise<Repository[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection.where('workspaceId', '==', workspaceId).get();
    return publicData.docs.map<Repository>(doc => doc.data() as Repository);
  };

  getWorkspacePublicRepositories = async (workspaceId: string): Promise<Repository[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection
      .where('visibility', '==', AccessVisibility.Public)
      .where('workspaceId', '==', workspaceId)
      .get();
    return publicData.docs.map<Repository>(doc => doc.data() as Repository);
  };

  createNewRepository = async (
    name: string,
    tabs: RepositoryTabAsInput[],
    owner: string,
    workspaceId: string,
    description?: string
  ): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const newRepositoryId = uuidV4();
    const repositoryTabs = await this.repositoryTabService.createManyRepositoryTab(tabs);
    const data: Partial<Repository> = {
      id: newRepositoryId,
      name,
      tabs: repositoryTabs,
      description,
      owner,
      workspaceId,
    };
    await _collection.doc(newRepositoryId).create(data);
  };
}
