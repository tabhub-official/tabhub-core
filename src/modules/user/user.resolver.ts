import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { AppResponse, ResponseType, User } from 'src/models';
import { CreateNewUserArgs, GetUserByIdArgs, UpdateUserArgs } from 'src/dto';
import { createParamDecorator } from '@nestjs/common';
import { getAuthUser } from 'src/utils/auth';

export type CurrentUserType = {
  email: string;
  phone?: string;
  picture?: string;
};
export const CurrentUser = createParamDecorator((_, req) => req.user);

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

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
    const authUser = getAuthUser(req);
    try {
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
    const authUser = getAuthUser(req);
    try {
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
}
