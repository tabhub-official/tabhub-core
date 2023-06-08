import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class CrawlerService {
  async crawlWebsite(url: string): Promise<string[]> {
    const paginationURLsToVisit = [url];
    const productURLs: string[] = [];

    while (paginationURLsToVisit.length > 0) {
      const paginationUrl = paginationURLsToVisit.pop();
      const pageHTML = await axios.get(paginationUrl, {
        headers: { 'Accept-Encoding': 'text/html; charset=UTF-8' },
      });

      const $ = cheerio.load(pageHTML.data);

      $('a').each((_, element) => {
        const hrefRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
        const paginationURL = $(element).attr('href');
        if (!paginationURLsToVisit.includes(paginationURL) && hrefRegex.test(paginationURL)) {
          productURLs.push(paginationURL);
        }
      });
    }

    return productURLs;
  }
}
