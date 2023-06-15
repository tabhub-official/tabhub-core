import { Args, Query, Resolver } from '@nestjs/graphql';
import axios from 'axios';
import ogs from 'open-graph-scraper';
import { QueryOpenGraphMetadataArgs, SearchTabOnWebArgs } from 'src/dto/repository-tab';
import { AppResponse, RepositoryTab, ResponseType } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

import { CrawlerService } from '../crawler';

@Resolver(() => RepositoryTab)
export class RepositoryTabResolver {
  constructor(private crawlerService: CrawlerService) {}

  @Query(() => AppResponse)
  async queryOpenGraphMetadata(
    @Args('queryOpenGraphMetadata') { websiteUrl }: QueryOpenGraphMetadataArgs
  ): Promise<AppResponse> {
    try {
      const data = await ogs({
        url: websiteUrl,
        onlyGetOpenGraphInfo: true,
        timeout: 1000,
      });
      const res = data.result;
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
          let faviconIcon = res.ogImage.length > 0 ? res.ogImage[0].url : '';
          try {
            const getFaviconUrl = `http://www.google.com/s2/favicons?domain=${url}`;
            const response = await axios.get(getFaviconUrl);
            faviconIcon = response.data;
          } catch (error) {
            console.log(error);
          }
          repositoryTab = {
            id: `temp-${uuidV4()}`,
            description: res.ogDescription,
            url: url,
            title: res.ogTitle || '',
            customName: res.ogTitle || '',
            favIconUrl: faviconIcon,
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
}
