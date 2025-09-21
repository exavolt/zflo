import { supabase } from '@zflo/platform-core';

export interface ImageToDotResponse {
  success: boolean;
  data?: string;
  result?: string;
  error?: string;
}

export class ImageToDotService {
  private static readonly API_BASE_URL =
    import.meta.env.VITE_SUPABASE_URL ||
    'https://tdmasglvtyjmswgallhr.supabase.co';
  private static readonly API_URL = `${this.API_BASE_URL}/functions/v1/flowchart-to-dot`;

  static async convertImageToDot(file: File): Promise<ImageToDotResponse> {
    try {
      // Get the current session to include auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (result.result === 'NO_FLOWCHART_DETECTED') {
        return {
          success: false,
          error:
            'No flowchart detected in the image. Please upload an image containing a flowchart.',
        };
      }

      if (result.data) {
        return {
          success: true,
          data: result.data,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Image to DOT conversion failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async convertBase64ImageToDot(
    base64Image: string,
    mimeType: string
  ): Promise<ImageToDotResponse> {
    try {
      // Get the current session to include auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image,
          mimeType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      if (result.result === 'NO_FLOWCHART_DETECTED') {
        return {
          success: false,
          error:
            'No flowchart detected in the image. Please upload an image containing a flowchart.',
        };
      }

      if (result.data) {
        return {
          success: true,
          data: result.data,
        };
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Image to DOT conversion failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
