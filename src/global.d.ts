// Extend the Window interface to include forceLogout for debugging
export {};

declare global {
  interface Window {
    forceLogout: () => Promise<void>;
  }
}
