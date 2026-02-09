/**
 * Global Persistent Form System
 * automatically saves and restores form data across the application.
 */
class FormPersistence {
  constructor() {
    this.storageKey = 'ledger_form_persistence';
    this.currentContext = null;
    this.debouncers = new Map();

    // Load all persisted data
    try {
      this.data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    } catch (e) {
      console.error('Failed to load form persistence data', e);
      this.data = {};
    }

    // Auto-save listener
    this.initAutoSave();
  }

  static getInstance() {
    if (!window._formPersistenceInstance) {
      window._formPersistenceInstance = new FormPersistence();
    }
    return window._formPersistenceInstance;
  }

  /**
   * Set the current context (e.g., 'pages/new-order.html' or 'station')
   * This defines where data is read from/written to.
   */
  setContext(context) {
    if (!context) return;
    this.currentContext = context;
    console.debug(`[FormPersistence] Context set to: ${context}`);
  }

  /**
   * Initialize event listeners for auto-saving
   */
  initAutoSave() {
    document.body.addEventListener('input', (e) => this.handleInput(e));
    document.body.addEventListener('change', (e) => this.handleInput(e));
  }

  handleInput(e) {
    if (!this.currentContext) return;

    const target = e.target;

    // Skip passwords and file inputs for security/technical reasons
    if (target.type === 'password' || target.type === 'file') return;

    // Skip if specifically marked to ignore
    if (target.getAttribute('data-persist') === 'ignore') return;

    // Identify the element
    const id = target.id;
    const name = target.name;

    // We need at least an ID or Name to persist
    if (!id && !name) return;

    const key = id || name;
    let value;

    if (target.type === 'checkbox') {
      value = target.checked;
    } else if (target.type === 'radio') {
      if (target.checked) value = target.value;
      else return; // Don't save unchecked radios directly, the checked one overwrites
    } else {
      value = target.value;
    }

    this.save(key, value);
  }

  save(key, value) {
    if (!this.data[this.currentContext]) {
      this.data[this.currentContext] = {};
    }

    this.data[this.currentContext][key] = value;

    // Debounce writing to localStorage to avoid performance hits
    this.debounceWrite();
  }

  debounceWrite() {
    if (this.writeTimeout) clearTimeout(this.writeTimeout);
    this.writeTimeout = setTimeout(() => {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }, 500);
  }

  /**
   * Restore data for the current context into the DOM
   */
  restore() {
    if (!this.currentContext) return;

    const contextData = this.data[this.currentContext];
    if (!contextData) return;

    console.debug(`[FormPersistence] Restoring data for ${this.currentContext}`);

    Object.keys(contextData).forEach(key => {
      const value = contextData[key];

      // Try ID first, then Name
      const elById = document.getElementById(key);
      if (elById) {
        this.setElementValue(elById, value);
        return;
      }

      const elsByName = document.getElementsByName(key);
      if (elsByName.length > 0) {
        elsByName.forEach(el => this.setElementValue(el, value));
      }
    });
  }

  setElementValue(el, value) {
    // Skip if specifically marked to ignore
    if (el.getAttribute('data-persist') === 'ignore') return;

    if (el.type === 'checkbox') {
      el.checked = value === true || value === 'true'; // Handle string conversion if happened
    } else if (el.type === 'radio') {
      if (el.value === value) el.checked = true;
    } else {
      el.value = value;
    }

    // Trigger generic change event so other scripts know data changed
    // e.g., calculations updating based on restored values
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) { }
  }

  /**
   * Clear data for a specific context (or current if none provided)
   * Call this on successful submission
   */
  clear(context = null) {
    const ctx = context || this.currentContext;
    if (!ctx || !this.data[ctx]) return;

    delete this.data[ctx];
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    console.debug(`[FormPersistence] Cleared data for ${ctx}`);
  }

  /**
   * Clear ALL persistence data
   */
  clearAll() {
    this.data = {};
    localStorage.removeItem(this.storageKey);
  }
}

// Expose globally
window.FormPersistence = FormPersistence;
