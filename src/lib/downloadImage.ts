/**
 * Downloads an image from a URL or base64 data URI
 * Works with both local base64 images and remote URLs (including cross-origin)
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<boolean> {
  try {
    let blob: Blob;

    if (imageUrl.startsWith('data:')) {
      // Base64 - convert to blob
      const base64Data = imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'image/png' });
    } else {
      // Remote URL - fetch and convert to blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      blob = await response.blob();
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Erro ao baixar imagem:', error);
    return false;
  }
}
