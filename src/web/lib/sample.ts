/** Sample inputs bundled with the app (public/samples). They are made-up, small, and clearly labelled. */
export const SAMPLES = {
  notice: { path: '/samples/deactivation-notice.pdf', filename: 'deactivation-notice.pdf' },
  payout: { path: '/samples/payout-screenshot.jpg', filename: 'payout-screenshot.jpg' },
} as const;

/** Loads a bundled sample as a File so it goes through exactly the same path as a real upload. */
export async function fetchSample(sample: (typeof SAMPLES)[keyof typeof SAMPLES]): Promise<File> {
  const res = await fetch(sample.path);
  const blob = await res.blob();
  // A missing file would fall through to the app's HTML page; never pass that on as a document.
  if (!res.ok || blob.type.startsWith('text/')) throw new Error('Sample not available');
  return new File([blob], sample.filename, { type: blob.type });
}
