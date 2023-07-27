import { Injectable } from '@nestjs/common';
import { RepositoryTabAsInput, TabWithCategory } from 'src/dto';
import { shortenString } from 'src/utils';

import { OpenAIService } from './openai.service';

@Injectable()
export class SmartGroupService {
  constructor(private readonly openaiService: OpenAIService) {}

  generatePrompt = async (
    _tabs: RepositoryTabAsInput[],
    groups: string[]
  ): Promise<TabWithCategory[]> => {
    const tabsWithId = _tabs.map(tab => ({
      title: shortenString(tab.title, 50),
      url: tab.url,
    }));
    const prompt = `
      Categorize the provided browser tabs into groups, output following the JSON format: {url: string, category: string }
      Tabs: ${JSON.stringify(tabsWithId)}
      ${
        groups.length > 0
          ? `Existing groups: ${JSON.stringify(
              groups
            )}. If a tab doesn't fit in any existing group, you need to categorize the tabs on your own.`
          : `No recommended groups are provided. You need to categorize the tabs on your own.`
      }
      Goal: No more than ${
        _tabs.length / 2
      } groups generated. Each group should have at least 2 items
      Please respond with an array of objects in the provided order directly. 
      Exclude any additional information in your response.
    `;
    const pattern = /\[[^\]]*\]/;
    const response = await this.openaiService.makeRawCompletion('system', prompt);
    const content = response.choices[0].message.content;
    let output: { url: string; category: string }[] = [];
    const matches = content.match(pattern);
    try {
      output = JSON.parse(matches?.[0]);
    } catch (error) {
      output = _tabs.map(tab => ({
        url: tab.url,
        category: 'OTHER',
      }));
    }
    return output.map(item => ({
      ...item,
      category: item.category.toUpperCase(),
    }));
  };
}
