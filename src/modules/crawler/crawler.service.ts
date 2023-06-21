import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Scope } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import ogs from 'open-graph-scraper';
import puppeteer, { Browser } from 'puppeteer';
import { RepositoryTab } from 'src/models';
import { v4 as uuidV4 } from 'uuid';

function getBase64(url) {
  return axios
    .get(url, {
      responseType: 'arraybuffer',
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'));
}

/** RAII server to handle search on web feature */
@Injectable({ scope: Scope.DEFAULT })
export class CrawlerService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);
  headlessBrowser: Browser | undefined = undefined;

  async onModuleDestroy() {
    await this.headlessBrowser.close();
  }

  async onModuleInit() {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (executablePath) this.logger.log(`Puppeteer instance is running on path ${executablePath}`);
    else this.logger.log('Puppeteer instance is running using default path');

    this.headlessBrowser = await puppeteer.launch({
      headless: 'new',
      executablePath,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-extensions'],
    });
  }

  async crawlWebsite(url: string): Promise<string[]> {
    if (!this.headlessBrowser) throw new Error('No puppeteer instance found');
    this.logger.log(`🔍 Crawling website ${url}...`);
    const hrefRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    const paginationURLsToVisit = [url];
    const productURLs: string[] = [];

    while (paginationURLsToVisit.length > 0) {
      const paginationUrl = paginationURLsToVisit.pop();

      const page = await this.headlessBrowser.newPage();
      await page.setRequestInterception(true);

      page.on('request', interceptedRequest => {
        if (interceptedRequest.isInterceptResolutionHandled()) return;
        const requestUrl = interceptedRequest.url();
        if (
          requestUrl.endsWith('.png') ||
          requestUrl.endsWith('.jpg') ||
          !hrefRegex.test(requestUrl)
        )
          interceptedRequest.abort();
        else interceptedRequest.continue();
      });

      const htmlResponse = await page.goto(paginationUrl);
      const data = await htmlResponse.text();
      await page.close();

      const $ = cheerio.load(data);
      $('a').each((_, element) => {
        const paginationURL = $(element).attr('href');
        if (!paginationURLsToVisit.includes(paginationURL) && hrefRegex.test(paginationURL)) {
          productURLs.push(paginationURL);
        }
      });
    }
    return productURLs;
  }

  queryOpenGraphMetadata = async (websiteUrl: string) => {
    const data = await ogs({
      url: websiteUrl,
      onlyGetOpenGraphInfo: true,
      timeout: 1000,
    });
    return data.result;
  };

  queryFaviconIcon = async (url: string) => {
    try {
      const getFaviconUrl = `http://www.google.com/s2/favicons?domain=${url}`;
      const imageData = await getBase64(getFaviconUrl);
      return `data:image/jpeg;base64,${imageData}`;
    } catch (error) {
      console.log(error);
    }
  };

  gatherRepositoryTabFromUrl = async (url: string): Promise<RepositoryTab> => {
    let repositoryTab;
    let faviconIcon = '';
    faviconIcon = await this.queryFaviconIcon(url);
    try {
      const getFaviconUrl = `http://www.google.com/s2/favicons?domain=${url}`;
      const imageData = await getBase64(getFaviconUrl);
      faviconIcon = `data:image/jpeg;base64,${imageData}`;
    } catch (error) {
      console.log(error);
    }
    try {
      const res = await this.queryOpenGraphMetadata(url);
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
        favIconUrl: faviconIcon,
      };
    }
    return repositoryTab;
  };
}
