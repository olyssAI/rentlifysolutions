/**
 * The single definition of what a menu image may be.
 *
 * These values are shared by the signed request, browser validation, integration checks,
 * and authenticated post-upload verification. The current Cloudinary signed-preset Admin
 * API persists the format allowlist but not max_file_size, so byte size remains authoritative
 * at persistence time and abandoned-upload controls are handled separately.
 */
export const menuImageAllowedFormats = ['jpg', 'jpeg', 'png', 'webp'] as const

export const menuImageAllowedFormatSet: ReadonlySet<string> = new Set<string>(menuImageAllowedFormats)

export const menuImageAllowedFormatsParameter = menuImageAllowedFormats.join(',')

export const menuImageMaximumBytes = 5_000_000

export const menuImageMinimumWidth = 320
export const menuImageMinimumHeight = 240
export const menuImageMaximumWidth = 8000
export const menuImageMaximumHeight = 8000
