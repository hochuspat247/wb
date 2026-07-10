export async function downloadRemoteImageAsBase64(imageUrl: string) {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: "image/*"
      }
    });

    if (!response.ok) {
      return null;
    }

    const mimeType = (response.headers.get("content-type") || "image/png").split(";")[0].trim();
    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.byteLength || buffer.byteLength > 8 * 1024 * 1024) {
      return null;
    }

    return {
      base64: buffer.toString("base64"),
      mimeType
    };
  } catch {
    return null;
  }
}
