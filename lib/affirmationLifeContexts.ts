/**
 * Life-context slugs for affirmation images (7 folders in Supabase Storage).
 * Must match backend classification and Storage path convention.
 */
export const LIFE_CONTEXT_SLUGS = [
  'career',
  'growth',
  'health',
  'finance',
  'relationship',
  'spirituality',
  'general',
] as const;

export type LifeContextSlug = (typeof LIFE_CONTEXT_SLUGS)[number];

export const DEFAULT_LIFE_CONTEXT: LifeContextSlug = 'general';

/** Default number of images per context folder (backend should use actual count). */
export const DEFAULT_IMAGE_COUNT_PER_CONTEXT = 100;

export function isValidLifeContext(value: string | null | undefined): value is LifeContextSlug {
  return value != null && LIFE_CONTEXT_SLUGS.includes(value as LifeContextSlug);
}

export function normalizeLifeContext(value: string | null | undefined): LifeContextSlug {
  return isValidLifeContext(value) ? value : DEFAULT_LIFE_CONTEXT;
}
