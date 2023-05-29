export type RolePermission = {
  workspace: {
    read: boolean;
    update: boolean;
    delete: boolean;
    updatePermission: boolean;
    moderator: {
      create: boolean;
      delete: boolean;
    };
    member: {
      create: boolean;
      delete: boolean;
    };
    transferOwnership: boolean;
  };
  repository: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    tabs: {
      create: boolean;
      delete: boolean;
      update: boolean;
    };
    access: {
      update: boolean;
      delete: boolean;
      create: boolean;
    };
    contributor: {
      create: boolean;
      delete: boolean;
    };
  };
};
