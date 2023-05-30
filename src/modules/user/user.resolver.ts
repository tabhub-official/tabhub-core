import { createParamDecorator } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import {
  CreateNewUserArgs,
  GetUserByEmailArgs,
  GetUserByIdArgs,
  SmartTabGroupingArgs,
  TabWithCategory,
  UpdateUserArgs,
} from 'src/dto';
import { AppResponse, ResponseType, User } from 'src/models';
import { getAuthUser } from 'src/utils/auth';

import { OpenAIService } from '../openai';
import { UserService } from './user.service';

export type CurrentUserType = {
  email: string;
  phone?: string;
  picture?: string;
};
export const CurrentUser = createParamDecorator((_, req) => req.user);

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService, private openaiService: OpenAIService) {}

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
      const { ...workspace } = args;
      await this.userService.updateData(authUser.id, workspace);
      return {
        message: `Successfully update workspace ${authUser.id}`,
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
      const prompt = `
        Act as a tab manager, categorize these browser tabs into groups following the JSON:\n
        { url: string, category: string }\n
        The provided list of browser tabs is: ${JSON.stringify(tabs)}\n
        ${
          groups.length > 0
            ? `The provided list of recommneded groups is: ${JSON.stringify(groups)}\n
        If browser tab can't be assigned to any group recommended in the provided list of groups, categorize it on your own.`
            : ``
        }
        Please respond the array of object directly. Don't say anything else. 
      `;
      const response = await this.openaiService.makeRawCompletion('system', prompt);
      const content = response.choices[0].message.content;
      console.log(content);
      let output: { url: string; category: string }[] = [];
      try {
        output = JSON.parse(content);
      } catch (error) {
        output = [];
      }
      return output.map(item => ({
        category: item.category.toUpperCase(),
        url: item.url,
      }));
    } catch (error: any) {
      console.log(error);
      return [];
    }
  }
}
