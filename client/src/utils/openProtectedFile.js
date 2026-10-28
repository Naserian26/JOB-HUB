// CV/cover-letter URLs point at authenticated API routes (/api/files/...),
// so a plain <a href> can't carry the Authorization header. Fetch the file
// with the token instead and open the resulting blob.
import toast from 'react-hot-toast';

export async function openProtectedFile(url, token) {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to load file');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch {
    toast.error('Unable to open file. It may have been removed, or you may not have access to it.');
  }
}
