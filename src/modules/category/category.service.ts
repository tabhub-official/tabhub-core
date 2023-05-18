import { Injectable } from '@nestjs/common';
import { CollectionRegistry } from 'src/config/firebase-config';
import { Category } from 'src/models';

import { BaseCRUDService } from '../_base/baseCRUD.service';

@Injectable()
export class CategoryService extends BaseCRUDService<Category> {
  constructor() {
    super(CollectionRegistry.Category);
  }
}
