// Druckverlust Pro – UI Dialog Service
// Einheitliche, zugängliche Bestätigungs- und Hinweisdialoge für die Anwendung.

export default class UiDialogService {
  static activeDialog = null;

  static alert(options = {}) {
    const config = typeof options === 'string'
      ? { message: options }
      : { ...options };

    return this.open({
      title: 'Hinweis',
      confirmLabel: 'OK',
      tone: 'info',
      ...config,
      mode: 'alert',
    });
  }

  static confirm(options = {}) {
    const config = typeof options === 'string'
      ? { message: options }
      : { ...options };

    return this.open({
      title: 'Bitte bestätigen',
      confirmLabel: 'Bestätigen',
      cancelLabel: 'Abbrechen',
      tone: 'warning',
      ...config,
      mode: 'confirm',
    });
  }

  static open(options = {}) {
    if (typeof document === 'undefined' || !document.body) {
      return Promise.resolve(options.mode === 'confirm');
    }

    this.closeActive(false);

    const config = {
      mode: options.mode === 'confirm' ? 'confirm' : 'alert',
      title: String(options.title || 'Hinweis'),
      message: String(options.message || ''),
      details: Array.isArray(options.details) ? options.details.filter(Boolean).map(String) : [],
      confirmLabel: String(options.confirmLabel || (options.mode === 'confirm' ? 'Bestätigen' : 'OK')),
      cancelLabel: String(options.cancelLabel || 'Abbrechen'),
      tone: ['info', 'success', 'warning', 'danger'].includes(options.tone) ? options.tone : 'info',
      closeOnBackdrop: Boolean(options.closeOnBackdrop),
    };

    const previousFocus = document.activeElement;
    const layer = document.createElement('div');
    layer.className = 'dp-dialog-layer';
    layer.dataset.dialogTone = config.tone;
    layer.innerHTML = `
      <div class="dp-dialog-backdrop" data-dialog-action="backdrop"></div>
      <section
        class="dp-dialog"
        role="${config.mode === 'alert' ? 'alertdialog' : 'dialog'}"
        aria-modal="true"
        aria-labelledby="dp-dialog-title"
        aria-describedby="dp-dialog-message"
      >
        <div class="dp-dialog-accent" aria-hidden="true"></div>
        <div class="dp-dialog-head">
          <span class="dp-dialog-icon" aria-hidden="true">${this.icon(config.tone)}</span>
          <div>
            <span class="dp-dialog-overline">Druckverlust Pro</span>
            <h2 id="dp-dialog-title">${this.escape(config.title)}</h2>
          </div>
        </div>
        <div class="dp-dialog-content">
          <div id="dp-dialog-message" class="dp-dialog-message">${this.formatMessage(config.message)}</div>
          ${config.details.length ? `
            <ul class="dp-dialog-details">
              ${config.details.map(item => `<li>${this.escape(item)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        <div class="dp-dialog-actions">
          ${config.mode === 'confirm' ? `
            <button type="button" class="dp-dialog-button dp-dialog-button-secondary" data-dialog-action="cancel">
              ${this.escape(config.cancelLabel)}
            </button>
          ` : ''}
          <button type="button" class="dp-dialog-button dp-dialog-button-primary" data-dialog-action="confirm">
            ${this.escape(config.confirmLabel)}
          </button>
        </div>
      </section>
    `;

    document.body.appendChild(layer);
    document.body.classList.add('dp-dialog-open');

    return new Promise(resolve => {
      let settled = false;

      const finish = value => {
        if (settled) return;
        settled = true;

        layer.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKeydown, true);
        layer.classList.add('is-closing');

        window.setTimeout(() => {
          layer.remove();
          if (!UiDialogService.activeDialog) document.body.classList.remove('dp-dialog-open');
          if (previousFocus?.focus && document.contains(previousFocus)) previousFocus.focus();
        }, 120);

        if (this.activeDialog?.layer === layer) this.activeDialog = null;
        resolve(Boolean(value));
      };

      const onClick = event => {
        const action = event.target.closest?.('[data-dialog-action]')?.dataset.dialogAction;
        if (!action) return;

        if (action === 'confirm') finish(true);
        if (action === 'cancel') finish(false);
        if (action === 'backdrop' && (config.closeOnBackdrop || config.mode === 'alert')) finish(false);
      };

      const onKeydown = event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
          return;
        }

        if (event.key !== 'Tab') return;

        const focusable = [...layer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter(element => element.offsetParent !== null);

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      layer.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown, true);

      this.activeDialog = { layer, finish };

      window.requestAnimationFrame(() => {
        layer.classList.add('is-open');
        const target = layer.querySelector('[data-dialog-action="confirm"]');
        target?.focus();
      });
    });
  }

  static closeActive(value = false) {
    if (this.activeDialog?.finish) this.activeDialog.finish(value);
  }

  static formatMessage(value = '') {
    const escaped = this.escape(value);
    return escaped
      .split(/\n{2,}/)
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  static escape(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static icon(tone = 'info') {
    const icons = {
      info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v7M12 7h.01"></path></svg>',
      success: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16.5 8.5"></path></svg>',
      warning: '<svg viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4z"></path><path d="M12 9v5M12 17h.01"></path></svg>',
      danger: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6M15 9l-6 6"></path></svg>',
    };

    return icons[tone] || icons.info;
  }
}
