import { Folder } from '@prisma/client';

export interface ICreateFolderDTO {
  name: string;
  parentId?: string | null;
}

export interface IRenameFolderDTO {
  name: string;
}

export interface IFolderResponse extends Folder {
  _count?: {
    children: number;
    files: number;
  };
  children?: IFolderResponse[];
}
