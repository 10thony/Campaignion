// Client-side upload handler for PDF files using UploadThing
// This works with Vite and can be called from the PDF import component

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
  message?: string;
}


/**
 * Upload a PDF file to UploadThing
 * @param file - The PDF file to upload
 * @param token - UploadThing API token
 * @returns Promise<UploadResult>
 */
export async function uploadPdfToUploadThing(
  file: File,
  token?: string
): Promise<UploadResult> {
  try {
    // If no token is provided, return a mock success for local development
    if (!token) {
      console.warn("No UploadThing token provided - using mock upload for local development");
      return {
        success: true,
        url: "mock-url-for-local-dev",
        filename: file.name,
        size: file.size,
        message: "Mock upload successful (no token configured)",
      };
    }

    // Create form data for the upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);

    // Upload to UploadThing API
    const response = await fetch("https://uploadthing.com/api/uploadFiles", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      url: result.url || result.data?.url,
      filename: file.name,
      size: file.size,
      message: "Upload successful",
    };

  } catch (error: any) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "Upload failed",
      filename: file.name,
      size: file.size,
    };
  }
}

/**
 * Alternative upload method that uses a server proxy
 * This is useful when you want to handle the upload server-side
 */
export async function uploadPdfViaProxy(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Try to upload to our proxy endpoint first
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Proxy upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      url: result.url || result.uploadThingResponse?.url,
      filename: file.name,
      size: file.size,
      message: result.message || "Upload successful via proxy",
    };

  } catch (error: any) {
    console.error("Proxy upload error:", error);
    
    // Fallback to direct UploadThing upload if proxy fails
    console.log("Falling back to direct UploadThing upload...");
    return uploadPdfToUploadThing(file);
  }
}

/**
 * Get UploadThing token from environment or localStorage
 * For development, you can store the token in localStorage
 */
export function getUploadThingToken(): string | undefined {
  // In production, this would come from environment variables
  // For development, we can use localStorage
  if (typeof window !== "undefined") {
    return localStorage.getItem("UPLOADTHING_TOKEN") || undefined;
  }
  
  // Server-side fallback
  return process.env.UPLOADTHING_TOKEN;
}

/**
 * Set UploadThing token in localStorage (for development)
 */
export function setUploadThingToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("UPLOADTHING_TOKEN", token);
  }
}
