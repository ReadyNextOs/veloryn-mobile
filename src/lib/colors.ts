export const colors = {
  primary: '#7a24a1',
  primaryLight: '#a54cc7',
  primaryDark: '#631d84',
  primaryDarker: '#4a1561',
  primarySurface: '#f3e5f7',
  background: '#fafafa',
  surface: '#ffffff',
  textPrimary: '#212121',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
  border: '#e0e0e0',
  disabled: '#9e9e9e',
  error: '#d32f2f',
  errorDark: '#c62828',
  success: '#388e3c',
  successLight: '#43a047',
  warning: '#f57c00',
  info: '#0288d1',
} as const;

export const avatarPalette = [
  colors.primary,
  colors.success,
  colors.info,
  colors.warning,
  colors.errorDark,
  '#7b1fa2',
] as const;

export function getDeterministicColor(seed: string, palette: readonly string[] = avatarPalette): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length] ?? colors.primary;
}
