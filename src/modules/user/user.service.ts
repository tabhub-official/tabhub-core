import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { CollectionRegistry, db } from 'src/config/firebase-config';
import { User } from 'src/models';
import { TimeTrackerSessionSetting } from 'src/models/time-tracker.model';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class UserService extends BaseCRUDService<User> {
  constructor() {
    super(CollectionRegistry.User);
  }

  async updateTimeTrackerSetting(
    userId: string,
    setting: TimeTrackerSessionSetting
  ): Promise<TimeTrackerSessionSetting | undefined> {
    const user = await this.getDataById(userId);
    if (user) {
      await this.updateData(userId, {
        time_tracker_setting: setting,
      });
      return setting;
    }
    return undefined;
  }

  async removeWorkspace(workspaceId: string, userId: string) {
    const user = await this.getDataById(userId);
    if (user) {
      await this.updateData(userId, {
        workspaces: user.workspaces.filter(workspace => workspace !== workspaceId),
      });
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const _collection = await db.collection(this.collectionRegistry);
    const data = _collection.where('email', '==', email);
    const _snapshot = await data.get();
    if (_snapshot.empty) return undefined;
    const user: User = _snapshot.docs.map<User>(doc => doc.data() as User)[0] as any;
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const _collection = await db.collection(this.collectionRegistry);
    const data = _collection.where('username', '==', username);
    const _snapshot = await data.get();
    if (_snapshot.empty) return undefined;
    const user: User = _snapshot.docs.map<User>(doc => doc.data() as User)[0] as any;
    return user;
  }

  /** Create a new workspace */
  createNewUser = async (
    userId: string,
    username: string,
    profileImage: string,
    email: string,
    provider?: string,
    fullName?: string
  ): Promise<void> => {
    const _collection = await db.collection(this.collectionRegistry);
    const existingUser = await _collection.where('email', '==', email).count().get();
    if (existingUser.data().count > 0) {
      throw new Error('Email is registered already');
    }
    const data: Partial<User> = {
      id: userId,
      username,
      email,
      provider,
      full_name: fullName,
      followers: [],
      favorites: [],
      following: [],
      profile_image: profileImage,
      created_date: moment().unix(),
      pinned_repositories: [],
      pinned_tabs: [],
      selected_workspace: null,
      updated_date: moment().unix(),
      workspaces: [],
    };

    await _collection.doc(userId).create(data);
  };
}
