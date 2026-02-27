import { SubscriptionPackage, UserSubscriptionHistory } from '@prisma/client';

export interface ICreatePackageDTO {
  name: string;
  maxFolders: number;
  maxNesting: number;
  allowedTypes: string[];
  maxFileSize: number; // in MB from request
  storageLimit: number; // in MB from request
  totalFiles: number;
  filesPerFolder: number;
  price: number;
}

export type IUpdatePackageDTO = Partial<ICreatePackageDTO>;

export interface ISubscriptionHistoryResponse extends UserSubscriptionHistory {
  package: SubscriptionPackage;
}
