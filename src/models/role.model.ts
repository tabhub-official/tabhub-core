import { registerEnumType } from '@nestjs/graphql';
import { RolePermission } from 'src/auth/rolePermission';

import * as RepositoryContributorPermission from '../auth/permissions/repository-contributor.json';
import * as WorkspaceMemberPermission from '../auth/permissions/workspace-member.json';
import * as WorkspaceModeratorPermission from '../auth/permissions/workspace-moderator.json';
import * as WorkspaceOwnerPermission from '../auth/permissions/workspace-owner.json';

export enum UserRole {
  WorkspaceOwner = 0,
  WorkspaceModerator = 1,
  WorkspaceMember = 2,
  RepositoryContributor = 3,
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Type of user roles in the system',
});

export type FlattenRepositoryPermission = keyof RolePermission['repository'];
export type FlattenWorkspacePermission = keyof RolePermission['workspace'];
export type FlattenRolePermission =
  | keyof RolePermission
  | FlattenRepositoryPermission
  | FlattenWorkspacePermission
  | keyof RolePermission['repository'][FlattenRepositoryPermission]
  | keyof RolePermission['workspace'][FlattenWorkspacePermission];

export function throwPermissionChecker(
  role: UserRole | undefined,
  permission: FlattenRolePermission[]
) {
  if (role === undefined || !checkPermission(role, permission)) {
    throw new Error("You don't have permission for this action");
  }
}

export function checkPermission(role: UserRole, permission: FlattenRolePermission[]): boolean {
  let _permission = getRolePermission(role);
  for (const key of permission) {
    _permission = _permission[key];
  }
  return _permission as any;
}

export const getRolePermission = (roleIndx: number): RolePermission => {
  const listOfRoles = [
    WorkspaceOwnerPermission,
    WorkspaceModeratorPermission,
    WorkspaceMemberPermission,
    RepositoryContributorPermission,
  ];
  return listOfRoles.at(roleIndx);
};
