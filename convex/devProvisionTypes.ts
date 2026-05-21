import type { Id } from './_generated/dataModel';

export type ApproveApplicationResult = {
  applicationId: Id<'applications'>;
  creatorId: Id<'creators'>;
  userId: Id<'users'> | null;
  status: 'approved';
};

export type AlreadyApprovedResult = {
  applicationId: Id<'applications'>;
  creatorId: Id<'creators'>;
  status: 'already_approved';
};

export type ApproveCreatorResult = ApproveApplicationResult | AlreadyApprovedResult;

export type SetupAdminResult = {
  email: string;
  passwordSet: boolean;
  userId: Id<'users'>;
};

export type BootstrapAdminResult = {
  email: string;
  userId: Id<'users'>;
  passwordSet: boolean;
};

export type SetupCreatorResult = {
  email: string;
  passwordSet: true;
} & ApproveCreatorResult;
