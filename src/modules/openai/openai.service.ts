import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenAIService {
  openAI: OpenAIApi;
  modelName: string;
  configuration: Configuration;

  constructor() {
    const configuration = new Configuration({
      organization: process.env.OPENAI_ORGANIZATION as string,
      apiKey: process.env.OPENAI_API_KEY as string,
    });
    this.modelName = 'gpt-3.5-turbo';
    this.openAI = new OpenAIApi(configuration);
  }

  async makeRawCompletion(role: string, prompt: string): Promise<any | undefined> {
    try {
      const completionConfig = {
        model: this.modelName,
        messages: [
          {
            role,
            content: prompt,
          },
        ],
        // n: numberOfCompletions,
      };
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        completionConfig,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
          },
        }
      );
      if (response.status !== 200) {
        throw new Error('HTTP response is unsuccessful');
      }
      return response.data;
    } catch (error: any) {
      throw new Error(`[OpenAIService] Error making completion: ${error.message}`);
    }
  }
}
