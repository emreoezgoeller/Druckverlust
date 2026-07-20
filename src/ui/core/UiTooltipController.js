// Druckverlust Pro – Phase 51.00
// Einheitliche, sofort sichtbare Infotexte für Symbol- und Kompaktschaltflächen.

const DEFAULT_SELECTOR = [
  '[data-ui-tooltip]',
  '.dp-ribbon button[title]',
  '.dp-sidebar button[title]',
  '.dp-workspace button[title]',
  '.dp-status button[title]',
].join(', ');

export default class UiTooltipController {
  constructor(root = document, options = {}) {
    this.root = root;
    this.selector = options.selector || DEFAULT_SELECTOR;
    this.tooltip = null;
    this.activeTarget = null;
    this.showDelay = Number.isFinite(options.showDelay) ? options.showDelay : 110;
    this.hideDelay = Number.isFinite(options.hideDelay) ? options.hideDelay : 40;
    this.showTimer = null;
    this.hideTimer = null;

    this.boundPointerOver = event => this.handlePointerOver(event);
    this.boundPointerOut = event => this.handlePointerOut(event);
    this.boundFocusIn = event => this.handleFocusIn(event);
    this.boundFocusOut = event => this.handleFocusOut(event);
    this.boundKeydown = event => this.handleKeydown(event);
    this.boundViewportChange = () => this.hide({ immediate: true });
  }

  install() {
    if (!this.root?.addEventListener || this.tooltip) return this;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'dp-ui-tooltip';
    this.tooltip.id = 'dp-ui-tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    this.tooltip.hidden = true;
    document.body.append(this.tooltip);

    this.root.addEventListener('pointerover', this.boundPointerOver, true);
    this.root.addEventListener('pointerout', this.boundPointerOut, true);
    this.root.addEventListener('focusin', this.boundFocusIn, true);
    this.root.addEventListener('focusout', this.boundFocusOut, true);
    document.addEventListener('keydown', this.boundKeydown, true);
    window.addEventListener('scroll', this.boundViewportChange, true);
    window.addEventListener('resize', this.boundViewportChange, { passive: true });

    return this;
  }

  destroy() {
    this.hide({ immediate: true });
    this.root?.removeEventListener?.('pointerover', this.boundPointerOver, true);
    this.root?.removeEventListener?.('pointerout', this.boundPointerOut, true);
    this.root?.removeEventListener?.('focusin', this.boundFocusIn, true);
    this.root?.removeEventListener?.('focusout', this.boundFocusOut, true);
    document.removeEventListener('keydown', this.boundKeydown, true);
    window.removeEventListener('scroll', this.boundViewportChange, true);
    window.removeEventListener('resize', this.boundViewportChange);
    this.tooltip?.remove();
    this.tooltip = null;
  }

  resolveTarget(node) {
    const target = node?.closest?.(this.selector);
    if (!target || target.disabled || target.getAttribute('aria-hidden') === 'true') return null;
    return target;
  }

  resolveText(target) {
    if (!target) return '';

    const liveTitle = String(target.getAttribute('title') || '').trim();
    if (liveTitle) {
      target.dataset.uiNativeTitle = liveTitle;
      target.dataset.uiTooltip = liveTitle;
      target.removeAttribute('title');
    }

    return String(
      target.dataset.uiTooltip
      || target.dataset.uiNativeTitle
      || target.getAttribute('aria-label')
      || '',
    ).trim();
  }

  handlePointerOver(event) {
    const target = this.resolveTarget(event.target);
    if (!target || target.contains(event.relatedTarget)) return;
    this.scheduleShow(target);
  }

  handlePointerOut(event) {
    const target = this.resolveTarget(event.target);
    if (!target || target.contains(event.relatedTarget)) return;
    this.scheduleHide();
  }

  handleFocusIn(event) {
    const target = this.resolveTarget(event.target);
    if (target) this.scheduleShow(target, { keyboard: true });
  }

  handleFocusOut(event) {
    if (this.activeTarget?.contains?.(event.relatedTarget)) return;
    this.scheduleHide();
  }

  handleKeydown(event) {
    if (event.key === 'Escape') this.hide({ immediate: true });
  }

  scheduleShow(target, options = {}) {
    clearTimeout(this.hideTimer);
    clearTimeout(this.showTimer);

    const text = this.resolveText(target);
    if (!text) return;

    const delay = options.keyboard ? 0 : this.showDelay;
    this.showTimer = setTimeout(() => this.show(target, text), delay);
  }

  scheduleHide() {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide({ immediate: true }), this.hideDelay);
  }

  show(target, text) {
    if (!this.tooltip || !target?.isConnected) return;

    this.activeTarget?.removeAttribute('aria-describedby');
    this.activeTarget = target;
    this.tooltip.textContent = text;
    this.tooltip.hidden = false;
    this.tooltip.classList.remove('is-visible');
    target.setAttribute('aria-describedby', this.tooltip.id);

    requestAnimationFrame(() => {
      this.position(target);
      this.tooltip?.classList.add('is-visible');
    });
  }

  position(target) {
    if (!this.tooltip) return;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const margin = 10;
    const viewportPadding = 8;

    let top = targetRect.bottom + margin;
    if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
      top = targetRect.top - tooltipRect.height - margin;
    }

    let left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));
    top = Math.max(viewportPadding, top);

    this.tooltip.style.left = `${Math.round(left)}px`;
    this.tooltip.style.top = `${Math.round(top)}px`;
  }

  hide(options = {}) {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);

    this.activeTarget?.removeAttribute('aria-describedby');
    this.activeTarget = null;

    if (!this.tooltip) return;
    this.tooltip.classList.remove('is-visible');

    if (options.immediate) {
      this.tooltip.hidden = true;
      this.tooltip.textContent = '';
      return;
    }

    setTimeout(() => {
      if (!this.activeTarget && this.tooltip) this.tooltip.hidden = true;
    }, 120);
  }
}
