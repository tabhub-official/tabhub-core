import { Injectable } from '@nestjs/common';
import { Workspace } from 'src/models';

@Injectable()
export class WorkspaceService {
  async getAllWorkspaces(): Promise<Workspace[]> {
    return [];
  }
}
