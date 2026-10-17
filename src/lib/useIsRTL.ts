import { useUIStore } from '@/stores/uiStore';

/**
 * Returns true if the current UI language is right-to-left (Arabic).
 */
export function useIsRTL(): boolean {
  return useUIStore((s) => s.language === 'ar');
}

/**
 * Non-hook helper for checking RTL status outside React components.
 */
export function isCurrentRTL(): boolean {
  return useUIStore.getState().language === 'ar';
}
