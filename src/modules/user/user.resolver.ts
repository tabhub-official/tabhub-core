import { createParamDecorator } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { auth } from 'firebase-admin';
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
import { EmailTemplate } from 'src/utils/email';

import { SmartGroupService } from '../openai';
import { EmailService } from './email.service';
import { UserService } from './user.service';

export type CurrentUserType = {
  email: string;
  phone?: string;
  picture?: string;
};
export const CurrentUser = createParamDecorator((_, req) => req.user);

@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private smartGroupService: SmartGroupService,
    private emailService: EmailService
  ) {}

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

      const firstName = full_name.split(' ')[0];

      // Create and send the email using SendGrid dynamic templates
      const template: EmailTemplate = {
        recipient: email,
        from: 'an@tabhub.io',
        subject: 'Welcome to TabHub!',
        template_id: 123456, // SendGrid template ID
        dynamic_template_data: {
          // Replace with the dynamic data you want to include in the email
          first_name: firstName,
          // Add other dynamic data here
        },
      };

      const emailSent = await this.emailService.sendEmail(template);
      if (emailSent) {
        return {
          message: `Successfully create new user ${email}`,
          type: ResponseType.Success,
        };
      } else {
        return {
          message: 'Failed to send the welcome email.',
          type: ResponseType.Error,
        };
      }
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
      await auth().deleteUser(authUser.id);
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
      const output = await this.smartGroupService.generatePrompt(tabs, groups);
      return output;
    } catch (error: any) {
      console.log(error);
      return [];
    }
  }
}
