/** Normalize city/location text for comparison (lowercase, no accents, trimmed). */
export function normalizeLocation(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Normalize postal/zip codes for comparison (trim, uppercase, no spaces). */
export function normalizePostalCode(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function matchesUserLocation(
  userCity: string | null | undefined,
  userPostal: string | null | undefined,
  businessCity: string,
  businessPostal: string | null | undefined,
): boolean {
  const normalizedBizCity = normalizeLocation(businessCity);
  const normalizedUserCity = normalizeLocation(userCity);
  if (normalizedUserCity && normalizedBizCity && normalizedUserCity === normalizedBizCity) {
    return true;
  }

  const normalizedBizPostal = normalizePostalCode(businessPostal);
  const normalizedUserPostal = normalizePostalCode(userPostal);
  if (normalizedUserPostal && normalizedBizPostal && normalizedUserPostal === normalizedBizPostal) {
    return true;
  }

  return false;
}
