import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import ogs from 'open-graph-scraper';
import {
  PinRepositoryTabArgs,
  SearchTabOnWebArgs,
  UnpinRepositoryTabArgs,
} from 'src/dto/repository-tab';
import { AppResponse, RepositoryTab, ResponseType } from 'src/models';
import { getAuthUser } from 'src/utils';
import { v4 as uuidV4 } from 'uuid';

import { CrawlerService } from '../crawler';
import { UserService } from '../user';

@Resolver(() => RepositoryTab)
export class RepositoryTabResolver {
  constructor(private userService: UserService, private crawlerService: CrawlerService) {}

  @Query(() => [RepositoryTab])
  async searchOnWeb(@Args('searchTabOnWebArgs') args: SearchTabOnWebArgs) {
    try {
      const urls = await this.crawlerService.crawlWebsite(args.websiteUrl);
      const tabs: RepositoryTab[] = [];
      for (const url of urls.slice(args.offset, args.offset + args.limit)) {
        let repositoryTab;
        try {
          const data = await ogs({
            url,
            onlyGetOpenGraphInfo: true,
            timeout: 500,
          });
          const res = data.result;
          repositoryTab = {
            id: `temp-${uuidV4()}`,
            description: res.ogDescription,
            url: url,
            title: res.ogTitle || '',
            customName: res.ogTitle || '',
            favIconUrl: res.ogImage.length > 0 ? res.ogImage[0].url : '',
          };
        } catch (error) {
          repositoryTab = {
            id: `temp-${uuidV4()}`,
            description: '',
            url: url,
            title: url,
            customName: url,
            favIconUrl: '',
          };
        }
        tabs.push(repositoryTab);
      }
      return tabs;
    } catch (error) {
      throw new Error(error);
    }
  }

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
