export interface ISignedUrlDTO {
    fileName: string;
    fileType: string;
    fileSize: number;
    folderId?: string | null;
}

export interface ISignedUrlResponse {
    uploadUrl: string;
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    publicId: string;
    allowedTypes: string[];
}

export interface IFileResponse {
    id: string;
    name: string;
    size: string;
    mimeType: string;
    url: string;
    createdAt: Date;
}
