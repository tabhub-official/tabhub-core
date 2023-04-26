import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserService } from './user.service';
import { AppResponse, ResponseType, User, Workspace } from 'src/models';
import { CreateNewUserArgs, DeleteUserArgs, GetUserByIdArgs, UpdateUserArgs } from 'src/dto';

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [Workspace])
  async getAllUsers() {
    try {
      return this.userService.getAllData();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Workspace)
  async getUserById(@Args('getUserByIdArgs') args: GetUserByIdArgs): Promise<User> {
    try {
      const { id } = args;
      return this.userService.getDataById(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async createNewUser(@Args('createNewUserArgs') args: CreateNewUserArgs): Promise<AppResponse> {
    try {
      const { email, username, full_name } = args;
      await this.userService.createNewUser(username, full_name, email);
      return {
        message: `Successfully create new workspace ${name}`,
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
