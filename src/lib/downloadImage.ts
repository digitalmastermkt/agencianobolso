/**
 * Downloads an image from a URL or base64 data URI
 * Works with both local base64 images and remote URLs (including cross-origin)
 * Uses multiple fallback strategies for maximum compatibility
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<boolean> {
  try {
    let blob: Blob | null = null;

    if (imageUrl.startsWith('data:')) {
      // Base64 - convert to blob
      const base64Data = imageUrl.split(',')[1];
      const mimeMatch = imageUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] || 'image/png';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: mimeType });
    } else {
      // Remote URL - try fetch with CORS headers
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blob = await response.blob();
      } catch (fetchError) {
        console.warn('Fetch with CORS failed, trying no-cors:', fetchError);
        
        // Fallback: Use XMLHttpRequest for better cross-origin handling
        try {
          blob = await new Promise<Blob>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', imageUrl, true);
            xhr.responseType = 'blob';
            xhr.onload = () => {
              if (xhr.status === 200) {
                resolve(xhr.response);
              } else {
                reject(new Error(`XHR failed: ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error('XHR network error'));
            xhr.send();
          });
        } catch (xhrError) {
          console.warn('XHR also failed:', xhrError);
          blob = null;
        }
      }
    }

    if (blob) {
      // Create download link with blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    }

    // Final fallback: Use anchor with download attribute directly
    // This may open in new tab on some browsers but is better than nothing
    console.warn('Blob creation failed, using direct download link');
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    return true;
  } catch (error) {
    console.error('Erro ao baixar imagem:', error);
    return false;
  }
}
