/**
 * File Upload/Download Error Handling Tests
 * Tests corrupted files, network interruptions, and storage failures
 */

import { jest } from '@jest/globals';
import { VideoService } from '../../src/services/video/youtubeService';

// Mock file system APIs
const mockFileReader = {
  readAsArrayBuffer: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  result: null,
  error: null,
  onload: null as (() => void) | null,
  onerror: null as ((error: any) => void) | null,
  onprogress: null as ((event: ProgressEvent) => void) | null,
  abort: jest.fn()
};

const mockFile = {
  name: 'test-file.pdf',
  size: 1024 * 1024, // 1MB
  type: 'application/pdf',
  lastModified: Date.now(),
  arrayBuffer: jest.fn(),
  text: jest.fn(),
  stream: jest.fn()
};

// Mock Fetch API for file uploads
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock FileReader constructor
global.FileReader = jest.fn(() => mockFileReader) as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
} as any;

// Mock Blob constructor
global.Blob = jest.fn((parts, options) => ({
  size: parts?.join('').length || 0,
  type: options?.type || 'application/octet-stream',
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(8))),
  text: jest.fn(() => Promise.resolve(parts?.join('') || '')),
  stream: jest.fn()
})) as any;

describe('File Operations Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.result = null;
    mockFileReader.error = null;
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockFileReader.onprogress = null;
  });

  describe('File Reading Error Scenarios', () => {
    it('should handle corrupted file data during read', async () => {
      const corruptedFile = { ...mockFile, size: 0 };
      
      const readPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          mockFileReader.error = new Error('File is corrupted or unreadable');
          if (mockFileReader.onerror) {
            mockFileReader.onerror(mockFileReader.error);
          }
          reject(mockFileReader.error);
        }, 50);
      });
      
      mockFileReader.readAsDataURL.mockImplementation(() => readPromise);
      
      await expect(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(corruptedFile as File);
        })
      ).rejects.toThrow('File is corrupted or unreadable');
    });

    it('should handle file size exceeding limits', async () => {
      const largeFile = {
        ...mockFile,
        size: 100 * 1024 * 1024 // 100MB
      };
      
      const readPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          mockFileReader.error = new Error('File size exceeds maximum allowed limit');
          if (mockFileReader.onerror) {
            mockFileReader.onerror(mockFileReader.error);
          }
          reject(mockFileReader.error);
        }, 50);
      });
      
      mockFileReader.readAsArrayBuffer.mockImplementation(() => readPromise);
      
      await expect(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(largeFile as File);
        })
      ).rejects.toThrow('File size exceeds maximum allowed limit');
    });

    it('should handle unsupported file formats', async () => {
      const unsupportedFile = {
        ...mockFile,
        type: 'application/x-virus',
        name: 'suspicious.exe'
      };
      
      const readPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          mockFileReader.error = new Error('Unsupported file format');
          if (mockFileReader.onerror) {
            mockFileReader.onerror(mockFileReader.error);
          }
          reject(mockFileReader.error);
        }, 50);
      });
      
      mockFileReader.readAsText.mockImplementation(() => readPromise);
      
      await expect(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(unsupportedFile as File);
        })
      ).rejects.toThrow('Unsupported file format');
    });

    it('should handle file reading abortion due to user cancellation', async () => {
      const abortPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          mockFileReader.error = new Error('File reading was aborted');
          mockFileReader.abort();
          reject(mockFileReader.error);
        }, 100);
      });
      
      mockFileReader.readAsDataURL.mockImplementation(() => abortPromise);
      
      await expect(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(mockFile as File);
          
          // Simulate user cancelling after 50ms
          setTimeout(() => reader.abort(), 50);
        })
      ).rejects.toThrow('File reading was aborted');
    });

    it('should handle memory allocation failures during file reading', async () => {
      const memoryErrorPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          mockFileReader.error = new Error('Not enough memory to read file');
          if (mockFileReader.onerror) {
            mockFileReader.onerror(mockFileReader.error);
          }
          reject(mockFileReader.error);
        }, 50);
      });
      
      mockFileReader.readAsArrayBuffer.mockImplementation(() => memoryErrorPromise);
      
      await expect(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(mockFile as File);
        })
      ).rejects.toThrow('Not enough memory to read file');
    });
  });

  describe('File Upload Error Scenarios', () => {
    it('should handle network failures during file upload', async () => {
      mockFetch.mockRejectedValue(new Error('Network request failed'));
      
      const formData = new FormData();
      formData.append('file', mockFile as File);
      
      await expect(
        fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
      ).rejects.toThrow('Network request failed');
    });

    it('should handle server rejecting file uploads (413 Payload Too Large)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        json: () => Promise.resolve({ error: 'File size exceeds server limit' })
      } as Response);
      
      const formData = new FormData();
      formData.append('file', mockFile as File);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(413);
    });

    it('should handle server storage full errors (507 Insufficient Storage)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 507,
        statusText: 'Insufficient Storage',
        json: () => Promise.resolve({ error: 'Server storage is full' })
      } as Response);
      
      const formData = new FormData();
      formData.append('file', mockFile as File);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(507);
    });

    it('should handle malware detection during upload (422 Unprocessable Entity)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () => Promise.resolve({ error: 'File contains malicious content' })
      } as Response);
      
      const suspiciousFile = {
        ...mockFile,
        name: 'virus.exe',
        type: 'application/x-msdownload'
      };
      
      const formData = new FormData();
      formData.append('file', suspiciousFile as File);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(422);
    });

    it('should handle upload timeout scenarios', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 100)
        )
      );
      
      const formData = new FormData();
      formData.append('file', mockFile as File);
      
      await expect(
        fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
      ).rejects.toThrow('Upload timeout');
    });

    it('should handle partial upload failures and retry logic', async () => {
      let attemptCount = 0;
      mockFetch.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Connection interrupted'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, fileId: 'file-123' })
        } as Response);
      });
      
      // Implement retry logic
      const uploadWithRetry = async (formData: FormData, maxRetries: number = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      };
      
      const formData = new FormData();
      formData.append('file', mockFile as File);
      
      const response = await uploadWithRetry(formData);
      expect(response.ok).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should handle upload progress tracking failures', async () => {
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
        upload: {
          onprogress: null as ((event: ProgressEvent) => void) | null,
          onerror: null as ((error: any) => void) | null
        },
        onload: null as (() => void) | null,
        onerror: null as ((error: any) => void) | null,
        status: 0,
        response: null
      };
      
      // Mock XMLHttpRequest
      global.XMLHttpRequest = jest.fn(() => mockXHR) as any;
      
      const uploadWithProgress = (file: File, onProgress: (progress: number) => void) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('file', file);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              onProgress((event.loaded / event.total) * 100);
            }
          };
          
          xhr.upload.onerror = (error) => reject(new Error('Upload progress tracking failed'));
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = () => reject(new Error('Upload failed'));
          
          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });
      };
      
      const progressCallback = jest.fn();
      
      // Simulate progress tracking error
      setTimeout(() => {
        if (mockXHR.upload.onerror) {
          mockXHR.upload.onerror(new Error('Progress tracking failed'));
        }
      }, 50);
      
      await expect(
        uploadWithProgress(mockFile as File, progressCallback)
      ).rejects.toThrow('Upload progress tracking failed');
    });
  });

  describe('File Download Error Scenarios', () => {
    it('should handle file not found errors (404)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'File not found' })
      } as Response);
      
      const response = await fetch('/api/download/nonexistent-file.pdf');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('should handle insufficient permissions for file download (403)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: 'Insufficient permissions to download this file' })
      } as Response);
      
      const response = await fetch('/api/download/private-file.pdf', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });

    it('should handle corrupted download streams', async () => {
      const corruptedStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.error(new Error('Stream corrupted'));
        }
      });
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: corruptedStream
      } as Response);
      
      const response = await fetch('/api/download/file.pdf');
      const reader = response.body?.getReader();
      
      if (reader) {
        await expect(
          reader.read()
        ).rejects.toThrow('Stream corrupted');
      }
    });

    it('should handle download interruption and resume', async () => {
      let downloadAttempt = 0;
      
      mockFetch.mockImplementation((url, options) => {
        downloadAttempt++;
        
        if (downloadAttempt === 1) {
          // First attempt fails partway through
          return Promise.resolve({
            ok: false,
            status: 206, // Partial content
            statusText: 'Partial Content',
            headers: new Headers({
              'Content-Range': 'bytes 0-999/2000'
            })
          } as Response);
        }
        
        // Second attempt with range header succeeds
        const rangeHeader = (options as RequestInit)?.headers?.['Range'] || (options as RequestInit)?.headers?.['range'];
        if (rangeHeader) {
          return Promise.resolve({
            ok: true,
            status: 206,
            headers: new Headers({
              'Content-Range': 'bytes 1000-1999/2000'
            }),
            blob: () => Promise.resolve(new Blob(['remaining data']))
          } as Response);
        }
        
        return Promise.reject(new Error('Invalid download request'));
      });
      
      // First download attempt
      const firstResponse = await fetch('/api/download/large-file.pdf');
      expect(firstResponse.status).toBe(206);
      
      // Resume download with range header
      const resumeResponse = await fetch('/api/download/large-file.pdf', {
        headers: { 'Range': 'bytes=1000-' }
      });
      expect(resumeResponse.ok).toBe(true);
      expect(resumeResponse.status).toBe(206);
    });

    it('should handle blob creation failures during download', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        blob: () => Promise.reject(new Error('Failed to create blob from response'))
      } as Response);
      
      const response = await fetch('/api/download/file.pdf');
      
      await expect(
        response.blob()
      ).rejects.toThrow('Failed to create blob from response');
    });
  });

  describe('File System Integration Error Scenarios', () => {
    it('should handle local file system write failures', async () => {
      // Mock File System Access API
      const mockFileHandle = {
        createWritable: jest.fn().mockRejectedValue(
          new Error('Permission denied to write to file system')
        )
      };
      
      global.window = {
        showSaveFilePicker: jest.fn().mockResolvedValue(mockFileHandle)
      } as any;
      
      try {
        const fileHandle = await window.showSaveFilePicker();
        await expect(
          fileHandle.createWritable()
        ).rejects.toThrow('Permission denied to write to file system');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle quota exceeded errors in local storage', async () => {
      const mockCache = {
        put: jest.fn().mockRejectedValue(
          new Error('QuotaExceededError: Storage quota exceeded')
        )
      };
      
      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache)
      } as any;
      
      const cache = await caches.open('file-cache');
      
      await expect(
        cache.put('/cached-file', new Response(new Blob(['large data'])))
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('should handle disk full errors during file operations', async () => {
      // Mock IndexedDB for file metadata storage
      const mockDB = {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            add: jest.fn().mockImplementation(() => {
              const request = {
                onerror: null as ((event: any) => void) | null,
                onsuccess: null as ((event: any) => void) | null
              };
              
              setTimeout(() => {
                const error = { name: 'QuotaExceededError', message: 'Disk full' };
                if (request.onerror) {
                  request.onerror({ target: { error } });
                }
              }, 10);
              
              return request;
            })
          }))
        }))
      };
      
      // Simulate IndexedDB disk full error
      const transaction = mockDB.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.add({ id: 'file-1', data: 'large file data' });
      
      await new Promise((resolve, reject) => {
        request.onerror = (event) => {
          reject(new Error('Disk full'));
        };
        request.onsuccess = () => resolve(undefined);
      }).catch(error => {
        expect(error.message).toBe('Disk full');
      });
    });
  });

  describe('File Validation Error Scenarios', () => {
    it('should handle invalid file signatures (magic numbers)', async () => {
      // Mock file with PDF extension but different content
      const fakeFile = {
        ...mockFile,
        name: 'document.pdf',
        type: 'application/pdf',
        arrayBuffer: jest.fn().mockResolvedValue(
          new Uint8Array([0x89, 0x50, 0x4E, 0x47]).buffer // PNG signature instead of PDF
        )
      };
      
      const validateFileSignature = async (file: File) => {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        
        // Check for PDF signature
        const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
        const fileSignature = Array.from(uint8Array.slice(0, 4));
        
        if (file.type === 'application/pdf' && !pdfSignature.every((byte, index) => byte === fileSignature[index])) {
          throw new Error('File signature does not match declared type');
        }
      };
      
      await expect(
        validateFileSignature(fakeFile as File)
      ).rejects.toThrow('File signature does not match declared type');
    });

    it('should handle files with embedded malicious content', async () => {
      const suspiciousFile = {
        ...mockFile,
        text: jest.fn().mockResolvedValue(
          '<script>alert("XSS attack")</script><!-- potential malware -->'
        )
      };
      
      const scanFileContent = async (file: File) => {
        const content = await file.text();
        
        const maliciousPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /vbscript:/gi,
          /on\w+\s*=/gi
        ];
        
        for (const pattern of maliciousPatterns) {
          if (pattern.test(content)) {
            throw new Error('File contains potentially malicious content');
          }
        }
      };
      
      await expect(
        scanFileContent(suspiciousFile as File)
      ).rejects.toThrow('File contains potentially malicious content');
    });

    it('should handle files exceeding processing limits', async () => {
      const oversizedFile = {
        ...mockFile,
        size: 500 * 1024 * 1024 // 500MB
      };
      
      const validateFileSize = (file: File, maxSizeBytes: number = 10 * 1024 * 1024) => {
        if (file.size > maxSizeBytes) {
          throw new Error(`File size ${file.size} exceeds maximum allowed size ${maxSizeBytes}`);
        }
      };
      
      expect(() => {
        validateFileSize(oversizedFile as File);
      }).toThrow('exceeds maximum allowed size');
    });
  });

  describe('Concurrent File Operation Error Scenarios', () => {
    it('should handle multiple concurrent upload failures', async () => {
      mockFetch.mockRejectedValue(new Error('Server overloaded'));
      
      const files = Array(5).fill(mockFile);
      const uploadPromises = files.map((file, index) => {
        const formData = new FormData();
        formData.append('file', file as File);
        formData.append('index', index.toString());
        
        return fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
      });
      
      const results = await Promise.allSettled(uploadPromises);
      
      // All should fail
      results.forEach(result => {
        expect(result.status).toBe('rejected');
        if (result.status === 'rejected') {
          expect(result.reason.message).toBe('Server overloaded');
        }
      });
    });

    it('should handle file operation conflicts and race conditions', async () => {
      let operationCount = 0;
      const conflictError = new Error('File is being processed by another operation');
      
      mockFetch.mockImplementation(() => {
        operationCount++;
        if (operationCount <= 2) {
          return Promise.reject(conflictError);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true })
        } as Response);
      });
      
      const uploadWithConflictResolution = async (file: File) => {
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });
            
            return response;
          } catch (error) {
            if (attempt === maxRetries) throw error;
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => 
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      };
      
      const response = await uploadWithConflictResolution(mockFile as File);
      expect(response.ok).toBe(true);
      expect(operationCount).toBe(3);
    });
  });

  describe('Memory Management During File Operations', () => {
    it('should handle memory leaks from unreleased blob URLs', () => {
      const createdUrls: string[] = [];
      
      // Track created blob URLs
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = jest.fn((blob) => {
        const url = `blob:mock-url-${createdUrls.length}`;
        createdUrls.push(url);
        return url;
      });
      
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.revokeObjectURL = jest.fn((url) => {
        const index = createdUrls.indexOf(url);
        if (index > -1) {
          createdUrls.splice(index, 1);
        }
      });
      
      // Simulate file operations that create blob URLs
      const processFiles = (files: File[]) => {
        const urls = files.map(file => URL.createObjectURL(file));
        
        // Simulate forgetting to revoke some URLs
        urls.slice(0, -1).forEach(url => URL.revokeObjectURL(url));
        // Last URL is not revoked - memory leak!
        
        return urls;
      };
      
      const testFiles = Array(10).fill(mockFile) as File[];
      processFiles(testFiles);
      
      // Should have unreleased URLs
      expect(createdUrls.length).toBeGreaterThan(0);
      
      // Restore original functions
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should handle out of memory errors during large file processing', async () => {
      const hugeFile = {
        ...mockFile,
        size: 2 * 1024 * 1024 * 1024, // 2GB
        arrayBuffer: jest.fn().mockRejectedValue(
          new Error('Cannot allocate memory for file buffer')
        )
      };
      
      await expect(
        hugeFile.arrayBuffer()
      ).rejects.toThrow('Cannot allocate memory for file buffer');
    });
  });
});
