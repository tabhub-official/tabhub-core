import { Injectable } from '@nestjs/common';
import { CollectionRegistry } from 'src/config/firebase-config';
import { Directory } from 'src/models';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class DirectoryService extends BaseCRUDService<Directory> {
  constructor() {
    super(CollectionRegistry.Directory);
  }
}
