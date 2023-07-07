import { Injectable } from '@nestjs/common';
import { RepositoryTabAsInput, TabWithCategory } from 'src/dto';
import { makeid } from 'src/utils';

import { OpenAIService } from './openai.service';

@Injectable()
export class SmartGroupService {
  constructor(private readonly openaiService: OpenAIService) {}

  generatePrompt = async (
    _tabs: RepositoryTabAsInput[],
    groups: string[]
  ): Promise<TabWithCategory[]> => {
    const tabsWithId = _tabs.map(tab => ({
      id: makeid(4),
      ...tab,
    }));
    const prompt = `
          Categorize the provided browser tabs into groups using the JSON format: {id: string, category: string }
          Tabs: ${JSON.stringify(tabsWithId)}
          ${
            groups.length > 0
              ? `Recommended groups: ${JSON.stringify(
                  groups
                )}. If a tab doesn't fit any recommended group, create a category for it`
              : `No recommended groups are provided. You need to categorize the tabs on your own.`
          }
          Goal: No more than ${
            _tabs.length / 2
          } groups generated. Each group should have at least 2 items
          Requirements: Output array must contain data for all provided tabs. 
          Please respond with an array of objects representing the tab categories, in the given order. Exclude any additional information in your response.
        `;
    const response = await this.openaiService.makeRawCompletion('system', prompt);
    const content = response.choices[0].message.content;
    let output: { index: number; category: string }[] = [];
    try {
      output = JSON.parse(content);
    } catch (error) {
      output = [];
    }
    return output.map(item => ({
      category: item.category.toUpperCase(),
    }));
  };
}
