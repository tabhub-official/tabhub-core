import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { RepositoryTabAsInput } from 'src/dto';
import {
  AccessPermission,
  AccessVisibility,
  Directory,
  Repository,
  UserWhoHasAccess,
} from 'src/models';
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

  async isRepositoryContributor(repository: Repository, userId: string) {
    return repository.contributors.some(contributor => contributor === userId);
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

  getRepositoryBySlug = async (
    workspaceId: string,
    slug: string
  ): Promise<Repository | undefined> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection
      .where('slug', '==', slug)
      .where('workspaceId', '==', workspaceId)
      .get();
    if (publicData.empty) return undefined;
    return publicData.docs.map<Repository>(doc => doc.data() as Repository)[0];
  };

  getRepositoryAsContributorByName = async (
    workspaceId: string,
    userId: string
  ): Promise<Repository | undefined> => {
    const _collection = await db.collection(this.collectionRegistry);
    const publicData = await _collection
      .where('workspaceId', '==', workspaceId)
      .where('contributors', 'array-contains', userId)
      .get();
    if (publicData.empty) return undefined;
    return publicData.docs.map<Repository>(doc => doc.data() as Repository)[0];
  };

  getUserWhoHasAccess = async (repository: Repository): Promise<UserWhoHasAccess[]> => {
    const contributors = repository.contributors.map<UserWhoHasAccess>(contributor => ({
      type: 'contributor',
      id: contributor,
    }));
    const permittedUsers = repository.permittedUsers.map<UserWhoHasAccess>(user => ({
      type: 'public',
      id: user,
    }));
    return [...contributors, ...permittedUsers];
  };

  createNewRepository = async (
    icon: string,
    slug: string,
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
    const repositoryTabs = this.repositoryTabService.createManyRepositoryTab(tabs);

    const data: Repository = {
      id: newRepositoryId,
      readme: '',
      bannerUrl: '',
      icon,
      name,
      slug,
      tabs: repositoryTabs,
      description,
      owner,
      workspaceId,
      visibility,
      directories,
      pinned: [],
      contributors,
      favorites: [],
      permittedUsers: [],
      accessPermission:
        visibility === AccessVisibility.Public
          ? AccessPermission.EveryoneWithTheLink
          : AccessPermission.OnlyPeopleWhoHasAccess,
      created_date: moment().unix(),
      updated_date: moment().unix(),
    };
    await _collection.doc(newRepositoryId).create(data);
  };
}
