import * as pdfjs from 'pdfjs-dist'
// Vite-friendly: import worker as URL so bundler serves hashed asset
// This prevents trying to import from /public and avoids transform errors
// Note: '?url' yields a string URL at runtime
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite import query
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// PDF.js worker configuration with multiple fallback strategies
export function configurePDFWorker(): void {
  if (typeof window === 'undefined') {
    // In test environment, disable worker to run in main thread
    pdfjs.GlobalWorkerOptions.workerSrc = ''
    return
  }

  // Strategy 1: Use bundled worker URL via Vite
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = (workerUrl as unknown as string)
  } catch (error) {
    console.warn('Failed to configure PDF.js worker with unpkg, trying fallback...', error)
    
    // Strategy 2: Use jsDelivr as fallback
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${(pdfjs as any).version}/build/pdf.worker.min.mjs`
    } catch (fallbackError) {
      console.warn('Failed to configure PDF.js worker with jsDelivr, using main thread...', fallbackError)
      
      // Strategy 3: Disable worker entirely - run in main thread
      pdfjs.GlobalWorkerOptions.workerSrc = ''
    }
  }
}

// Alternative function to get PDF document with worker error handling
export async function getPDFDocument(data: ArrayBuffer): Promise<any> {
  // First attempt: Try with current worker configuration
  try {
    const loadingTask = pdfjs.getDocument({
      data,
      verbosity: 0,
    })
    
    return await loadingTask.promise
  } catch (error) {
    console.warn('PDF parsing failed, attempting fallback...', error)
    
    // Always try the fallback (no worker) approach
    const originalWorkerSrc = pdfjs.GlobalWorkerOptions.workerSrc || ''
    
    try {
      // Disable worker by setting workerSrc to empty
      pdfjs.GlobalWorkerOptions.workerSrc = ''
      
      const loadingTask = pdfjs.getDocument({
        data,
        verbosity: 0,
      })
      
      const result = await loadingTask.promise
      
      // Restore original worker configuration
      pdfjs.GlobalWorkerOptions.workerSrc = originalWorkerSrc
      
      return result
    } catch (fallbackError) {
      // Restore original worker configuration
      pdfjs.GlobalWorkerOptions.workerSrc = originalWorkerSrc
      
      // Re-throw the fallback error
      throw fallbackError
    }
  }
}
