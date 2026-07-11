// Druckverlust Pro – LicenseGate
// Zentrale, aktuell nicht blockierende Zugriffsschicht für spätere Free-/Professional-Grenzen.

import {
  createLicenseStatus,
  getLicenseFeatureAccess,
  isLicenseFeatureEnabled,
} from './licenseConfig.js';

export default class LicenseGate {
  static getStatus() {
    return createLicenseStatus();
  }

  static isEnabled(featureId) {
    return isLicenseFeatureEnabled(featureId);
  }

  static check(featureId) {
    return getLicenseFeatureAccess(featureId);
  }

  static require(featureId) {
    const access = this.check(featureId);

    // Aktuell bewusst keine Sperre: Phase 20 bereitet nur die spätere Lizenzlogik vor.
    return {
      ...access,
      blocked: false,
      reason: access.enabled ? '' : 'Vorbereitet, aktuell nicht aktiv.',
    };
  }

  static createExportNotice() {
    const status = this.getStatus();
    return {
      label: status.modeLabel,
      exportLabel: status.exportLabel,
      watermarkText: status.watermarkText,
      restricted: Boolean(status.exportRestricted),
      text: `${status.modeLabel} · ${status.exportLabel}`,
    };
  }
}
