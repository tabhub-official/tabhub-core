import { Injectable } from '@nestjs/common';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { RepositoryTabAsInput } from 'src/dto';
import { AccessVisibility, Directory, Repository } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

import { BaseCRUDService } from '../_base/baseCRUD.service';
import { RepositoryTabService } from '../repository-tab';

@Injectable()
export class RepositoryService extends BaseCRUDService<Repository> {
  constructor(
    private readonly repositoryTabService: RepositoryTabService // private readonly workspaceService: WorkspaceService
  ) {
    super(CollectionRegistry.Repository);
  }

  async isRepositoryContributor(repositoryId: string, userId: string) {
    const workspace = await this.getDataById(repositoryId);
    return workspace.contributors.some(contributor => contributor === userId);
  }

  hasUserPinned = (_repository: Repository, userId: string): boolean => {
    return (_repository.pinned || []).some(userWhoPin => userWhoPin == userId);
  };

  getAllPublicRepositories = async (): Promise<Repository[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection.where('visibility', '==', AccessVisibility.Public).get();
    return publicData.docs.map<Repository>(doc => doc.data() as Repository);
  };

  getUserRepositories = async (userId: string): Promise<Repository[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection
      .where('contributors', 'array-contains', userId)
      .where('visibility', '==', AccessVisibility.Public)
      .get();
    return publicData.docs.map<Repository>(doc => doc.data() as Repository);
  };

  getAuthUserRepositories = async (userId: string): Promise<Repository[]> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection.where('contributors', 'array-contains', userId).get();
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
      .where('workspaceId', '==', workspaceId)
      .where('visibility', '==', AccessVisibility.Public)
      .get();
    return publicData.docs.map<Repository>(doc => doc.data() as Repository);
  };

  getRepositoryByName = async (
    workspaceId: string,
    name: string
  ): Promise<Repository | undefined> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection
      .where('name', '==', name)
      .where('workspaceId', '==', workspaceId)
      .get();
    if (publicData.empty) return undefined;
    return publicData.docs.map<Repository>(doc => doc.data() as Repository)[0];
  };

  createNewRepository = async (
    icon: string,
    name: string,
    tabs: RepositoryTabAsInput[],
    owner: string,
    workspaceId: string,
    visibility: AccessVisibility,
    contributors: string[],
    directories: Directory[] = [],
    description?: string
  ): Promise<void> => {
    if (description?.length > 255) throw new Error('Exceed limit of description length');
    if (contributors.length > 60) throw new Error('Exceed limit of contributors length');
    if (tabs.length > 500) throw new Error('Exceed limit of tabs length');
    if (name.length > 100) throw new Error('Exceed limit of name length');

    const _collection = await db.collection(this.collectionRegistry);
    const newRepositoryId = uuidV4();
    const repositoryTabs = await this.repositoryTabService.createManyRepositoryTab(tabs);
    const data: Partial<Repository> = {
      id: newRepositoryId,
      icon,
      name,
      tabs: repositoryTabs,
      description,
      owner,
      workspaceId,
      visibility,
      directories,
      pinned: [],
      contributors,
      favorites: [],
    };
    await _collection.doc(newRepositoryId).create(data);
  };
}
