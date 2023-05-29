import { registerEnumType } from '@nestjs/graphql';

export enum AccessVisibility {
  Private = 0,
  Public = 1,
}

registerEnumType(AccessVisibility, {
  name: 'AccessVisibility',
  description: 'Visibility used for repository and workspace',
});

export enum AccessPermission {
  EveryoneWithTheLink,
  OnlyPeopleWhoHasAccess,
}

registerEnumType(AccessPermission, {
  name: 'AccessPermission',
  description: 'Permission for repository share mode',
});
