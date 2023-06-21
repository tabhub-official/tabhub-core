import { Args, Query, Resolver } from '@nestjs/graphql';
import {
  GatherUrlsMetadataArgs,
  QueryOpenGraphMetadataArgs,
  SearchTabOnWebArgs,
} from 'src/dto/repository-tab';
import { AppResponse, RepositoryTab, ResponseType } from 'src/models';

import { CrawlerService } from '../crawler';

@Resolver(() => RepositoryTab)
export class RepositoryTabResolver {
  constructor(private crawlerService: CrawlerService) {}

  @Query(() => AppResponse)
  async queryOpenGraphMetadata(
    @Args('queryOpenGraphMetadata') { websiteUrl }: QueryOpenGraphMetadataArgs
  ): Promise<AppResponse> {
    try {
      const res = await this.crawlerService.queryOpenGraphMetadata(websiteUrl);
      return {
        message: JSON.stringify(res),
        type: ResponseType.Success,
      };
    } catch (error) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Query(() => [RepositoryTab])
  async gatherUrlsMetadata(@Args('gatherUrlsMetadataArgs') args: GatherUrlsMetadataArgs) {
    try {
      const tabs: RepositoryTab[] = [];
      for (const url of args.websiteUrls) {
        const repositoryTab = await this.crawlerService.gatherRepositoryTabFromUrl(url);
        tabs.push(repositoryTab);
      }
      return tabs;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => String)
  async searchOnWeb(@Args('searchTabOnWebArgs') args: SearchTabOnWebArgs): Promise<string> {
    try {
      const urls = await this.crawlerService.crawlWebsite(args.websiteUrl);
      const _urlsWithImage: { url: string; image: string }[] = [];
      for (const url of urls) {
        const imageData = await this.crawlerService.queryFaviconIcon(url);
        _urlsWithImage.push({
          url,
          image: imageData,
        });
      }
      return JSON.stringify(_urlsWithImage);
    } catch (error) {
      throw new Error(error);
    }
  }
}
