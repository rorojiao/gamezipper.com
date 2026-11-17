(() => {
  'use strict';

  const metaBase = document.querySelector('meta[name="gz-wish-api"]')?.content || 'https://wishes.gamezipper.com';
  const defaultBase = ['localhost', '127.0.0.1'].includes(location.hostname) ? `${location.protocol}//${location.hostname}:8787` : metaBase;
  const API_BASE = (window.GAMEZIPPER_WISH_API_URL || defaultBase).replace(/\/$/, '');
  const STATUS_LABELS = { pending: 'NEEDS REVIEW', approved: 'PUBLISHED', added: 'ADDED', hidden: 'HIDDEN' };
  const CATEGORY_LABELS = {
    puzzle: '🧩 Puzzle & Logic', arcade: '🕹️ Arcade & Action', adventure: '🗺️ Adventure & RPG',
    'racing-sports': '🏁 Racing & Sports', 'strategy-simulation': '🏙️ Strategy & Simulation',
    'card-board': '♟️ Card & Board', 'word-trivia': '💬 Word & Trivia', other: '✨ Other',
  };
  const state = { wishes: [], status: 'all', hasMore: false, loading: false };
  const views = {
    boot: document.getElementById('boot-view'), login: document.getElementById('login-view'),
    admin: document.getElementById('admin-view'),
  };
  const elements = {
    loginForm: document.getElementById('login-form'), loginButton: document.getElementById('login-button'),
    loginStatus: document.getElementById('login-status'), password: document.getElementById('admin-password'),
    list: document.getElementById('admin-list'), message: document.getElementById('admin-message'),
    filter: document.getElementById('status-filter'), loadMore: document.getElementById('admin-load-more'),
    emailWarning: document.getElementById('email-warning'), toast: document.getElementById('toast'),
  };

  function showView(name) {
    Object.entries(views).forEach(([key, view]) => { view.hidden = key !== name; });
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3500);
  }
  async function api(options = {}, query = '') {
    const response = await fetch(`${API_BASE}/api/wish-admin${query}`, {
      ...options,
      credentials: 'include',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || 'The request could not be completed.');
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function renderStats(stats) {
    document.getElementById('admin-stat-total').textContent = Number(stats.total).toLocaleString();
    document.getElementById('admin-stat-pending').textContent = Number(stats.pending).toLocaleString();
    document.getElementById('admin-stat-public').textContent = Number(stats.public).toLocaleString();
    document.getElementById('admin-stat-added').textContent = Number(stats.added).toLocaleString();
  }

  function actionButton(label, className, handler) {
    const button = node('button', `admin-action ${className || ''}`, label);
    button.type = 'button';
    button.addEventListener('click', async () => {
      const card = button.closest('.admin-wish');
      card.querySelectorAll('button').forEach(item => { item.disabled = true; });
      try { await handler(card); } catch (error) {
        showToast(error.message);
        card.querySelectorAll('button').forEach(item => { item.disabled = false; });
        if (error.status === 401) showView('login');
      }
    });
    return button;
  }

  function createAdminCard(wish) {
    const card = node('article', `admin-wish ${wish.status}`);
    card.dataset.wishId = wish.id;
    const header = node('div', 'admin-wish-header');
    const titleWrap = node('div', 'admin-wish-title');
    titleWrap.append(node('div', 'admin-category', CATEGORY_LABELS[wish.category] || CATEGORY_LABELS.other));
    titleWrap.append(node('h2', '', wish.title));
    header.append(titleWrap, node('span', `status-badge status-${wish.status}`, STATUS_LABELS[wish.status]));
    card.append(header);
    if (wish.details) card.append(node('p', 'admin-details', wish.details));

    const meta = node('div', 'admin-meta');
    meta.append(node('span', '', `By ${wish.nickname}`));
    meta.append(node('span', '', new Date(wish.createdAt).toLocaleString()));
    meta.append(node('span', '', `♥ ${wish.votes} votes`));
    meta.append(node('span', `email-${wish.emailStatus}`, `Email: ${wish.emailStatus.replace('_', ' ')}`));
    card.append(meta, node('div', 'admin-wish-id', `ID ${wish.id}`));

    const urlWrap = node('div', 'admin-url');
    const inputId = `game-url-${wish.id}`;
    const label = node('label', '', 'Game URL when added (optional)');
    label.htmlFor = inputId;
    const input = node('input');
    input.id = inputId;
    input.type = 'text';
    input.value = wish.gameUrl || '';
    input.placeholder = '/game-name/';
    input.autocomplete = 'off';
    urlWrap.append(label, input);
    card.append(urlWrap);

    const actions = node('div', 'admin-actions');
    const update = status => async currentCard => {
      await api({ method: 'PATCH', body: JSON.stringify({ id: wish.id, status, gameUrl: currentCard.querySelector('input').value }) });
      showToast(status === 'added' ? 'Wish marked as added 🎮' : status === 'approved' ? 'Wish is now on the public wall ✨' : 'Wish updated');
      await loadWishes(true);
    };
    if (wish.status === 'pending') actions.append(actionButton('✓ Approve & publish', 'primary', update('approved')));
    if (wish.status === 'added') actions.append(actionButton('Move to published', '', update('approved')));
    if (wish.status !== 'added' && wish.status !== 'hidden') actions.append(actionButton('🎮 Mark as added', 'added', update('added')));
    if (wish.status !== 'hidden') actions.append(actionButton('Hide', '', update('hidden')));
    if (wish.status === 'hidden') actions.append(actionButton('Restore to wall', 'primary', update('approved')));
    if (wish.emailStatus === 'failed' || wish.emailStatus === 'not_configured') {
      actions.append(actionButton('↻ Retry email', '', async () => {
        const result = await api({ method: 'POST', body: JSON.stringify({ action: 'resend', id: wish.id }) });
        showToast(result.emailStatus === 'sent' ? 'Email sent' : 'Email is not configured or could not be sent');
        await loadWishes(true);
      }));
    }
    actions.append(actionButton('Delete', 'danger', async () => {
      if (!window.confirm(`Permanently delete the wish “${wish.title}”? This cannot be undone.`)) {
        card.querySelectorAll('button').forEach(item => { item.disabled = false; });
        return;
      }
      await api({ method: 'DELETE', body: JSON.stringify({ id: wish.id }) });
      showToast('Wish deleted');
      await loadWishes(true);
    }));
    card.append(actions);
    return card;
  }

  function renderWishes() {
    elements.list.replaceChildren(...state.wishes.map(createAdminCard));
    elements.loadMore.hidden = !state.hasMore;
    elements.message.hidden = state.wishes.length > 0;
    if (!state.wishes.length) {
      elements.message.textContent = state.status === 'pending' ? 'Inbox zero — no wishes need review. ✨' : 'No wishes in this view yet.';
    }
  }

  async function loadWishes(reset = false) {
    if (state.loading) return;
    state.loading = true;
    elements.loadMore.disabled = true;
    try {
      const offset = reset ? 0 : state.wishes.length;
      const data = await api({}, `?status=${state.status}&limit=40&offset=${offset}`);
      state.wishes = reset ? data.wishes : state.wishes.concat(data.wishes);
      state.hasMore = data.hasMore;
      renderStats(data.stats);
      elements.emailWarning.hidden = data.emailConfigured;
      renderWishes();
      showView('admin');
    } catch (error) {
      if (error.status === 401) {
        showView('login');
      } else {
        elements.message.textContent = error.message;
        elements.message.hidden = false;
        showView('admin');
      }
    } finally {
      state.loading = false;
      elements.loadMore.disabled = false;
    }
  }

  elements.loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    elements.loginStatus.hidden = true;
    elements.loginButton.disabled = true;
    elements.loginButton.textContent = 'Signing in…';
    try {
      await api({ method: 'POST', body: JSON.stringify({ action: 'login', password: elements.password.value }) });
      elements.password.value = '';
      await loadWishes(true);
    } catch (error) {
      elements.loginStatus.textContent = error.message;
      elements.loginStatus.hidden = false;
    } finally {
      elements.loginButton.disabled = false;
      elements.loginButton.textContent = 'Sign in securely →';
    }
  });
  document.getElementById('logout-button').addEventListener('click', async () => {
    try { await api({ method: 'POST', body: JSON.stringify({ action: 'logout' }) }); } catch {}
    state.wishes = [];
    showView('login');
  });
  document.getElementById('refresh-button').addEventListener('click', () => loadWishes(true));
  elements.filter.addEventListener('change', () => { state.status = elements.filter.value; loadWishes(true); });
  elements.loadMore.addEventListener('click', () => loadWishes(false));
  loadWishes(true);
})();
