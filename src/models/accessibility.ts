import { registerEnumType } from '@nestjs/graphql';

export enum AccessVisibility {
  Private = 0,
  Public = 1,
}

registerEnumType(AccessVisibility, {
  name: 'AccessVisibility',
  description: 'Visibility used for repository and workspace',
});
