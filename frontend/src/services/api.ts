import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

function downloadBlob(response: { data: Blob }): Blob {
  return new Blob([response.data]);
}

export async function mergePDFs(files: File[]): Promise<Blob> {
  const form = new FormData();
  files.forEach(f => form.append('files', f));
  const res = await api.post('/api/merge', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function splitPDF(file: File, ranges: string): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('ranges', ranges);
  const res = await api.post('/api/split', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function compressPDF(
  file: File,
  level: string
): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> {
  const form = new FormData();
  form.append('file', file);
  form.append('level', level);
  const res = await api.post('/api/compress', form, { responseType: 'blob' });
  const originalSize = parseInt(res.headers['x-original-size'] || '0', 10);
  const compressedSize = parseInt(res.headers['x-compressed-size'] || '0', 10);
  return { blob: downloadBlob(res), originalSize, compressedSize };
}

export async function rotatePDF(file: File, pages: number[], degrees: number): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('pages', JSON.stringify(pages));
  form.append('degrees', String(degrees));
  const res = await api.post('/api/rotate', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function extractPages(file: File, pages: string): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('pages', pages);
  const res = await api.post('/api/extract', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function convertFile(file: File, targetFormat: string): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('format', targetFormat);
  const res = await api.post('/api/convert', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function protectPDF(file: File, password: string): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('password', password);
  const res = await api.post('/api/protect', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function unlockPDF(file: File, password: string): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('password', password);
  const res = await api.post('/api/unlock', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export async function watermarkPDF(
  file: File,
  text: string,
  options: object
): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('text', text);
  form.append('options', JSON.stringify(options));
  const res = await api.post('/api/watermark', form, { responseType: 'blob' });
  return downloadBlob(res);
}

export function downloadResult(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
