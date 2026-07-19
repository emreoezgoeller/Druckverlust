import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_SEVERITIES,
  BETA_FEEDBACK_STORAGE_KEY,
  createBetaFeedbackCsv,
  createBetaFeedbackDraft,
  createBetaFeedbackFilename,
  createBetaFeedbackJson,
  formatBetaFeedback,
  summarizeBetaFeedback,
} from '../testing/BetaFeedbackReport.js?v=21.12&release=45.00';

const form = document.querySelector('[data-beta-feedback-form]');
const statusNode = document.querySelector('[data-feedback-status]');
const statusDetailNode = document.querySelector('[data-feedback-status-detail]');
const categorySelect = document.querySelector('[name="issue.category"]');
const severitySelect = document.querySelector('[name="issue.severity"]');

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fillOptions(select, options) {
  if (!select) return;
  select.innerHTML = options.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join('');
}

function getByPath(object, path) {
  return path.split('.').reduce((current, key) => current?.[key], object);
}

function setByPath(object, path, value) {
  const keys = path.split('.');
  let current = object;
  keys.slice(0, -1).forEach(key => {
    if (!current[key] || typeof current[key] !== 'object') current[key] = {};
    current = current[key];
  });
  current[keys.at(-1)] = value;
}

function readStoredDraft() {
  try {
    const raw = localStorage.getItem(BETA_FEEDBACK_STORAGE_KEY);
    return raw ? createBetaFeedbackDraft(JSON.parse(raw)) : createBetaFeedbackDraft();
  } catch {
    return createBetaFeedbackDraft();
  }
}

function writeStoredDraft(draft) {
  const normalized = createBetaFeedbackDraft({ ...draft, updatedAt: new Date().toISOString() });
  localStorage.setItem(BETA_FEEDBACK_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function collectDraft(base = null) {
  const draft = createBetaFeedbackDraft(base || readStoredDraft());
  form.querySelectorAll('[name]').forEach(field => {
    const value = field.type === 'checkbox' ? field.checked : field.value;
    setByPath(draft, field.name, value);
  });
  draft.updatedAt = new Date().toISOString();
  return draft;
}

function fillForm(draft) {
  form.querySelectorAll('[name]').forEach(field => {
    const value = getByPath(draft, field.name);
    if (field.type === 'checkbox') field.checked = value !== false;
    else field.value = value ?? '';
  });
}

function updateStatus(draft) {
  const result = summarizeBetaFeedback(draft);
  statusNode.textContent = result.label;
  statusNode.dataset.status = result.status;
  const items = [...result.validation.errors, ...result.validation.warnings];
  statusDetailNode.textContent = items.length
    ? items.join(' · ')
    : 'Die Rückmeldung kann exportiert und weitergegeben werden.';
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = 'Kopiert ✓';
    setTimeout(() => { button.textContent = original; }, 1400);
  } catch {
    alert(text);
  }
}

fillOptions(categorySelect, BETA_FEEDBACK_CATEGORIES);
fillOptions(severitySelect, BETA_FEEDBACK_SEVERITIES);
let draft = readStoredDraft();
fillForm(draft);
updateStatus(draft);

form.addEventListener('input', () => {
  draft = writeStoredDraft(collectDraft(draft));
  updateStatus(draft);
});

form.addEventListener('change', () => {
  draft = writeStoredDraft(collectDraft(draft));
  updateStatus(draft);
});

document.querySelectorAll('[data-feedback-action]').forEach(button => {
  button.addEventListener('click', async () => {
    const action = button.dataset.feedbackAction;
    draft = writeStoredDraft(collectDraft(draft));
    const summary = summarizeBetaFeedback(draft);
    updateStatus(draft);

    if (action !== 'reset' && !summary.validation.valid) {
      alert(['Bitte zuerst die Pflichtfelder ergänzen:', ...summary.validation.errors].join('\n'));
      return;
    }

    if (action === 'copy') {
      await copyText(formatBetaFeedback(draft), button);
      return;
    }

    if (action === 'txt') {
      download(createBetaFeedbackFilename(draft, 'txt'), formatBetaFeedback(draft), 'text/plain;charset=utf-8');
      return;
    }

    if (action === 'json') {
      download(createBetaFeedbackFilename(draft, 'json'), createBetaFeedbackJson(draft), 'application/json;charset=utf-8');
      return;
    }

    if (action === 'csv') {
      download(createBetaFeedbackFilename(draft, 'csv'), `\ufeff${createBetaFeedbackCsv(draft)}`, 'text/csv;charset=utf-8');
      return;
    }

    if (action === 'reset') {
      if (!confirm('Eingaben der Rückmeldung wirklich zurücksetzen?')) return;
      localStorage.removeItem(BETA_FEEDBACK_STORAGE_KEY);
      draft = createBetaFeedbackDraft();
      fillForm(draft);
      updateStatus(draft);
    }
  });
});
