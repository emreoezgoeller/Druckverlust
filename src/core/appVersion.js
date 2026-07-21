// Druckverlust Pro – zentrale Versionsdaten
// Eine Stelle für Cache-Busting, Statusbar, Deployment-QS und Hilfedialog.

export const APP_NAME = 'Druckverlust Pro';
export const APP_EDITION = 'Professional';
export const APP_RELEASE = '57.00';
export const APP_VERSION = '2.12.0';
export const APP_ASSET_VERSION = '57.00';
export const APP_BUILD_LABEL = `${APP_NAME} v${APP_VERSION} · Phase ${APP_RELEASE}`;

export function createAppInfo(locationRef = null) {
  const location = locationRef || (typeof window !== 'undefined' ? window.location : null);

  return {
    name: APP_NAME,
    edition: APP_EDITION,
    version: APP_VERSION,
    release: APP_RELEASE,
    assetVersion: APP_ASSET_VERSION,
    label: APP_BUILD_LABEL,
    href: location?.href || '',
    pathname: location?.pathname || '',
    generatedAt: new Date().toISOString(),
  };
}
