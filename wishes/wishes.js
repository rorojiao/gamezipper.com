(() => {
  'use strict';

  const metaBase = document.querySelector('meta[name="gz-wish-api"]')?.content || 'https://wishes.gamezipper.com';
  const defaultBase = ['localhost', '127.0.0.1'].includes(location.hostname) ? `${location.protocol}//${location.hostname}:8787` : metaBase;
  const API_BASE = (window.GAMEZIPPER_WISH_API_URL || defaultBase).replace(/\/$/, '');
  const CATEGORY_LABELS = {
    puzzle: '🧩 Puzzle & Logic',
    arcade: '🕹️ Arcade & Action',
    adventure: '🗺️ Adventure & RPG',
    'racing-sports': '🏁 Racing & Sports',
    'strategy-simulation': '🏙️ Strategy & Simulation',
    'card-board': '♟️ Card & Board',
    'word-trivia': '💬 Word & Trivia',
    other: '✨ Game request',
  };
  const state = {
    wishes: [], sort: 'new', total: 0, hasMore: false, loading: false,
    startedAt: Date.now(), turnstileSiteKey: '', turnstileWidget: null,
  };

  const elements = {
    form: document.getElementById('wish-form'),
    submit: document.getElementById('submit-wish'),
    formStatus: document.getElementById('form-status'),
    grid: document.getElementById('wish-grid'),
    message: document.getElementById('wall-message'),
    loadMore: document.getElementById('load-more'),
    total: document.getElementById('stat-total'),
    added: document.getElementById('stat-added'),
    details: document.getElementById('wish-details'),
    detailsCount: document.getElementById('details-count'),
    toast: document.getElementById('toast'),
  };

  function storageGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
  const storedVotes = storageGet('gz_wish_votes', []);
  const voted = new Set(Array.isArray(storedVotes) ? storedVotes : []);

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'omit',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'The wish service could not complete that request.');
    return data;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3500);
  }

  function setWallMessage(icon, title, text, retry = false) {
    elements.grid.replaceChildren();
    elements.message.replaceChildren();
    elements.message.hidden = false;
    if (icon) {
      const iconElement = document.createElement('div');
      iconElement.className = 'message-icon';
      iconElement.textContent = icon;
      elements.message.append(iconElement);
    }
    const heading = document.createElement('h3');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    elements.message.append(heading, paragraph);
    if (retry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button-secondary';
      button.textContent = 'Try again';
      button.addEventListener('click', () => loadWishes(true));
      elements.message.append(button);
    } else if (title.startsWith('Be the first')) {
      const link = document.createElement('a');
      link.className = 'button button-primary';
      link.href = '#make-a-wish';
      link.textContent = '✨ Make the first wish';
      elements.message.append(link);
    }
  }

  function relativeTime(timestamp) {
    const seconds = Math.round((timestamp - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (Math.abs(seconds) < 60) return 'just now';
    const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
    }
    return 'just now';
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function createWishCard(wish) {
    const card = element('article', 'wish-card');
    card.dataset.wishId = wish.id;
    const top = element('div', 'wish-topline');
    top.append(element('span', 'category-chip', CATEGORY_LABELS[wish.category] || CATEGORY_LABELS.other));
    if (wish.status === 'added') top.append(element('span', 'added-chip', '✓ ADDED'));
    card.append(top, element('h3', '', wish.title));
    if (wish.details) card.append(element('p', 'wish-details', wish.details));

    const author = element('div', 'wish-author');
    author.append(element('span', 'author-icon', '✦'), element('span', 'author-name', wish.nickname || 'Player'));
    author.append(document.createTextNode('·'));
    const time = element('time', '', relativeTime(wish.createdAt));
    time.dateTime = new Date(wish.createdAt).toISOString();
    time.title = new Date(wish.createdAt).toLocaleString();
    author.append(time);
    card.append(author);

    const actions = element('div', 'wish-actions');
    const isVoted = voted.has(wish.id);
    const voteButton = element('button', `vote-button${isVoted ? ' voted' : ''}`);
    voteButton.type = 'button';
    voteButton.disabled = isVoted;
    voteButton.setAttribute('aria-pressed', String(isVoted));
    voteButton.setAttribute('aria-label', `${isVoted ? 'You support' : 'Support'} the request for ${wish.title}. ${wish.votes} votes.`);
    voteButton.append(element('span', 'vote-heart', isVoted ? '♥' : '♡'));
    voteButton.append(element('span', 'vote-label', isVoted ? 'Wanted' : 'I want this too'));
    voteButton.append(element('span', 'vote-count', String(wish.votes)));
    voteButton.addEventListener('click', () => supportWish(wish, voteButton));
    actions.append(voteButton);
    if (wish.status === 'added' && wish.gameUrl) {
      const play = element('a', 'play-link', 'Play now →');
      play.href = wish.gameUrl;
      play.setAttribute('aria-label', `Play ${wish.title}`);
      actions.append(play);
    }
    card.append(actions);
    return card;
  }

  function renderWishes() {
    elements.message.hidden = true;
    elements.grid.replaceChildren(...state.wishes.map(createWishCard));
    elements.loadMore.hidden = !state.hasMore;
    if (!state.wishes.length) {
      setWallMessage('🌟', 'Be the first to make a wish', 'The wall is ready for its first game request. What would you love to play?');
    }
  }

  async function loadWishes(reset = false) {
    if (state.loading) return;
    state.loading = true;
    elements.loadMore.disabled = true;
    if (reset) {
      elements.message.hidden = false;
      elements.message.replaceChildren();
      const spinner = element('div', 'spinner');
      spinner.setAttribute('aria-hidden', 'true');
      elements.message.append(spinner, element('p', '', 'Opening the wish wall…'));
      elements.grid.replaceChildren();
    }
    try {
      const offset = reset ? 0 : state.wishes.length;
      const data = await api(`/api/wishes?sort=${state.sort}&limit=12&offset=${offset}`);
      state.wishes = reset ? data.wishes : state.wishes.concat(data.wishes);
      state.total = data.total;
      state.hasMore = data.hasMore;
      state.turnstileSiteKey = data.turnstileSiteKey || '';
      elements.total.textContent = Number(data.total).toLocaleString();
      elements.added.textContent = Number(data.added).toLocaleString();
      renderWishes();
      setupTurnstile();
    } catch (error) {
      if (reset || !state.wishes.length) {
        setWallMessage('🌙', 'The wall is taking a little break', 'We could not load wishes just now. Please try again in a moment.', true);
        elements.loadMore.hidden = true;
      } else {
        showToast('Could not load more wishes. Please try again.');
      }
    } finally {
      state.loading = false;
      elements.loadMore.disabled = false;
    }
  }

  async function supportWish(wish, button) {
    if (voted.has(wish.id) || button.disabled) return;
    button.disabled = true;
    try {
      const data = await api('/api/wishes', {
        method: 'POST',
        body: JSON.stringify({ action: 'vote', id: wish.id }),
      });
      wish.votes = data.votes;
      voted.add(wish.id);
      storageSet('gz_wish_votes', [...voted]);
      button.classList.add('voted');
      button.setAttribute('aria-pressed', 'true');
      button.querySelector('.vote-heart').textContent = '♥';
      button.querySelector('.vote-label').textContent = 'Wanted';
      button.querySelector('.vote-count').textContent = String(data.votes);
      button.setAttribute('aria-label', `You support the request for ${wish.title}. ${data.votes} votes.`);
      showToast(data.alreadyVoted ? 'You already support this wish 💜' : 'Wish supported — thank you! 💜');
    } catch (error) {
      button.disabled = false;
      showToast(error.message);
    }
  }

  function showFormStatus(type, message) {
    elements.formStatus.className = `form-status ${type}`;
    elements.formStatus.textContent = message;
    elements.formStatus.hidden = false;
  }

  function setupTurnstile() {
    if (!state.turnstileSiteKey || state.turnstileWidget !== null || document.getElementById('turnstile-script')) return;
    document.getElementById('turnstile-wrap').hidden = false;
    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      state.turnstileWidget = window.turnstile.render('#turnstile-widget', { sitekey: state.turnstileSiteKey, theme: 'auto' });
    };
    script.onerror = () => { state.turnstileWidget = null; script.remove(); };
    document.head.append(script);
  }

  elements.form.addEventListener('submit', async event => {
    event.preventDefault();
    elements.formStatus.hidden = true;
    if (!elements.form.reportValidity()) return;
    if (state.turnstileSiteKey && state.turnstileWidget === null) {
      showFormStatus('error', 'The human check could not load. Please refresh the page and try again.');
      return;
    }
    const formData = new FormData(elements.form);
    const payload = {
      title: formData.get('title'),
      category: formData.get('category'),
      nickname: formData.get('nickname'),
      details: formData.get('details'),
      website: formData.get('website'),
      startedAt: state.startedAt,
    };
    if (state.turnstileWidget !== null) payload.turnstileToken = window.turnstile.getResponse(state.turnstileWidget);

    elements.submit.disabled = true;
    elements.submit.querySelector('span').textContent = 'Sending your wish…';
    try {
      const data = await api('/api/wishes', { method: 'POST', body: JSON.stringify(payload) });
      elements.form.reset();
      state.startedAt = Date.now();
      elements.detailsCount.textContent = '0 / 500';
      if (state.turnstileWidget !== null) window.turnstile.reset(state.turnstileWidget);
      showFormStatus('success', `✨ ${data.message || 'Your wish is in! It will appear on the wall after a quick review.'}`);
      document.getElementById('game-title').focus({ preventScroll: true });
    } catch (error) {
      showFormStatus('error', error.message);
    } finally {
      elements.submit.disabled = false;
      elements.submit.querySelector('span').textContent = 'Send my wish';
    }
  });

  elements.details.addEventListener('input', () => {
    elements.detailsCount.textContent = `${elements.details.value.length} / 500`;
  });
  document.querySelectorAll('[data-sort]').forEach(button => {
    button.addEventListener('click', () => {
      if (state.sort === button.dataset.sort) return;
      state.sort = button.dataset.sort;
      document.querySelectorAll('[data-sort]').forEach(other => {
        const selected = other === button;
        other.classList.toggle('selected', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      loadWishes(true);
    });
  });
  elements.loadMore.addEventListener('click', () => loadWishes(false));
  loadWishes(true);
})();
