import { createParamDecorator } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import {
  CreateNewUserArgs,
  GetUserByEmailArgs,
  GetUserByIdArgs,
  GetUserByUsernameArgs,
  SmartTabGroupingArgs,
  TabWithCategory,
  UpdateUserArgs,
} from 'src/dto';
import { AppResponse, ResponseType, User } from 'src/models';
import { getAuthUser } from 'src/utils/auth';

import { SmartGroupService } from '../openai';
import { UserService } from './user.service';

export type CurrentUserType = {
  email: string;
  phone?: string;
  picture?: string;
};
export const CurrentUser = createParamDecorator((_, req) => req.user);

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService, private smartGroupService: SmartGroupService) {}

  @Query(() => [User])
  async getAllUsers() {
    try {
      return this.userService.getAllData();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => User, { nullable: true })
  async getUserById(@Args('getUserByIdArgs') args: GetUserByIdArgs): Promise<User | undefined> {
    try {
      const { id } = args;
      return this.userService.getDataById(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => User, { nullable: true })
  async getUserByEmail(
    @Args('getUserByEmailArgs') args: GetUserByEmailArgs
  ): Promise<User | undefined> {
    try {
      const { email } = args;
      return this.userService.getUserByEmail(email);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => User, { nullable: true })
  async getUserByUsername(
    @Args('getUserByUsernameArgs') args: GetUserByUsernameArgs
  ): Promise<User | undefined> {
    try {
      const { username } = args;
      return this.userService.getUserByUsername(username);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => User, { nullable: true })
  async getCurrentUser(@Context('req') req): Promise<User | undefined> {
    const authUser = getAuthUser(req);
    try {
      const currentUser = await this.userService.getDataById(authUser.id);
      return currentUser;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async createNewUser(@Args('createNewUserArgs') args: CreateNewUserArgs): Promise<AppResponse> {
    try {
      const { uid, email, username, full_name, provider, profile_image } = args;
      await this.userService.createNewUser(
        uid,
        username,
        profile_image,
        email,
        provider,
        full_name
      );
      return {
        message: `Successfully create new user ${email}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async updateUser(
    @Context('req') req,
    @Args('updateUserArgs') args: UpdateUserArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { ...user } = args;
      const existingUser = await this.userService.getUserByUsername(user.username);
      if (existingUser && existingUser.email !== authUser.email)
        throw new Error('Username is taken already');
      await this.userService.updateData(authUser.id, user);
      return {
        message: `Successfully update user ${authUser.id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async deleteUser(@Context('req') req): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      await this.userService.deleteData(authUser.id);
      return {
        message: `Successfully delete workspace ${authUser.id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  /** Doing magic below here */
  @Mutation(() => [TabWithCategory])
  async smartTabGrouping(
    @Args('smartTabGroupingArgs') args: SmartTabGroupingArgs
  ): Promise<TabWithCategory[]> {
    try {
      const { tabs, groups } = args;

      let continuousGroups: string[] = groups;
      let finalOutput = [];
      let startIndex = 0;
      const batchSize = 10;
      while (true) {
        const [startSize, endSize] = [startIndex * batchSize, (startIndex + 1) * batchSize];
        const tabChunks = tabs.slice(startSize, endSize);
        const output = await this.smartGroupService.generatePrompt(tabChunks, continuousGroups);
        continuousGroups = continuousGroups.concat(output.map(item => item.category));
        finalOutput = finalOutput.concat(output);
        if (endSize >= tabs.length) break;
        startIndex++;
      }
      console.log(finalOutput);
      return finalOutput;
    } catch (error: any) {
      console.log(error);
      return [];
    }
  }
}
