import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { PinRepositoryTabArgs, UnpinRepositoryTabArgs } from 'src/dto/repository-tab';
import { AppResponse, RepositoryTab, ResponseType } from 'src/models';
import { getAuthUser } from 'src/utils';

import { UserService } from '../user';

@Resolver(() => RepositoryTab)
export class RepositoryTabResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => AppResponse)
  async pinRepositoryTab(
    @Context('req') req,
    @Args('pinRepositoryTabArgs') args: PinRepositoryTabArgs
  ): Promise<AppResponse> {
    try {
      const { tabId } = args;
      const authUser = getAuthUser(req);
      const userId = authUser.id;
      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');
      await this.userService.updateData(userId, {
        pinned_tabs: currentUser.pinned_tabs.concat([tabId]),
      });
      return {
        message: `Successfully pin tab ${tabId}`,
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
  async unpinRepositoryTab(
    @Context('req') req,
    @Args('unpinRepositoryTabArgs') args: UnpinRepositoryTabArgs
  ): Promise<AppResponse> {
    try {
      const { tabId } = args;
      const authUser = getAuthUser(req);
      const userId = authUser.id;
      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');
      await this.userService.updateData(userId, {
        pinned_tabs: currentUser.pinned_tabs.filter(tab => tab !== tabId),
      });
      return {
        message: `Successfully unpin tab ${tabId}`,
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
