import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService {
  async crawlWebsite(url: string): Promise<string[]> {
    const paginationURLsToVisit = [url];
    const productURLs: string[] = [];

    const browser = await puppeteer.launch({
      headless: 'new',
    });

    while (paginationURLsToVisit.length > 0) {
      const paginationUrl = paginationURLsToVisit.pop();

      const page = await browser.newPage();
      const htmlResponse = await page.goto(paginationUrl);
      const data = await htmlResponse.text();

      // const pageHTML = await axios.get(paginationUrl, {
      //   headers: {
      //     'Accept-Encoding': 'text/html; charset=UTF-8',
      //     'User-Agent':
      //       'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4',
      //   },
      // });

      const $ = cheerio.load(data);
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
