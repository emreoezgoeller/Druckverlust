// Druckverlust Pro – zentrale Deployment-Konfiguration
// Phase 58.20: einheitlicher GitHub-Pages-Pfad und robuste Standorterkennung.

export const DEPLOYMENT_CONFIG = Object.freeze({
  productionOrigin: 'https://emreoezgoeller.github.io',
  repositoryName: 'Druckverlust',
  repositoryPath: '/Druckverlust/',
  canonicalBaseUrl: 'https://emreoezgoeller.github.io/Druckverlust/',
  productEntry: 'index.html',
  applicationEntry: 'app.html',
  manualEntry: 'bedienungsanleitung.html',
  deploymentEntry: 'deployment.html',
});

function ensureTrailingSlash(value = '/') {
  const normalized = String(value || '/');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function getDeploymentLocationInfo(locationRef = null) {
  const location = locationRef || (typeof window !== 'undefined' ? window.location : null);
  if (!location) {
    return {
      href: 'Node/Testumgebung',
      origin: '',
      pathname: '',
      host: '',
      protocol: '',
      isGithubPages: false,
      isLocalhost: false,
      isLocalFile: false,
      isHttps: false,
      expectedBasePath: DEPLOYMENT_CONFIG.repositoryPath,
      currentBasePath: '/',
      canonicalBaseUrl: DEPLOYMENT_CONFIG.canonicalBaseUrl,
    };
  }

  const href = location.href || '';
  const origin = location.origin || '';
  const pathname = location.pathname || '/';
  const host = location.host || location.hostname || '';
  const hostname = location.hostname || String(host).split(':')[0] || '';
  const protocol = location.protocol || '';
  const isGithubPages = /github\.io$/i.test(hostname);
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname);
  const isLocalFile = protocol === 'file:';
  const isHttps = protocol === 'https:';

  let currentBasePath = '/';
  if (isGithubPages) {
    const firstSegment = pathname.split('/').filter(Boolean)[0] || '';
    currentBasePath = firstSegment ? `/${firstSegment}/` : '/';
  } else {
    const fileName = pathname.split('/').pop() || '';
    currentBasePath = ensureTrailingSlash(fileName.includes('.') ? pathname.slice(0, -fileName.length) : pathname);
  }

  return {
    href,
    origin,
    pathname,
    host,
    protocol,
    isGithubPages,
    isLocalhost,
    isLocalFile,
    isHttps,
    expectedBasePath: DEPLOYMENT_CONFIG.repositoryPath,
    currentBasePath,
    canonicalBaseUrl: DEPLOYMENT_CONFIG.canonicalBaseUrl,
  };
}

export function resolveRuntimeBaseUrl(locationRef = null) {
  const info = getDeploymentLocationInfo(locationRef);
  if (info.isGithubPages) return new URL(DEPLOYMENT_CONFIG.repositoryPath, `${info.origin}/`).toString();
  if (info.isLocalFile) return DEPLOYMENT_CONFIG.canonicalBaseUrl;
  try {
    return new URL('./', info.href).toString();
  } catch {
    return DEPLOYMENT_CONFIG.canonicalBaseUrl;
  }
}
