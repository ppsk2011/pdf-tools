export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';
export type CompressionLevel = 'low' | 'medium' | 'high';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  result?: Blob;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}

export interface WatermarkOptions {
  position: 'center' | 'top' | 'bottom';
  opacity: number;
  color: string;
  fontSize?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
