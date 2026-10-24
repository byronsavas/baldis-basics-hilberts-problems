/** Resolve a public asset path against the Vite deploy base. */
export function assetUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}
