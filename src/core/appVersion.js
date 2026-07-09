// Druckverlust Pro – zentrale Versionsdaten
// Eine Stelle für Cache-Busting, Statusbar, Deployment-QS und Hilfedialog.

export const APP_NAME = 'Druckverlust Pro';
export const APP_EDITION = 'Professional';
<<<<<<< HEAD
export const APP_RELEASE = '18.20a';
=======
export const APP_RELEASE = '18.18';
>>>>>>> 3878efa18540cddce73e78696fad3fd1d4470a0d
export const APP_VERSION = '1.0';
export const APP_BUILD_LABEL = `${APP_NAME} v${APP_VERSION} · Phase ${APP_RELEASE}`;

export function createAppInfo(locationRef = null) {
  const location = locationRef || (typeof window !== 'undefined' ? window.location : null);

  return {
    name: APP_NAME,
    edition: APP_EDITION,
    version: APP_VERSION,
    release: APP_RELEASE,
    label: APP_BUILD_LABEL,
    href: location?.href || '',
    pathname: location?.pathname || '',
    generatedAt: new Date().toISOString(),
  };
}
