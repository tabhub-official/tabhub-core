import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { AppResponse, ResponseType, User } from 'src/models';
import { CreateNewUserArgs, DeleteUserArgs, GetUserByIdArgs, UpdateUserArgs } from 'src/dto';
import { createParamDecorator } from '@nestjs/common';

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
    const user = req.user;
    try {
      if (!user) return undefined;
      const currentUser = await this.userService.getUserByEmail(user.email);
      return currentUser;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async createNewUser(@Args('createNewUserArgs') args: CreateNewUserArgs): Promise<AppResponse> {
    try {
      const { email, username, full_name, provider } = args;
      await this.userService.createNewUser(username, provider, full_name, email);
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
  async updateUser(@Args('updateUserArgs') args: UpdateUserArgs): Promise<AppResponse> {
    try {
      const { id, ...workspace } = args;
      await this.userService.updateData(id, workspace);
      return {
        message: `Successfully update workspace ${id}`,
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
  async deleteUser(@Args('deleteUserArgs') args: DeleteUserArgs): Promise<AppResponse> {
    try {
      const { id } = args;
      await this.userService.deleteData(id);
      return {
        message: `Successfully delete workspace ${id}`,
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
