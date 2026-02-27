import { Response } from 'express';

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export const sendResponse = <T>(res: Response, data: IResponse<T>) => {
  const responseData: IResponse<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || '',
    data: data.data,
  };

  if (data.meta) {
    responseData.meta = data.meta;
  }

  res.status(data.statusCode).json(responseData);
};
