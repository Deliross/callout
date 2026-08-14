const storageKey = 'callout-product-state-v2';

const defaultState = {
  posts: [],
  guilds: [],
  savedPostIds: [],
  profile: {
    displayName: 'Guest',
    handle: '@guest',
    bio: '',
    tagline: '',
    location: '',
    profileVisibility: { about: 'public', activity: 'public' },
    avatarUrl: '',
    bannerUrl: '',
    themeColor: '#ff4713',
    avatarFrame: 'none',
    profileEffect: 'none',
    profileBackground: 'clean',
    profileLayout: ['posts', 'guilds', 'heat'],
    showcaseMode: 'featured',
    cosmeticUnlocks: { frames: ['none'], effects: ['none'], backgrounds: ['clean'], palettes: ['callout'] },
    featuredPosts: [],
    pinnedGuilds: [],
    socialLinks: { twitter: '', instagram: '', discord: '', youtube: '', twitch: '', custom: '' },
    pronouns: '',
    status: 'online',
    heatScore: 0,
    heatStreak: { current: 0, longest: 0, lastActiveDate: '', activeDates: [] },
    badges: []
  },
  settings: {
    appearanceVersion: 2,
    theme: 'light',
    palette: 'callout',
    reducedMotion: false,
    feedDensity: 'comfortable',
    voteEffect: 'pop',
    notificationSound: 'callout',
    notifications: { likes: true, comments: true, guildInvites: true, mentions: true, follows: true, guildActivity: true, directMessages: true },
    notificationDelivery: { inApp: true, push: false, email: false },
    directMessages: 'everyone',
    textSize: 'medium',
    blockedUsers: [],
    widgetOrder: ['trending-guilds', 'activity', 'achievements'],
    hiddenTopics: [],
    leaderboardPeriod: 'all'
  }
};

const storedState = (() => {
  try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
})();

const state = {
  ...defaultState,
  ...(storedState || {}),
  profile: {
    ...defaultState.profile,
    ...(storedState?.profile || {}),
    socialLinks: {
      ...defaultState.profile.socialLinks,
      ...(storedState?.profile?.socialLinks || {}),
      twitter: storedState?.profile?.socialLinks?.twitter || storedState?.profile?.twitter || '',
      instagram: storedState?.profile?.socialLinks?.instagram || storedState?.profile?.instagram || '',
      discord: storedState?.profile?.socialLinks?.discord || storedState?.profile?.discord || ''
    },
    profileVisibility: { ...defaultState.profile.profileVisibility, ...(storedState?.profile?.profileVisibility || {}) }
  },
  settings: {
    ...defaultState.settings,
    ...(storedState?.settings || {}),
    notifications: { ...defaultState.settings.notifications, ...(storedState?.settings?.notifications || {}) },
    blockedUsers: Array.isArray(storedState?.settings?.blockedUsers) ? storedState.settings.blockedUsers : []
  },
  posts: Array.isArray(storedState?.posts) ? storedState.posts.map(post => ({ ...post, id: String(post.id), authorId: String(post.authorId || 'local-user'), comments: Array.isArray(post.comments) ? post.comments : [] })) : [],
  guilds: Array.isArray(storedState?.guilds) ? storedState.guilds : [],
  savedPostIds: Array.isArray(storedState?.savedPostIds) ? storedState.savedPostIds.map(String) : [],
  savedPosts: [],
  trendingPosts: [],
  leaderboard: [],
  basedLeaderboard: [],
  lifetimeLeaderboard: [],
  lifetimeBasedLeaderboard: [],
  userStanding: null,
  leaderboardView: 'based',
  railLeaderboardKind: 'cringe',
  notifications: [],
  messages: [],
  friendships: [],
  activeGuild: null,
  guildPosts: [],
  guildMessages: [],
  guildMembers: [],
  guildAudit: [],
  publicProfile: null,
  ownProfileData: null,
  profileTab: 'posts',
  profilePostFilter: 'all',
  analytics: null,
  botAutomation: null,
  analyticsError: '',
  adminError: '',
  analyticsDays: 28,
  adminBigPatch: { staff: [], audit: [], features: [] },
  notificationFilter: 'all'
  ,ideas: [], ideaMood: 'all',
  anonymousPosts: [],
  topics: [],
  battles: [],
  battleFilter: 'all',
  about: { sections: [], updates: [] },
  pinboard: { cycle: '', items: [], canManage: false },
  activeFeedTab: 'For You',
  expandedPostState: ''
};

if (storedState?.settings?.appearanceVersion !== 2) {
  state.settings.appearanceVersion = 2;
  state.settings.theme = 'light';
}

const routes = new Set(['home', 'trending', 'topics', 'battles', 'guilds', 'guild', 'ideas', 'leaderboards', 'heat', 'notifications', 'messages', 'saved', 'profile', 'user', 'settings', 'customize', 'accessibility', 'analytics', 'admin', 'about', 'take', 'auth']);
const postReactions = [
  { key: 'spark', face: '✦', label: 'Sparked' },
  { key: 'purple_smile', face: '☻', label: 'Purple smile' },
  { key: 'based_crown', face: '♛', label: 'Based crown' },
  { key: 'heat', face: '♨', label: 'Heat check' },
  { key: 'micdrop', face: '♪', label: 'Mic drop' },
  { key: 'sideeye', face: '◔', label: 'Side-eye' },
  { key: 'brainzap', face: '⚡', label: 'Brain zap' },
  { key: 'popcorn', face: '▣', label: 'Popcorn' },
  { key: 'gold_star', face: '★', label: 'Gold star' },
  { key: 'red_flag', face: '⚑', label: 'Red flag' },
  { key: 'diamond', face: '◇', label: 'Diamond take' },
  { key: 'ghosted', face: '♧', label: 'Ghosted' },
  { key: 'clown', face: '◉', label: 'Clown energy' },
  { key: 'tiny_fire', face: '🔥', label: 'Tiny fire' },
  { key: 'skull', face: '☠', label: 'Done' },
  { key: 'laugh', face: '☺', label: 'Laughing' },
  { key: 'question', face: '?', label: 'Questionable' },
  { key: 'loud', face: '!', label: 'Loud take' },
  { key: 'rare', face: '✧', label: 'Rare take' },
  { key: 'callout', face: '◎', label: 'Callout certified' }
];
const mainContent = document.querySelector('#mainContent');
const composer = document.querySelector('#composer');
const guildComposer = document.querySelector('#guildComposer');
const actionDialog = document.querySelector('#actionDialog');
let sessionUser = null;
let pendingMedia = [];
let pendingExternalEmbed = null;
let messageStream = null;
let sessionRefreshRequest = null;
let composerSubmissionInFlight = false;
let composerRequestId = '';
let publishingTimer = null;

function sanitizeInput(value) {
  const source = String(value || '');
  return window.DOMPurify ? window.DOMPurify.sanitize(source, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim() : source.replace(/<[^>]*>/g, '').trim();
}

function metaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

const consentStorageKey = 'callout-privacy-consent-v1';
let privacyConsent = (() => {
  try { return localStorage.getItem(consentStorageKey) || ''; } catch { return ''; }
})();

function updateGoogleConsent(choice) {
  const granted = choice === 'accept' ? 'granted' : 'denied';
  window.gtag?.('consent', 'update', {
    analytics_storage: granted,
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted
  });
}

function setPrivacyConsent(choice) {
  privacyConsent = choice === 'accept' ? 'accept' : 'reject';
  try { localStorage.setItem(consentStorageKey, privacyConsent); } catch { /* the current choice still applies */ }
  updateGoogleConsent(privacyConsent);
  const banner = document.querySelector('#consentBanner');
  if (banner) banner.hidden = true;
  updateAdVisibility();
  if (privacyConsent === 'accept') loadProductionAds();
}

function initializePrivacyChoices() {
  const banner = document.querySelector('#consentBanner');
  document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => setPrivacyConsent(button.dataset.consent)));
  document.querySelectorAll('[data-privacy-choices]').forEach(button => button.addEventListener('click', () => {
    if (banner) banner.hidden = false;
  }));
  if (privacyConsent) updateGoogleConsent(privacyConsent);
  else if (banner) banner.hidden = false;
}

function adConfiguration() {
  return {
    client: metaContent('adsense-client'),
    slots: {
      header: metaContent('adsense-slot-header'), sidebar: metaContent('adsense-slot-sidebar'),
      'right-rail': metaContent('adsense-slot-right-rail'), 'in-feed': metaContent('adsense-slot-in-feed'), footer: metaContent('adsense-slot-footer')
    }
  };
}

let adResizeObserver = null;
let adVisibilityObserver = null;
let adsenseScriptReady = false;

function observeAdContainer(container) {
  if (!container || typeof ResizeObserver === 'undefined') return;
  adResizeObserver ||= new ResizeObserver(entries => {
    entries.forEach(entry => {
      if (entry.contentRect.width < 250) return;
      const pendingUnit = entry.target.querySelector('.callout-ad-pending:not([data-callout-ad-ready])');
      if (!pendingUnit) return;
      pendingUnit.classList.remove('callout-ad-pending');
      pendingUnit.classList.add('adsbygoogle');
      if (requestAdUnit(pendingUnit, adConfiguration().client)) adResizeObserver.unobserve(entry.target);
    });
  });
  adResizeObserver.observe(container);
}

function requestAdUnit(unit, client) {
  if (!unit?.isConnected || unit.dataset.calloutAdReady === 'true') return false;
  const slot = unit.dataset.adSlot || '';
  if (!/^\d+$/.test(slot)) return false;
  const container = unit.closest('.ad-slot');
  if (!container) return false;

  container.classList.add('is-ad-measuring');
  if (container.getBoundingClientRect().width < 250) {
    container.classList.remove('is-ad-measuring');
    return false;
  }

  unit.dataset.adClient = client;
  unit.dataset.calloutAdReady = 'true';
  container.classList.remove('is-ad-measuring');
  container.classList.add('is-ad-requested');
  const syncAdStatus = () => {
    const filled = unit.dataset.adStatus === 'filled';
    container.classList.toggle('is-ad-live', filled);
    container.classList.toggle('is-ad-unfilled', unit.dataset.adStatus === 'unfilled');
  };
  new MutationObserver(syncAdStatus).observe(unit, { attributes: true, attributeFilter: ['data-ad-status'] });
  syncAdStatus();
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    window.setTimeout(() => {
      if (!unit.isConnected || unit.dataset.adStatus || unit.dataset.googleQueryId) return;
      container.classList.remove('is-ad-requested');
      container.classList.add('is-ad-unfilled');
    }, 8000);
    return true;
  } catch (error) {
    delete unit.dataset.calloutAdReady;
    container.classList.remove('is-ad-requested');
    console.warn('AdSense unit deferred:', error.message);
    return false;
  }
}

function observeAdVisibility(unit) {
  if (!unit || unit.dataset.calloutAdObserved === 'true') return;
  const container = unit.closest('.ad-slot');
  if (!container) return;
  if (typeof IntersectionObserver === 'undefined') {
    requestAdUnit(unit, adConfiguration().client);
    return;
  }
  adVisibilityObserver ||= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      adVisibilityObserver.unobserve(entry.target);
      const visibleUnit = entry.target.querySelector('.adsbygoogle[data-callout-ad-observed="true"]');
      if (!visibleUnit) return;
      delete visibleUnit.dataset.calloutAdObserved;
      requestAdUnit(visibleUnit, adConfiguration().client);
    });
  }, { rootMargin: '600px 0px' });
  unit.dataset.calloutAdObserved = 'true';
  adVisibilityObserver.observe(container);
}

function initializeAds(root = document) {
  const { client } = adConfiguration();
  if (!adsenseScriptReady || !routeAllowsAds() || !/^ca-pub-\d{10,}$/.test(client) || location.protocol === 'file:') return;
  const units = [...root.querySelectorAll('.adsbygoogle:not([data-callout-ad-ready]), .callout-ad-pending:not([data-callout-ad-ready])')].filter(unit => !unit.closest('.ad-slot')?.hidden);
  units.forEach(unit => {
    const container = unit.closest('.ad-slot');
    if (!container || container.getBoundingClientRect().width >= 250) return;
    unit.classList.remove('adsbygoogle');
    unit.classList.add('callout-ad-pending');
    observeAdContainer(container);
  });
  units.forEach(unit => {
    if (unit.classList.contains('callout-ad-pending')) return;
    observeAdVisibility(unit);
  });
}

function loadProductionAds() {
  if (privacyConsent !== 'accept') return;
  const { client } = adConfiguration();
  if (!/^ca-pub-\d{10,}$/.test(client) || location.protocol === 'file:') return;
  const existing = document.querySelector(`script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`);
  if (existing) {
    adsenseScriptReady = true;
    initializeAds();
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  script.addEventListener('load', () => {
    adsenseScriptReady = true;
    initializeAds();
  });
  document.head.appendChild(script);
}

function routeAllowsAds() {
  if (privacyConsent !== 'accept') return false;
  const route = currentRoute();
  if (route === 'take') return Boolean(activeTake());
  const publicPosts = posts => sessionUser ? posts : posts.filter(post => !post.authorAutomated);
  if (route === 'trending') return publicPosts(state.trendingPosts).length >= 3;
  return route === 'home' && publicPosts(state.posts).length >= 3 && !['Following', 'Anonymous'].includes(state.activeFeedTab);
}

function placementAllowsAds(placement) {
  if (!routeAllowsAds()) return false;
  const route = currentRoute();
  if (placement === 'right-rail') return true;
  if (placement === 'in-feed') return route === 'home' || route === 'trending';
  if (placement === 'footer') return route === 'take' || (route === 'home' && (sessionUser ? state.posts : state.posts.filter(post => !post.authorAutomated)).length >= 9);
  return false;
}

function updateAdVisibility() {
  document.querySelectorAll('.sidebar > .ad-slot, .right-rail > .ad-slot, .site-footer > .ad-slot').forEach(slot => {
    slot.hidden = !placementAllowsAds(slot.dataset.adPlacement);
  });
}

let lastTrackedPath = '';
function loadGoogleAnalytics() {
  const measurementId = metaContent('ga-measurement-id');
  if (!/^G-[A-Z0-9]+$/i.test(measurementId) || location.protocol === 'file:') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false, anonymize_ip: true });
  if (!document.querySelector('script[src*="www.googletagmanager.com/gtag/js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }
}

function trackPageView() {
  if (!window.gtag || lastTrackedPath === location.hash) return;
  lastTrackedPath = location.hash;
  window.gtag('event', 'page_view', { page_title: document.title, page_location: location.href, page_path: `/${currentRoute()}` });
}

function trackEvent(name, parameters = {}) {
  window.gtag?.('event', name, parameters);
}

function persist() {
  const lightweightProfile = { ...state.profile, avatarUrl: '', bannerUrl: '' };
  const cache = { profile: lightweightProfile, settings: state.settings, savedPostIds: state.savedPostIds };
  try { localStorage.setItem(storageKey, JSON.stringify(cache)); }
  catch (error) {
    localStorage.removeItem(storageKey);
    try { localStorage.setItem(storageKey, JSON.stringify({ settings: state.settings })); } catch { /* database remains authoritative */ }
    console.warn('Callout browser cache was reset:', error.message);
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function playNotificationSound() {
  if (state.settings.notificationSound === 'none') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return;
    const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.frequency.value = state.settings.notificationSound === 'spark' ? 880 : state.settings.notificationSound === 'soft' ? 440 : 660;
    gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .16);
  } catch { /* sound is optional */ }
}

function runVoteEffect(button, value) {
  if (state.settings.voteEffect === 'none' || state.settings.reducedMotion) return;
  button.classList.remove('vote-confirmed');
  void button.offsetWidth;
  button.classList.add('vote-confirmed');
  setTimeout(() => button.classList.remove('vote-confirmed'), 320);
  return;
  const effect = state.settings.voteEffect || 'pop'; if (effect === 'none' || state.settings.reducedMotion) return;
  const burst = document.createElement('span'); burst.className = `vote-feedback vote-feedback-${effect} ${value}`; burst.textContent = value === 'alright' ? '✓' : '🔥';
  button.appendChild(burst); setTimeout(() => burst.remove(), 850);
}

async function apiFetch(url, options = {}, retry = true) {
  const response = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  if (response.status === 401 && retry && url !== '/api/auth/refresh') {
    // Only one refresh may rotate the device token at a time. Without this lock,
    // concurrent page requests can invalidate each other and clear a valid login.
    if (!sessionRefreshRequest) {
      sessionRefreshRequest = fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
        .then(async refreshed => {
          if (!refreshed.ok) return false;
          const payload = await refreshed.json().catch(() => null);
          if (payload?.user) applySessionUser(payload.user);
          return true;
        })
        .finally(() => { sessionRefreshRequest = null; });
    }
    if (await sessionRefreshRequest) return apiFetch(url, options, false);
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(payload?.details) && payload.details.length ? payload.details.join(' ') : '';
    const error = new Error(detail || payload?.error || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function applySessionUser(user) {
  sessionUser = user;
  document.querySelector('#analyticsNav').hidden = !user?.isAdmin;
  document.querySelector('#adminNav').hidden = !user?.isAdmin;
  if (!user) { updateHeaderProfile(); return; }
  state.profile = {
    ...state.profile,
    displayName: user.displayName || state.profile.displayName,
    handle: user.handle || state.profile.handle,
    avatarUrl: user.avatarUrl || state.profile.avatarUrl,
    heatScore: Number(user.heatScore ?? state.profile.heatScore),
    heatStreak: user.heatStreak || state.profile.heatStreak,
    badges: user.badges || state.profile.badges,
    postCount: Number(user.postCount ?? state.profile.postCount ?? 0),
    bio: user.bio ?? state.profile.bio,
    tagline: user.tagline ?? state.profile.tagline,
    location: user.location ?? state.profile.location,
    profileVisibility: { ...state.profile.profileVisibility, ...(user.profileVisibility || {}) },
    bannerUrl: user.bannerUrl ?? state.profile.bannerUrl,
    themeColor: user.themeColor || state.profile.themeColor,
    avatarFrame: user.avatarFrame || state.profile.avatarFrame,
    profileEffect: user.profileEffect || state.profile.profileEffect,
    profileBackground: user.profileBackground || state.profile.profileBackground,
    profileLayout: ['posts', 'guilds', 'heat'],
    showcaseMode: user.showcaseMode || state.profile.showcaseMode,
    cosmeticUnlocks: user.cosmeticUnlocks || state.profile.cosmeticUnlocks,
    featuredPosts: user.featuredPosts || state.profile.featuredPosts,
    pinnedGuilds: user.pinnedGuilds || state.profile.pinnedGuilds,
    socialLinks: { ...state.profile.socialLinks, ...(user.socialLinks || {}) },
    pronouns: user.pronouns ?? state.profile.pronouns,
    status: user.status || state.profile.status
  };
  if (user.preferences) {
    state.settings = {
      ...state.settings,
      ...user.preferences,
      notifications: { ...state.settings.notifications, ...(user.preferences.notifications || {}) }
      , notificationDelivery: { ...state.settings.notificationDelivery, ...(user.preferences.notificationDelivery || {}) }
    };
  }
  persist();
  updateHeaderProfile();
  startMessageStream();
}

function startMessageStream() {
  if (!sessionUser || messageStream) return;
  messageStream = new EventSource('/api/messages/stream');
  messageStream.addEventListener('messages', async () => {
    if (document.activeElement?.matches('textarea,input')) return;
    await hydrateAccountData();
    playNotificationSound();
    if (currentRoute() === 'messages' || currentRoute() === 'notifications') renderRoute();
  });
}

function updateHeaderProfile() {
  const profile = sessionUser ? state.profile : defaultState.profile;
  document.querySelector('#headerName').textContent = profile.displayName;
  document.querySelector('#headerHandle').textContent = profile.handle;
  const avatar = document.querySelector('#headerAvatar');
  avatar.classList.remove('heat-fresh', 'heat-mild', 'heat-spicy', 'heat-certified', 'heat-firestarter', 'heat-hall');
  avatar.classList.add('heat-frame', heatFrameClass(profile.heatScore || 0));
  avatar.innerHTML = profile.avatarUrl
    ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName)}" />`
    : escapeHtml((profile.displayName || 'C').charAt(0).toUpperCase());
  updateAccountChrome();
}

function heatMilestone(score = 0) {
  const levels = [
    { level: 1, name: 'Fresh Take', icon: '◇', threshold: 0, next: 1000, color: '#858b95' },
    { level: 2, name: 'Mild Heat', icon: '◔', threshold: 1000, next: 5000, color: '#d86b24' },
    { level: 3, name: 'Spicy Take', icon: '◆', threshold: 5000, next: 15000, color: '#f05a25' },
    { level: 4, name: 'Certified Hot Take', icon: '🔥', threshold: 15000, next: 40000, color: '#ef3f21' },
    { level: 5, name: 'Firestarter', icon: '⚡', threshold: 40000, next: 100000, color: '#c82a24' },
    { level: 6, name: 'Hall of Heat', icon: '♛', threshold: 100000, next: 250000, color: '#8d2028' }
  ];
  const current = [...levels].reverse().find(level => score >= level.threshold) || levels[0];
  const progress = current.level === levels.length ? 100 : Math.max(0, Math.min(100, (score - current.threshold) / (current.next - current.threshold) * 100));
  return { ...current, progress, remaining: Math.max(0, current.next - score), levels };
}

function updateAccountChrome() {
  const score = sessionUser ? Number(state.profile.heatScore || 0) : 0;
  const milestone = heatMilestone(score);
  document.querySelector('#headerHeat').textContent = `${score.toLocaleString()} HEAT`;
  document.querySelector('#sidebarHeatScore').textContent = score.toLocaleString();
  document.querySelector('#heatTierIcon').textContent = milestone.icon;
  document.querySelector('#heatTierName').textContent = milestone.name;
  document.querySelector('#heatProgressText').textContent = milestone.level === 6 ? 'MAX LEVEL' : `${score.toLocaleString()} / ${milestone.next.toLocaleString()}`;
  const track = document.querySelector('#heatProgress');
  track.setAttribute('aria-valuenow', String(score)); track.setAttribute('aria-valuemax', String(milestone.next || score)); track.querySelector('span').style.width = `${milestone.progress}%`; track.querySelector('i').style.left = `${milestone.progress}%`;
  const heatCard = document.querySelector('.heat-mini-card');
  if (heatCard) {
    heatCard.style.setProperty('--heat-accent', milestone.color);
    heatCard.dataset.heatLevel = String(milestone.level);
  }
  const railKind = state.railLeaderboardKind === 'based' ? 'based' : 'cringe';
  const railUsers = railKind === 'based' ? state.basedLeaderboard : state.leaderboard;
  const railScoreKey = railKind === 'based' ? 'basedScore' : 'cringeScore';
  const railStanding = sessionUser ? railUsers.find(user => String(user.id) === String(sessionUser.id)) : null;
  document.querySelector('#railRankNote').textContent = railStanding ? `${Number(railStanding[railScoreKey] || 0).toLocaleString()} ${railKind === 'based' ? 'Based' : 'Hot Take'} ${Number(railStanding[railScoreKey] || 0) === 1 ? 'vote' : 'votes'} received.` : 'Sign in to claim your place.';
  const mini = document.querySelector('#railLeaderboardRows');
  mini.dataset.kind = railKind;
  mini.innerHTML = railUsers.slice(0, 5).map(user => `<button type="button" data-rail-user="${user.id}"><b>${user.rank}</b><span class="avatar heat-frame ${heatFrameClass(user.heatScore || 0)}">${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />` : escapeHtml((user.displayName || 'C').charAt(0))}</span><span><strong>${escapeHtml(user.displayName)}</strong><small>${escapeHtml(user.badge?.name || user.handle || '')}</small></span><em>${Number(user[railScoreKey] || 0).toLocaleString()}</em></button>`).join('') || '<p>No ranked users yet.</p>';
  document.querySelectorAll('[data-leaderboard-kind]').forEach(button => button.classList.toggle('active', button.dataset.leaderboardKind === railKind));
  mini.querySelectorAll('[data-rail-user]').forEach(button => button.addEventListener('click', () => navigate(`user/${button.dataset.railUser}`)));
  renderProfileHeatFrame();
  renderSidebarWidgets();
  renderLiveMoments();
}

function renderProfileHeatFrame() {
  const host = currentRoute() === 'user' ? document.querySelector('.public-user-main') : currentRoute() === 'profile' ? document.querySelector('.profile-identity') : null;
  const profileAvatar = host?.querySelector('.avatar');
  const account = currentRoute() === 'user' ? state.publicProfile : state.profile;
  if (profileAvatar) profileAvatar.classList.add('heat-frame', heatFrameClass(account?.heatScore || 0));
}

function renderSidebarWidgets() {
  const container = document.querySelector('#sidebarWidgets');
  if (!container) return;
  const order = Array.isArray(state.settings.widgetOrder) ? state.settings.widgetOrder : defaultState.settings.widgetOrder;
  const joined = state.guilds.filter(guild => guild.joined).slice(0, 3);
  const definitions = {
    'trending-guilds': { title: 'Trending guilds', body: joined.length ? joined.map(guild => `<button type="button" data-widget-guild="${guild.id}"><span>${guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0))}</span><b>${escapeHtml(guild.name)}</b><small>${Number(guild.memberCount || 0)} members</small></button>`).join('') : '<p>Guild activity will appear as communities grow.</p>' },
    activity: { title: 'Your activity', body: `<div class="widget-stat"><strong>${Number(state.profile.heatScore || 0).toLocaleString()}</strong><span>Heat</span></div><div class="widget-stat"><strong>${Number(state.profile.postCount || 0).toLocaleString()}</strong><span>Posts</span></div>` },
    achievements: { title: 'Heat streak', body: `<p><strong>${Number(state.profile.heatStreak?.current || 0)}</strong> active day${Number(state.profile.heatStreak?.current || 0) === 1 ? '' : 's'} in a row.</p><button type="button" data-widget-progress>View Heat</button>` }
  };
  container.innerHTML = order.map((key, index) => `<section class="sidebar-widget" data-widget="${key}"><header><strong>${definitions[key].title}</strong><span><button type="button" data-widget-move="${index}" data-direction="-1" aria-label="Move up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-widget-move="${index}" data-direction="1" aria-label="Move down" ${index === order.length - 1 ? 'disabled' : ''}>↓</button></span></header><div>${definitions[key].body}</div></section>`).join('');
  container.querySelectorAll('[data-widget-move]').forEach(button => button.addEventListener('click', () => { const from = Number(button.dataset.widgetMove); const to = from + Number(button.dataset.direction); [order[from], order[to]] = [order[to], order[from]]; state.settings.widgetOrder = order; persist(); renderSidebarWidgets(); }));
  container.querySelectorAll('[data-widget-guild]').forEach(button => button.addEventListener('click', () => navigate(`guild/${button.dataset.widgetGuild}/public`)));
  container.querySelector('[data-widget-progress]')?.addEventListener('click', () => navigate('heat'));
}

function renderLiveMoments() {
  const container = document.querySelector('#liveMomentRows');
  if (!container) return;
  const live = state.topics.filter(topic => topic.state === 'live').slice(0, 3);
  container.innerHTML = live.length ? live.map(topic => {
    const remaining = Math.max(0, new Date(topic.endsAt).getTime() - Date.now());
    const hours = Math.ceil(remaining / 3_600_000);
    return `<button type="button" data-live-topic="${topic.id}">${topic.artworkUrl ? `<img src="${escapeHtml(topic.artworkUrl)}" alt="" />` : '<span>◉</span>'}<span><strong>${escapeHtml(topic.title)}</strong><small>${hours}h left</small></span><b>LIVE</b></button>`;
  }).join('') : '<p>Live Topics will appear here.</p>';
  container.querySelectorAll('[data-live-topic]').forEach(button => button.addEventListener('click', () => navigate(`topics/${button.dataset.liveTopic}`)));
}

function updateGuildChrome() {
  const guild = state.guilds.find(item => item.joined);
  const art = document.querySelector('#railGuildArt');
  const name = document.querySelector('#railGuildName');
  const description = document.querySelector('#railGuildDescription');
  const actions = document.querySelector('#railGuildActions');
  if (!guild) {
    art.innerHTML = '⚔'; art.style.backgroundImage = '';
    name.textContent = 'Find your people'; description.textContent = 'Join communities built around shared interests and stronger takes.';
    actions.innerHTML = '<button type="button" data-quick-guilds>View Guilds</button>';
    actions.querySelector('button').addEventListener('click', () => navigate('guilds'));
    return;
  }
  art.innerHTML = guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0).toUpperCase());
  name.textContent = guild.name; description.textContent = guild.tagline || guild.description || 'Your current guild.';
  actions.innerHTML = `<button type="button" data-guild-quick="feed">Feed</button><button type="button" data-guild-quick="public">Profile</button><button type="button" data-guild-quick="chat">GC</button>`;
  actions.querySelectorAll('[data-guild-quick]').forEach(button => button.addEventListener('click', () => navigate(`guild/${guild.id}/${button.dataset.guildQuick}`)));
}

async function hydrateSession() {
  try {
    const payload = await apiFetch('/api/auth/me');
    applySessionUser(payload.user);
  } catch (error) {
    // A temporary network/server failure is not proof that the user signed out.
    if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
      sessionUser = null;
      updateHeaderProfile();
    }
  }
}

function mapPost(post) {
  const id = String(post.id || post._id);
  return {
    id, databaseId: id,
    authorId: String(post.author?.id || post.author?._id || post.author || ''),
    authorHandle: post.author?.handle || '@member', authorName: post.author?.displayName || 'Callout member',
    authorAvatarUrl: post.author?.avatarUrl || '', authorAutomated: Boolean(post.author?.isAutomated), authorPersona: post.author?.automationPersona || '', text: String(post.content || ''), category: post.category, media: Array.isArray(post.media) ? post.media : [],
    poll: post.poll || null, topics: post.topics || [], contentWarning: post.contentWarning || '', embedUrl: post.embedUrl || '', externalEmbed: post.externalEmbed || null, reactionSet: post.reactionSet || 'classic', visibility: post.visibility || 'public',
    alrightVotes: Number(post.alrightVotes || 0), cringeVotes: Number(post.cringeVotes || 0), impressions: Number(post.impressions || 0),
    userVote: post.userVote || null, emojiReactions: post.emojiReactions || {}, commentCount: Number(post.commentCount || 0), comments: Array.isArray(post.comments) ? post.comments : [],
    ttsAudio: Array.isArray(post.ttsAudio) ? post.ttsAudio : [], viralVideo: post.viralVideo || { milestones: [100, 500, 1000], reached: [], next: null },
    createdAt: new Date(post.createdAt || Date.now()).getTime(), publishing: Boolean(post.publishing),
    anonymous: Boolean(post.anonymous), anonymousCode: post.anonymousCode || '', anonymousOwner: Boolean(post.anonymousOwner), anonymousRevealedAt: post.anonymousRevealedAt || null,
    lifecycle: post.lifecycle || { active: 'none' }, authorHeatTier: post.author?.heatTier || null, topic: post.topic || null
  };
}

async function hydratePosts() {
  try {
    const payload = await apiFetch('/api/posts', {}, false);
    state.posts = (payload.posts || []).map(mapPost);
    persist();
    renderRoute();
  } catch (error) { console.error('Unable to load posts:', error); }
}

async function hydrateApp() {
  await hydrateSession();
  await Promise.all([hydratePosts(), hydrateGuilds(), hydrateLeaderboard(), hydrateTrending(), hydrateIdeas(), hydrateBigPatch(), hydrateAccountData()]);
  if (currentRoute() === 'take') await hydrateTake(activeTake());
  if (currentRoute() === 'guild') await hydrateGuildDetail();
  if (currentRoute() === 'user') await hydratePublicProfile();
  if (currentRoute() === 'profile') await hydrateOwnProfile();
  if (currentRoute() === 'analytics') await hydrateAnalytics();
  if (currentRoute() === 'admin') await hydrateAdminControl();
  renderRoute();
}

async function hydrateBigPatch() {
  const requests = [
    apiFetch('/api/posts/anonymous', {}, false),
    apiFetch('/api/topics', {}, false),
    apiFetch('/api/battles', {}, false),
    apiFetch('/api/about', {}, false)
  ];
  const [anonymous, topics, battles, about] = await Promise.allSettled(requests);
  if (anonymous.status === 'fulfilled') state.anonymousPosts = (anonymous.value.posts || []).map(mapPost);
  if (topics.status === 'fulfilled') state.topics = topics.value.topics || [];
  if (battles.status === 'fulfilled') state.battles = battles.value.battles || [];
  if (about.status === 'fulfilled') state.about = about.value;
  renderLiveMoments();
}

async function hydrateGuilds() { try { state.guilds = (await apiFetch('/api/guilds', {}, false)).guilds || []; updateGuildChrome(); } catch (error) { console.error(error); } }
async function hydrateLeaderboard() {
  try {
    const period = state.settings.leaderboardPeriod || 'all';
    const [cringeSelected, basedSelected, cringeLifetime, basedLifetime] = await Promise.all([
      apiFetch(`/api/leaderboard?period=${encodeURIComponent(period)}&reaction=cringe`, {}, false),
      apiFetch(`/api/leaderboard?period=${encodeURIComponent(period)}&reaction=based`, {}, false),
      period === 'all' ? Promise.resolve(null) : apiFetch('/api/leaderboard?period=all&reaction=cringe', {}, false),
      period === 'all' ? Promise.resolve(null) : apiFetch('/api/leaderboard?period=all&reaction=based', {}, false)
    ]);
    state.leaderboard = cringeSelected.users || [];
    state.basedLeaderboard = basedSelected.users || [];
    state.lifetimeLeaderboard = cringeLifetime?.users || state.leaderboard;
    state.lifetimeBasedLeaderboard = basedLifetime?.users || state.basedLeaderboard;
    state.userStanding = sessionUser ? state.leaderboard.find(user => String(user.id) === String(sessionUser.id)) || null : null;
    updateAccountChrome();
  } catch (error) { console.error(error); }
}
async function hydrateTrending() { try { state.trendingPosts = ((await apiFetch('/api/posts/trending', {}, false)).posts || []).map(mapPost); } catch (error) { console.error(error); } }
async function hydrateIdeas() { try { state.ideas = (await apiFetch('/api/ideas', {}, false)).ideas || []; } catch (error) { console.error(error); } }
async function hydrateGuildDetail() {
  const id = decodeURIComponent(location.hash.split('/')[1] || '');
  if (!id) return;
  try {
    state.activeGuild = (await apiFetch(`/api/guilds/${id}`, {}, false)).guild;
    if (state.activeGuild.canViewContent && sessionUser) {
      const requests = [apiFetch(`/api/guilds/${id}/posts`), state.activeGuild.permissions?.chat ? apiFetch(`/api/guilds/${id}/messages`) : Promise.resolve({ messages: [] }), apiFetch(`/api/guilds/${id}/members`)];
      if (state.activeGuild.permissions?.viewAudit) requests.push(apiFetch(`/api/guilds/${id}/audit`));
      const [posts, messages, members, audit] = await Promise.all(requests);
      state.guildPosts = (posts.posts || []).map(mapPost); state.guildMessages = messages.messages || []; state.guildMembers = members.members || []; state.guildAudit = audit?.audit || [];
      if (location.hash.split('/')[2] === 'pinboard') {
        const board = await apiFetch(`/api/guilds/${id}/pinboard`);
        state.pinboard = board.board;
      }
    } else { state.guildPosts = []; state.guildMessages = []; }
  } catch (error) { state.activeGuild = null; showToast(error.message); }
}
async function hydratePublicProfile() {
  const id = decodeURIComponent(location.hash.split('/')[1] || '');
  if (!id) return;
  try { state.publicProfile = (await apiFetch(`/api/users/${id}`, {}, false)).user; } catch (error) { state.publicProfile = null; showToast(error.message); }
}
async function hydrateOwnProfile() {
  if (!sessionUser?.id) { state.ownProfileData = null; return; }
  try { state.ownProfileData = (await apiFetch(`/api/users/${sessionUser.id}`, {}, false)).user; } catch (error) { state.ownProfileData = null; console.error(error); }
}
async function hydrateAnalytics() {
  if (!sessionUser?.isAdmin) { state.analytics = null; state.analyticsError = ''; return; }
  try {
    state.analyticsError = '';
    const analytics = await apiFetch(`/api/analytics/summary?days=${state.analyticsDays}`);
    state.analytics = analytics.analytics;
  } catch (error) { state.analytics = null; state.analyticsError = error.message; }
}

async function hydrateAdminControl() {
  if (!sessionUser?.isAdmin) { state.botAutomation = null; state.adminBigPatch = { staff: [], audit: [], features: [] }; state.adminError = ''; return; }
  try {
    state.adminError = '';
    const [automation, staff, audit, features] = await Promise.all([apiFetch('/api/admin/bots'), apiFetch('/api/admin/staff'), apiFetch('/api/admin/audit'), apiFetch('/api/admin/features')]);
    state.botAutomation = automation;
    state.adminBigPatch = { staff: staff.staff || [], audit: audit.audit || [], features: features.features || [] };
  } catch (error) { state.adminError = error.message; }
}
async function hydrateAccountData() {
  if (!sessionUser) { state.savedPostIds = []; state.savedPosts = []; state.notifications = []; state.messages = []; state.friendships = []; return; }
  const [saved, notifications, messages, friends] = await Promise.allSettled([apiFetch('/api/saved'), apiFetch('/api/notifications'), apiFetch('/api/messages'), apiFetch('/api/friends')]);
  if (saved.status === 'fulfilled') { state.savedPostIds = (saved.value.savedPostIds || []).map(String); state.savedPosts = (saved.value.posts || []).map(mapPost); }
  if (notifications.status === 'fulfilled') state.notifications = notifications.value.notifications || [];
  if (messages.status === 'fulfilled') state.messages = messages.value.messages || [];
  if (friends.status === 'fulfilled') state.friendships = friends.value.friendships || [];
  try {
    const unread = state.notifications.filter(item => !item.read).length;
    const badge = document.querySelector('#notificationBadge'); badge.textContent = unread; badge.hidden = unread === 0;
  } catch (error) { console.error(error); }
}

async function hydrateSavedPosts() {
  if (!sessionUser) { state.savedPostIds = []; return; }
  try {
    const saved = await apiFetch('/api/saved');
    state.savedPostIds = (saved.savedPostIds || []).map(String); state.savedPosts = (saved.posts || []).map(mapPost); persist();
  } catch (error) { console.error('Unable to load saved posts:', error); }
}

function currentRoute() {
  const route = location.hash.replace('#', '').split('/')[0] || 'home';
  return routes.has(route) ? route : 'home';
}

function navigate(route) {
  location.hash = route;
  if (currentRoute() === route) renderRoute();
}

function currentUserId() {
  return sessionUser?.id || 'local-user';
}

function heatFrameClass(scoreOrTier = 0) {
  if (typeof scoreOrTier === 'object' && scoreOrTier?.className) return scoreOrTier.className;
  return `heat-${['fresh', 'mild', 'spicy', 'certified', 'firestarter', 'hall'][Math.max(0, heatMilestone(Number(scoreOrTier || 0)).level - 1)]}`;
}

function avatarMarkup(className = '') {
  const frame = heatFrameClass(state.profile.heatScore || 0);
  return state.profile.avatarUrl ? `<span class="avatar heat-frame ${className} ${frame}"><img src="${escapeHtml(state.profile.avatarUrl)}" alt="" /></span>` : `<span class="avatar heat-frame ${className} ${frame}">🦸🏻</span>`;
}

function postAvatarMarkup(post) {
  if (post.anonymous && !post.anonymousRevealedAt) return '<span class="avatar take-avatar anonymous-mask" aria-hidden="true">◒</span>';
  const frame = heatFrameClass(post.authorHeatTier || 0);
  if (post.authorAvatarUrl) return `<span class="avatar heat-frame ${frame} take-avatar"><img src="${escapeHtml(post.authorAvatarUrl)}" alt="" /></span>`;
  return `<span class="avatar heat-frame ${frame} take-avatar">${escapeHtml((post.authorName || 'C').charAt(0).toUpperCase())}</span>`;
}

function pageHeader(kicker, title, description, action = '') {
  return `<header class="page-heading">
    <div><span class="section-kicker">${kicker}</span><h1>${title}</h1><p>${description}</p></div>
    ${action}
  </header>`;
}

function adUnit(placement, className, format, label) {
  if (!placementAllowsAds(placement)) return '';
  const { client, slots } = adConfiguration();
  const slot = slots[placement] || '';
  return `<div class="ad-slot ${className}" data-ad-placement="${placement}"><ins class="adsbygoogle" data-ad-client="${escapeHtml(client)}" data-ad-slot="${escapeHtml(slot)}" data-ad-format="${format}" data-full-width-responsive="true"></ins><span class="ad-placeholder-copy">ADVERTISEMENT <small>${label}</small></span></div>`;
}

function adBanner() {
  return adUnit('header', 'ad-leaderboard', 'horizontal', 'Responsive banner');
}

function inFeedAd() {
  return adUnit('in-feed', 'ad-infeed', 'fluid', 'In-feed responsive unit').replace('data-ad-format="fluid"', 'data-ad-format="fluid" data-ad-layout-key="-gw-3+1f-3d+2z"');
}

function emptyState(icon, title, text, action = '') {
  return `<section class="empty-panel">
    <div class="empty-icon">${icon}</div>
    <h2>${title}</h2>
    <p>${text}</p>
    ${action}
  </section>`;
}

function calloutGlyph(kind, className = '') {
  const symbol = kind === 'based' ? 'i-based' : kind === 'personal' ? 'i-personal-heat' : 'i-cringe';
  return `<svg class="callout-glyph ${className}" aria-hidden="true"><use href="#${symbol}"></use></svg>`;
}

function postStateMarkup(post, detail = false) {
  const lifecycle = post.lifecycle || {};
  const active = lifecycle.active || 'none';
  if (active === 'none') return detail ? '<button class="post-history-link" type="button" data-post-history>History</button>' : '';
  const expanded = state.expandedPostState === post.id;
  const labels = { defense: 'Defense', redemption: 'Redemption' };
  const icons = { defense: '⬟', redemption: '✦' };
  let panel = '';
  if (expanded && active === 'defense') {
    const defense = lifecycle.defense || {};
    panel = `<div class="post-state-panel defense-panel"><header><span>⬟</span><div><strong>${defense.status === 'eligible' ? 'DEFENSE UNLOCKED' : 'THE DEFENSE'}</strong><small>Attached to this original Take</small></div><button type="button" data-close-post-state>×</button></header>${defense.status === 'submitted' ? `<p>${escapeHtml(defense.content || '')}</p>${post.authorId === currentUserId() ? '<button type="button" data-open-redemption>Open Redemption</button>' : ''}` : post.authorId === currentUserId() ? `<form data-defense-form="${post.id}"><textarea name="content" maxlength="10000" minlength="20" required placeholder="Make your case…"></textarea><button type="submit">Publish Defense</button></form>` : '<p>The author can now defend this Hot Take.</p>'}</div>`;
  } else if (expanded && active === 'redemption') {
    const redemption = lifecycle.redemption || {};
    const votes = redemption.votes || [];
    panel = `<div class="post-state-panel redemption-panel"><header><span>✦</span><div><strong>REDEMPTION</strong><small>${redemption.status === 'open' ? `Closes ${timeLabel(new Date(redemption.closesAt).getTime())}` : `${String(redemption.status).toUpperCase()} STATUS`}</small></div><button type="button" data-close-post-state>×</button></header>${redemption.status === 'open' ? `<p>Did the Defense redeem this Take?</p><div class="redemption-actions"><button type="button" data-redemption-vote="redeemed" data-redemption-post="${post.id}">Redeemed</button><button type="button" data-redemption-vote="still_hot" data-redemption-post="${post.id}">Still Hot</button></div><small>${votes.length} votes</small>` : `<p>This Take earned ${escapeHtml(redemption.status)} Redemption status.</p>`}</div>`;
  }
  if (!labels[active]) return '';
  return `<div class="post-state-anchor state-${active}"><button class="post-state-emblem" type="button" data-post-state="${post.id}" aria-expanded="${expanded}" title="${labels[active]}"><span>${icons[active]}</span><small>${labels[active]}</small></button>${panel}${detail ? '<button class="post-history-link" type="button" data-post-history>History</button>' : ''}</div>`;
}

function postTemplate(post, detail = false) {
  const total = post.alrightVotes + post.cringeVotes;
  const alrightPercent = total ? Math.round((post.alrightVotes / total) * 100) : 50;
  const cringePercent = 100 - alrightPercent;
  const isSaved = state.savedPostIds.includes(post.id);
  const commentCount = post.comments?.length ? countComments(post.comments) : Number(post.commentCount || 0);
  return `<article class="take-card ${detail ? 'take-card-detail' : 'take-card-feed'} ${post.anonymous && !post.anonymousRevealedAt ? 'anonymous-take' : ''} ${post.publishing ? 'take-publishing' : ''}" data-post-id="${post.id}">
    ${post.publishing ? '<div class="take-publishing-status"><span></span><strong>Publishing</strong><small>Your take is being securely saved in the background.</small></div>' : ''}
    <div class="take-top">
      ${postAvatarMarkup(post)}
      <div class="take-content" ${detail ? '' : `data-open-take="${post.id}" role="link" tabindex="0" aria-label="Open take: ${escapeHtml(post.text)}"`}>
        <div class="take-byline"><strong>${escapeHtml(post.anonymous && !post.anonymousRevealedAt ? 'Anonymous' : post.authorHandle || '@member')}</strong>${post.anonymous && !post.anonymousRevealedAt ? `<span class="anonymous-label">${escapeHtml(post.anonymousCode || post.authorName || 'SIGNAL')}</span>` : ''}${post.authorAutomated ? '<span class="automation-label" title="This account is operated automatically by Callout">AUTOMATED</span>' : ''}<small>${timeLabel(post.createdAt || Date.now())} in ${escapeHtml(post.category)}</small></div>
        ${post.contentWarning ? `<details class="content-warning"><summary>Content warning: ${escapeHtml(post.contentWarning)}</summary><h2>${formatPostContent(post.text)}</h2></details>` : `<h2>${formatPostContent(post.text)}</h2>`}
        ${post.topics?.length ? `<div class="post-topics">${post.topics.map(topic => `<span>${escapeHtml(topic)}</span>`).join('')}</div>` : ''}
      </div>
      <button class="icon-button save-button ${isSaved ? 'saved' : ''}" type="button" data-save-post="${post.id}" aria-label="${isSaved ? 'Remove from saved' : 'Save take'}"><svg><use href="#i-bookmark"></use></svg></button>
      <button class="icon-button" type="button" data-post-menu="${post.id}" aria-label="Post options"><svg><use href="#i-more"></use></svg></button>
      ${post.anonymousOwner && !post.anonymousRevealedAt ? `<button class="reveal-identity-button" type="button" data-reveal-post="${post.id}">Reveal identity</button>` : ''}
    </div>
    ${postStateMarkup(post, detail)}
    ${postMediaMarkup(post.media)}
    ${post.poll ? pollMarkup(post) : ''}
    ${post.externalEmbed ? externalEmbedMarkup(post.externalEmbed) : post.embedUrl ? `<a class="link-embed" href="${escapeHtml(post.embedUrl)}" target="_blank" rel="noopener noreferrer"><strong>Open attached link</strong><small>${escapeHtml(new URL(post.embedUrl).hostname)}</small></a>` : ''}
    <div class="vote-row">
      <button class="vote-button alright based ${post.userVote === 'alright' ? 'selected' : ''}" type="button" data-vote="alright"><span class="vote-face">${calloutGlyph('based')}</span><strong>BASED</strong></button>
      <b class="percent alright-percent">${alrightPercent}%</b>
      <div class="vote-progress" style="--alright:${alrightPercent}%" role="progressbar" aria-label="${alrightPercent}% Based, ${cringePercent}% Hot Take" aria-valuenow="${alrightPercent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-divider"></div>
      </div>
      <b class="percent cringe-percent">${cringePercent}%</b>
      <button class="vote-button cringe hot-take ${post.userVote === 'cringe' ? 'selected' : ''}" type="button" data-vote="cringe"><span class="vote-face">${calloutGlyph('cringe')}</span><strong>HOT TAKE</strong></button>
    </div>
    ${postEmojiPicker(post)}
    <div class="take-footer"><span>${total} ${total === 1 ? 'vote' : 'votes'}　•　${commentCount} ${commentCount === 1 ? 'Take' : 'Takes'}</span>${detail ? '' : `<button class="comment-link" type="button" data-open-take="${post.id}">Open take →</button>`}</div>
  </article>`;
}

function formatPostContent(value = '') {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler-text" tabindex="0">$1</span>').replace(/\n/g, '<br>');
}

function pollMarkup(post) {
  const total = post.poll.options.reduce((sum, option) => sum + Number(option.votes || 0), 0);
  return `<section class="post-poll"><strong>${escapeHtml(post.poll.question || 'Poll')}</strong>${post.poll.options.map(option => { const percent = total ? Math.round(Number(option.votes || 0) / total * 100) : 0; return `<button type="button" data-poll-post="${post.id}" data-poll-option="${option.id}" class="${option.voted ? 'selected' : ''}" style="--poll:${percent}%"><span>${escapeHtml(option.text)}</span><b>${percent}%</b></button>`; }).join('')}<small>${total} vote${total === 1 ? '' : 's'}</small></section>`;
}

function postMediaMarkup(media = []) {
  if (!media.length) return '';
  const items = media.map(item => item.type === 'video'
    ? `<video controls playsinline preload="metadata" src="${escapeHtml(item.url)}" aria-label="Attached short video"></video>`
    : `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt || 'Attached media')}" loading="lazy" />`).join('');
  return `<div class="take-media media-count-${media.length}">${items}</div>`;
}

function externalEmbedMarkup(embed, preview = false) {
  if (!embed?.url) return '';
  const platformNames = { x: 'X', reddit: 'Reddit', bluesky: 'Bluesky' };
  const marks = { x: '𝕏', reddit: '●', bluesky: '🦋' };
  const mediaItems = Array.isArray(embed.mediaItems) && embed.mediaItems.length
    ? embed.mediaItems.slice(0, 4)
    : embed.mediaUrl ? [{ type: embed.mediaType || 'image', url: embed.mediaUrl, thumbnailUrl: '', alt: '' }] : [];
  const media = mediaItems.length ? `<div class="external-media-grid external-media-count-${mediaItems.length}">${mediaItems.map(item =>
    item.type === 'video' || /\.(mp4|webm)(?:\?|$)/i.test(item.url)
      ? `<video class="external-media" src="${escapeHtml(item.url)}" ${item.thumbnailUrl ? `poster="${escapeHtml(item.thumbnailUrl)}"` : ''} controls muted playsinline preload="metadata"></video>`
      : `<img class="external-media" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt || 'Media from the attached post')}" loading="lazy" referrerpolicy="no-referrer" />`
  ).join('')}</div>` : '';
  return `<article class="external-post external-${escapeHtml(embed.platform)} ${preview ? 'external-preview' : ''}">
    <header>${embed.authorAvatar ? `<img src="${escapeHtml(embed.authorAvatar)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : `<i>${marks[embed.platform] || '↗'}</i>`}<div><strong>${escapeHtml(embed.authorName || embed.authorHandle || platformNames[embed.platform])}</strong><small>${escapeHtml(embed.authorHandle || embed.community || '')}</small></div><a href="${escapeHtml(embed.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open original post">↗</a></header>
    ${embed.community ? `<b class="external-community">${escapeHtml(embed.community)}</b>` : ''}<p>${escapeHtml(embed.text || 'Open the original post to view this attachment.')}</p>
    ${media}
    <footer><a href="${escapeHtml(embed.url)}" target="_blank" rel="noopener noreferrer"><span>${marks[embed.platform] || '↗'}</span> Attached from ${platformNames[embed.platform] || 'source'}</a></footer>
  </article>`;
}

function countComments(comments = []) {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);
}

function timeLabel(timestamp) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function canDeleteComment(comment) {
  if (!sessionUser) return false;
  const authorId = typeof comment.author === 'object' ? comment.author?.id : '';
  const canModerate = ['owner', 'admin', 'moderator'].includes(sessionUser.staffRole);
  return Boolean(canModerate || (authorId && String(authorId) === String(sessionUser.id)));
}

function commentNode(comment, depth = 0) {
  const author = comment.author || {};
  const authorName = typeof author === 'string' ? author : (author.handle || author.displayName || '@member');
  const avatar = typeof author === 'object' && author.avatarUrl ? `<img src="${escapeHtml(author.avatarUrl)}" alt="" />` : escapeHtml(authorName.charAt(0).toUpperCase());
  return `<article class="reddit-comment" style="--depth:${Math.min(depth, 5)}" data-comment-id="${comment.id}">
    <div class="comment-rail"><span class="avatar comment-avatar heat-frame ${heatFrameClass(author.heatTier || author.cringeScore || 0)}">${avatar}</span><i></i></div>
    <div class="comment-content"><div class="comment-author"><strong>${escapeHtml(authorName)}</strong>${typeof author === 'object' && author.isAutomated ? '<span class="automation-label">AUTOMATED</span>' : ''}<span>•</span><time>${timeLabel(comment.createdAt)}</time></div>
      <p>${escapeHtml(comment.text)}</p>
      ${comment.gifUrl ? `<img class="comment-gif" src="${escapeHtml(comment.gifUrl)}" alt="GIF attached to Take" loading="lazy" />` : ''}
      <div class="reddit-actions"><button type="button" data-upvote-comment="${comment.id}" class="${comment.upvoted ? 'active' : ''}">↑ ${comment.votes || 0}</button><button type="button" data-reply-comment="${comment.id}">↩ Reply</button>${canDeleteComment(comment) ? `<button class="comment-more" type="button" data-comment-menu="${comment.id}" aria-label="Take options">•••</button>` : ''}</div>
      <div class="reply-slot" id="reply-${comment.id}" hidden></div>
      ${(comment.replies || []).map(reply => commentNode(reply, depth + 1)).join('')}
    </div>
  </article>`;
}

function emptyThreadPreview() {
  return `<div class="empty-thread"><h3>No Takes yet</h3><p>Start the discussion. Replies will stack below their parent Take with a visible thread rail.</p>
    <div class="thread-blueprint" aria-label="Nested comment layout preview"><div><span></span><i></i><i></i></div><div class="blueprint-reply"><span></span><i></i></div></div>
  </div>`;
}

function commentThreadDetail(post) {
  const comments = post.comments || [];
  const hasTakes = comments.length > 0;
  return `<section class="reddit-thread ${hasTakes ? 'has-comments' : 'is-empty'}">
    ${hasTakes ? `<div class="comment-thread-tools"><span><strong>Takes</strong><small>${countComments(comments)}</small></span><button type="button" data-expand-comment>＋ Add a Take</button></div>` : `<div class="comment-head"><div><span class="section-kicker">DISCUSSION</span><h2>Takes</h2></div><span class="comment-count">0 Takes</span></div>`}
    <form class="comment-composer" id="commentForm" ${hasTakes ? 'hidden' : ''}><span class="avatar comment-avatar">C</span><div class="comment-entry"><label class="sr-only" for="commentText">Add a Take</label><textarea id="commentText" name="comment" required maxlength="500" placeholder="Add your Take..."></textarea><span class="comment-tools"><button type="button" data-comment-emoji="🔥">🔥</button><button type="button" data-comment-emoji="😂">😂</button><button type="button" data-comment-emoji="💀">💀</button><label class="comment-gif-picker">GIF file<input type="file" name="gifFile" accept="image/gif" /></label><input type="url" name="gifUrl" aria-label="GIF URL" placeholder="or HTTPS GIF URL" /></span></div><button type="submit">Post Take</button></form>
    <div class="comment-stack">${comments.length ? comments.map(comment => commentNode(comment)).join('') : emptyThreadPreview()}</div>
  </section>`;
}

function takeDetailView() {
  const id = decodeURIComponent(location.hash.split('/')[1] || '');
  const post = findPostById(id);
  if (!post) return `${pageHeader('TAKE', 'Take not found', 'This take may have been removed.')}<button class="quiet-action" type="button" data-back-feed>← Back to feed</button>`;
  return `<div class="detail-back-row"><button type="button" data-back-feed>← Back to feed</button><span>TAKE DETAIL</span></div>${postTemplate(post, true)}${commentThreadDetail(post)}`;
}

function feedMarkup(posts) {
  return `<section class="take-list">${posts.map((post, index) => `${postTemplate(post)}${index === 2 || index === 8 ? inFeedAd() : ''}`).join('')}</section>`;
}

function reactionTone(index) {
  return `tone-${index % 10}`;
}

function calloutEmojiFace(reaction, index, className = '') {
  return `<span class="callout-emoji ${reactionTone(index)} ${className}">${reaction.face}</span>`;
}

function postEmojiPicker(post) {
  const activeCount = postReactions.filter(reaction => post.emojiReactions?.[reaction.key]?.reacted).length;
  const totalReactions = postReactions.reduce((sum, reaction) => sum + Number(post.emojiReactions?.[reaction.key]?.count || 0), 0);
  const visibleReactions = postReactions.map((reaction, index) => ({ reaction, index, value: post.emojiReactions?.[reaction.key] || {} })).filter(item => Number(item.value.count || 0) > 0);
  return `<div class="post-emoji-reactions" aria-label="React to this post">
    <details class="emoji-picker">
      <summary aria-label="Open Callout emoji reactions">${calloutEmojiFace({ face: '☻' }, 1, 'emoji-trigger-face')}<i aria-hidden="true">⌄</i></summary>
      <div class="emoji-menu" role="menu" aria-label="Callout reactions">
        <header><strong>Callout emojis</strong><small>${activeCount}/5 picked${totalReactions ? ` · ${totalReactions} total` : ''}</small></header>
        <div>${postReactions.map((reaction, index) => { const value = post.emojiReactions?.[reaction.key] || {}; const locked = activeCount >= 5 && !value.reacted; return `<button type="button" data-post-reaction="${reaction.key}" aria-label="${reaction.label}" title="${reaction.label}" class="emoji-reaction emoji-${reaction.key} ${reactionTone(index)} ${value.reacted ? 'reacted' : ''}" ${locked ? 'disabled' : ''}>${calloutEmojiFace(reaction, index)}<strong>${escapeHtml(reaction.label)}</strong><b>${Number(value.count || 0)}</b></button>`; }).join('')}</div>
      </div>
    </details>
    ${visibleReactions.length ? `<div class="emoji-selected-strip" aria-label="Selected reactions">${visibleReactions.map(({ reaction, index, value }) => `<button type="button" data-post-reaction="${reaction.key}" class="emoji-selected-pill ${reactionTone(index)} ${value.reacted ? 'reacted' : ''}" aria-label="${reaction.label}">${calloutEmojiFace(reaction, index)}<b>${Number(value.count || 0)}</b></button>`).join('')}</div>` : ''}
  </div>`;
}

function homeView() {
  const rawSource = state.activeFeedTab === 'Anonymous' ? state.anonymousPosts : state.activeFeedTab === 'Trending' ? state.trendingPosts : state.posts;
  const source = sessionUser ? rawSource : rawSource.filter(post => !post.authorAutomated);
  const guestDiscovery = `<section class="guest-discovery"><span class="section-kicker">WELCOME TO CALLOUT</span><h2>Original discussions are building here.</h2><p>Callout is an independent platform for publishing a focused opinion, voting Based or Hot Take, and explaining the result through public Takes. Automated accounts are excluded from the logged-out public feed so the discussions shown here represent real members.</p><div><a href="/learn">Browse the Learning Centre</a><a href="/how-callout-works">See how Callout works</a><a href="#auth" data-route="auth">Create an account</a></div></section>`;
  const posts = state.activeFeedTab === 'Following'
    ? emptyState('◎', 'No followed accounts yet', 'Posts from people you follow will appear here.')
    : source.length
    ? feedMarkup(source)
    : sessionUser
    ? emptyState('✦', 'No takes to show yet', 'Your feed is ready for real community posts. Create the first take to see voting come alive.', '<button class="primary-action" type="button" data-open-composer>Post your first take</button>')
    : guestDiscovery;

  return `${adBanner('top-leaderboard')}
    <div class="feed-tabs" role="tablist" aria-label="Feed views">
      ${['For You','Following','Anonymous','Trending'].map(label => `<button class="tab ${state.activeFeedTab === label ? 'active' : ''}" type="button" data-feed-tab="${label}">${label}</button>`).join('')}
    </div>
    <div class="category-row" aria-label="Filter by category">
      <button class="chip active" type="button" data-category="All">All</button><button class="chip" type="button" data-category="Entertainment">Entertainment</button><button class="chip" type="button" data-category="Music">Music</button><button class="chip" type="button" data-category="Movies">Movies</button><button class="chip" type="button" data-category="Games">Games</button><button class="chip" type="button" data-category="Life">Life</button>
    </div>
    <div id="feedResults">${posts}</div>`;
}

function homeExperienceView() {
  return homeView();
}

function trendingView() {
  const posts = sessionUser ? state.trendingPosts : state.trendingPosts.filter(post => !post.authorAutomated);
  const interactions = posts.reduce((sum, post) => sum + post.alrightVotes + post.cringeVotes + Number(post.commentCount || 0), 0);
  const closeCalls = posts.filter(post => { const total = post.alrightVotes + post.cringeVotes; return total && Math.abs((post.alrightVotes / total) - .5) <= .1; }).length;
  return `<div class="leaderboard-compact-head compact-page-head"><strong>TRENDING</strong><span><i></i> Updated live</span></div>
    ${adBanner('trending-banner')}
    <div class="segmented-control"><button class="active" type="button">Takes</button><button type="button">Topics</button><button type="button">Guilds</button></div>
    <section class="trend-stats"><div><span>LIVE SIGNAL</span><strong>${posts.length}</strong><small>Active debates</small></div><div><span>MOMENTUM</span><strong>${interactions}</strong><small>Total interactions</small></div><div><span>CLOSE CALLS</span><strong>${closeCalls}</strong><small>Near 50/50</small></div></section>
    ${posts.length ? feedMarkup(posts) : emptyState('↗', 'Nothing is trending yet', 'The first real post will appear here. Ranking is based on views and interactions.')}`;
}

function guildCard(guild) {
  return `<article class="created-guild"><div class="guild-monogram">${guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0).toUpperCase())}</div><div><span class="section-kicker">${guild.joined ? 'YOUR GUILD' : 'PUBLIC PROFILE'}</span><h2>${escapeHtml(guild.name)}</h2><p>${escapeHtml(guild.tagline || guild.description)}</p><small>${Number(guild.memberCount || 0)} members</small></div><button type="button" data-open-guild="${guild.id}">Open</button></article>`;
}

function guildsView() {
  const content = state.guilds.length
    ? `<section class="guild-grid">${state.guilds.map(guildCard).join('')}</section>`
    : emptyState('⚔', 'No guilds available yet', 'Public guilds will appear here once they are created. Start a focused community without filling the directory with demo data.', '<button class="primary-action" type="button" data-create-guild>Create the first guild</button>');
  return `<div class="leaderboard-compact-head compact-page-head"><strong>GUILDS</strong><button class="compact-page-action" type="button" data-create-guild>＋ Create Guild</button></div>
    <div class="directory-tools"><label><svg><use href="#i-search"></use></svg><input type="search" placeholder="Search guilds" aria-label="Search guilds" /></label><button class="filter-button" type="button">All guilds⌄</button></div>
    ${content}`;
}

function ideasView() {
  const moods = { electric: ['ELECTRIC', '#55df50'], chaotic: ['CHAOTIC', '#ff5938'], soft: ['SOFT', '#ffcfdf'], dark: ['DARK', '#292e37'], wild: ['WILD', '#9a63ed'] };
  const visible = state.ideaMood === 'all' ? state.ideas : state.ideas.filter(idea => idea.mood === state.ideaMood);
  return `<section class="idea-archive-hero"><span class="idea-eye">◉</span><div><span class="section-kicker">NO NAMES. JUST SIGNALS.</span><h1>THE UNSAID<br>IDEA ARCHIVE</h1><p>Leave the feature you wish existed. No profile, no handle, no credit. Just a coded fragment for Callout’s future.</p></div><button type="button" data-open-idea-form>SUBMIT AN IDEA ↗</button></section>
    <nav class="idea-moods"><button class="${state.ideaMood === 'all' ? 'active' : ''}" data-idea-mood="all">ALL SIGNALS</button>${Object.entries(moods).map(([key,[label]]) => `<button class="${state.ideaMood === key ? 'active' : ''}" data-idea-mood="${key}">${label}</button>`).join('')}</nav>
    <section class="idea-wall">${visible.length ? visible.map((idea,index) => `<article class="idea-card idea-${escapeHtml(idea.mood)}" style="--tilt:${index % 3 === 0 ? '-1.2deg' : index % 3 === 1 ? '.8deg' : '-.3deg'}"><header><span>TRANSMISSION ${escapeHtml(idea.code)}</span><i></i></header><p>${escapeHtml(idea.text)}</p><footer><span>FROM: UNKNOWN</span><small>${new Date(idea.createdAt).toLocaleDateString()}</small></footer></article>`).join('') : `<div class="idea-empty"><span>?</span><h2>Nothing has surfaced yet.</h2><p>The first anonymous signal could be yours.</p></div>`}</section>`;
}

function openIdeaSubmission() {
  showActionDialog(actionDialogShell('ANONYMOUS TRANSMISSION', 'Leave no name behind', `<form id="ideaSubmissionForm" class="idea-submit-form"><p>Your account identity is not attached to this submission. Avoid names or sensitive personal information.</p><label>The feature you want<textarea name="text" minlength="8" maxlength="400" required placeholder="I wish Callout could..."></textarea></label><fieldset><legend>Choose its signal</legend>${[['electric','#55df50'],['chaotic','#ff5938'],['soft','#ffcfdf'],['dark','#292e37'],['wild','#9a63ed']].map(([mood,color]) => `<label style="--mood:${color}"><input type="radio" name="mood" value="${mood}" ${mood === 'electric' ? 'checked' : ''}><span>${mood}</span></label>`).join('')}</fieldset><button class="primary-action" type="submit">Send into the archive</button></form>`));
  document.querySelector('#ideaSubmissionForm').addEventListener('submit', submitFeatureIdea);
}

async function submitFeatureIdea(event) {
  event.preventDefault(); const form = event.currentTarget; const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true; submit.textContent = 'Transmitting…';
  try { await apiFetch('/api/ideas', { method: 'POST', body: JSON.stringify({ text: sanitizeInput(form.elements.text.value), mood: form.elements.mood.value }) }, false); await hydrateIdeas(); closeActionDialog(); renderRoute(); showToast('Your anonymous signal entered the archive.'); }
  catch (error) { submit.disabled = false; submit.textContent = 'Send into the archive'; showToast(error.message); }
}

function rankingsExperienceView() {
  const personal = heatMilestone(Number(state.profile.heatScore || 0));
  const personalView = sessionUser ? `<section class="heat-ranking-bridge" style="--heat-accent:${personal.color}"><span class="heat-tier-emblem">${calloutGlyph('personal')}</span><div><span class="section-kicker">YOUR HEAT LEVEL</span><h2>${escapeHtml(personal.name)}</h2><p>Level ${personal.level} · ${Number(state.profile.heatScore || 0).toLocaleString()} Heat · ${Number(state.profile.heatStreak?.current || 0)} day streak</p><div class="personal-level-progress"><span style="width:${personal.progress}%"></span></div></div><button class="primary-action" type="button" data-open-heat>Open Heat dashboard</button></section>` : emptyState(calloutGlyph('personal'), 'Sign in to see your Heat Level', 'Your Heat Level and activity streak will appear here.', '<button class="primary-action" type="button" data-go-auth>Sign in</button>');
  const mode = ['based', 'cringe', 'personal'].includes(state.leaderboardView) ? state.leaderboardView : 'based';
  return `<div class="leaderboard-compact-head"><strong>CALLOUT RANKINGS</strong><span><i></i> Updated live</span></div>
    <nav class="ranking-view-tabs leaderboard-switcher"><button type="button" data-ranking-view="based" class="${mode === 'based' ? 'active' : ''}">${calloutGlyph('based')}<span>Most Based</span></button><button type="button" data-ranking-view="cringe" class="${mode === 'cringe' ? 'active' : ''}">${calloutGlyph('cringe')}<span>Hottest Takes</span></button><button type="button" data-ranking-view="personal" class="${mode === 'personal' ? 'active' : ''}">${calloutGlyph('personal')}<span>Your Heat Level</span></button></nav>
    ${mode === 'personal' ? personalView : leaderboardExperience(mode)}`;
}

function leaderboardExperience(kind) {
  const isBased = kind === 'based';
  const users = isBased ? state.basedLeaderboard : state.leaderboard;
  const scoreKey = isBased ? 'basedScore' : 'cringeScore';
  const title = isBased ? 'Most Based' : 'Hottest Takes';
  const subtitle = isBased ? 'The clearest voices. The strongest calls. The takes the crowd backed.' : 'The takes that raised the temperature and set the whole timeline talking.';
  const top = users.slice(0, 3);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
  const avatar = user => user.avatarUrl ? `<span class="avatar"><img src="${escapeHtml(user.avatarUrl)}" alt="" /></span>` : `<span class="avatar">${escapeHtml((user.displayName || 'C').charAt(0))}</span>`;
  const podium = podiumOrder.map(user => `<button type="button" data-leader-user="${user.id}" class="leader-podium-place place-${user.rank}"><span class="podium-rank">#${user.rank}</span>${avatar(user)}<strong>${escapeHtml(user.displayName)}</strong><small class="callout-rank-badge">${calloutGlyph(kind)} ${escapeHtml(user.badge?.name || 'New contender')}</small><b>${Number(user[scoreKey] || 0).toLocaleString()} ${isBased ? 'Based' : 'Heat'}</b></button>`).join('');
  const rows = users.slice(3).map(user => `<button type="button" data-leader-user="${user.id}" class="ranking-row premium-row ${String(user.id) === String(sessionUser?.id) ? 'is-you' : ''}"><strong>#${user.rank}</strong><span class="ranking-user">${avatar(user)}<span><b>${escapeHtml(user.displayName)}${String(user.id) === String(sessionUser?.id) ? ' (You)' : ''}</b><small>${escapeHtml(user.handle || '')}</small></span></span><span class="rank-trend stable">— STABLE</span><b>${Number(user[scoreKey] || 0).toLocaleString()}</b><small class="callout-rank-badge">${calloutGlyph(kind)} ${escapeHtml(user.badge?.name || 'New contender')}</small></button>`).join('');
  const totalVotes = users.reduce((sum, user) => sum + Number(user[scoreKey] || 0), 0);
  return `<section class="leaderboard-experience leaderboard-${kind}">
    <header class="leaderboard-hero"><div><span class="section-kicker">${isBased ? 'THE HONOUR ROLL' : 'THE CHAOS ARCHIVE'}</span><h2>${title}</h2><p>${subtitle}</p></div><div class="leaderboard-live"><i></i> LIVE RANKING</div></header>
    <div class="leaderboard-stat-strip"><span><small>RANKED VOICES</small><strong>${users.length}</strong></span><span><small>${isBased ? 'BASED CALLS' : 'HEAT CALLS'}</small><strong>${totalVotes.toLocaleString()}</strong></span><span><small>WINDOW</small><strong>${state.settings.leaderboardPeriod === 'all' ? 'ALL TIME' : state.settings.leaderboardPeriod.toUpperCase()}</strong></span></div>
    ${podium ? `<div class="leader-podium">${podium}</div>` : '<div class="ranking-empty"><h2>No rankings yet</h2><p>The first eligible reaction will open this leaderboard.</p></div>'}
    ${rows ? `<section class="ranking-card premium-ranking"><div class="ranking-head"><span>RANK</span><span>VOICE</span><span>TREND</span><span>SCORE</span><span>STATUS</span></div>${rows}</section>` : ''}
    <aside class="leaderboard-rule"><strong>${isBased ? 'How prestige is earned' : 'How the heat is counted'}</strong><p>One valid ${isBased ? 'Based' : 'Hot Take'} reaction from another account equals one point. Self-votes never count. Filters update the full ranking and the right-rail preview together.</p></aside>
  </section>`;
}

function heatActivityGrid(streak = {}, days = 84) {
  const active = new Set(streak.activeDates || []);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const cells = [];
  let consecutive = 0;
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * 86400000);
    const key = date.toISOString().slice(0, 10);
    consecutive = active.has(key) ? consecutive + 1 : 0;
    const intensity = consecutive >= 6 ? 3 : consecutive >= 3 ? 2 : consecutive ? 1 : 0;
    cells.push(`<i class="heat-day intensity-${intensity}" title="${key}${intensity ? ' · Active' : ''}" aria-label="${key}${intensity ? ', active' : ', quiet'}"></i>`);
  }
  return `<div class="heat-activity-grid" role="img" aria-label="Heat activity for the last ${days} days">${cells.join('')}</div>`;
}

function heatWeekStrip(streak = {}) {
  const active = new Set(streak.activeDates || []);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const monday = new Date(today.getTime() - mondayOffset * 86400000);
  const names = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return `<div class="heat-week-strip" aria-label="This week’s Heat activity">${names.map((name, index) => {
    const date = new Date(monday.getTime() + index * 86400000);
    const key = date.toISOString().slice(0, 10);
    const complete = active.has(key);
    const future = date > today;
    return `<span class="${complete ? 'complete' : future ? 'future' : ''}"><b>${name}</b><i aria-label="${key}${complete ? ', active' : ', inactive'}">${complete ? '✓' : ''}</i></span>`;
  }).join('')}</div>`;
}

function heatYearActivity(streak = {}) {
  const active = new Set(streak.activeDates || []);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const year = today.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const leading = (start.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: leading }, () => '<i class="heat-year-spacer" aria-hidden="true"></i>');
  let consecutive = 0;
  for (let timestamp = start.getTime(); timestamp <= end.getTime(); timestamp += 86400000) {
    const date = new Date(timestamp);
    const key = date.toISOString().slice(0, 10);
    const isActive = active.has(key);
    const isFuture = date > today;
    consecutive = isActive ? consecutive + 1 : 0;
    const intensity = consecutive >= 6 ? 3 : consecutive >= 3 ? 2 : consecutive ? 1 : 0;
    cells.push(`<i class="heat-day intensity-${intensity}${isFuture ? ' future' : ''}" title="${key}${isActive ? ' · Active' : ''}" aria-label="${key}${isActive ? ', active' : isFuture ? ', upcoming' : ', quiet'}"></i>`);
  }
  const activeDays = [...active].filter(key => key.startsWith(`${year}-`)).length;
  return { activeDays, markup: `<div class="heat-year-scroll"><div class="heat-months">${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map(month => `<span>${month}</span>`).join('')}</div><div class="heat-year-body"><div class="heat-weekdays">${['MON','TUE','WED','THU','FRI','SAT','SUN'].map(day => `<span>${day}</span>`).join('')}</div><div class="heat-year-cells" role="img" aria-label="${year} Heat activity">${cells.join('')}</div></div></div>` };
}

function heatLevelView() {
  const score = Number(state.profile.heatScore || 0);
  const current = heatMilestone(score);
  const streak = state.profile.heatStreak || {};
  const yearActivity = heatYearActivity(streak);
  return `${pageHeader('YOUR HEAT', 'Heat Level', 'One clear measure of meaningful participation across Callout.')}
    <section class="heat-level-hero" style="--heat-accent:${current.color}">
      <div class="heat-level-identity"><span class="heat-tier-emblem">${calloutGlyph('personal')}</span><div><span class="section-kicker">YOUR HEAT LEVEL</span><h2>${escapeHtml(current.name)}</h2><p>Level ${current.level} · <strong>${score.toLocaleString()} Heat</strong></p></div></div>
      <div class="heat-level-progress"><header><strong>${current.level === 6 ? 'Hall of Heat reached' : `Progress to ${escapeHtml(current.levels[current.level]?.name || 'next level')}`}</strong><span>${current.level === 6 ? 'MAX' : `${score.toLocaleString()} / ${current.next.toLocaleString()}`}</span></header><div><span style="width:${current.progress}%"></span></div><small>${current.level === 6 ? 'You have reached Callout’s highest Heat tier.' : `${current.remaining.toLocaleString()} Heat remaining`}</small></div>
      <div class="heat-avatar-orbit"><span class="avatar heat-frame ${heatFrameClass(score)}">${state.profile.avatarUrl ? `<img src="${escapeHtml(state.profile.avatarUrl)}" alt="" />` : escapeHtml((state.profile.displayName || 'C').charAt(0))}</span><b>LV ${current.level}</b></div>
    </section>
    <section class="heat-tier-grid">${current.levels.map(level => `<article class="${current.level >= level.level ? 'unlocked' : 'locked'}" style="--level:${level.color}"><span>${calloutGlyph('personal')}</span><small>LEVEL ${level.level}</small><strong>${escapeHtml(level.name)}</strong><p>${level.threshold.toLocaleString()}+ Heat</p><b>${current.level >= level.level ? 'Unlocked' : 'Locked'}</b></article>`).join('')}</section>
    <section class="heat-streak-dashboard">
      <header class="heat-streak-hero"><span class="avatar heat-frame ${heatFrameClass(score)}">${state.profile.avatarUrl ? `<img src="${escapeHtml(state.profile.avatarUrl)}" alt="" />` : escapeHtml((state.profile.displayName || 'C').charAt(0))}</span><span class="heat-streak-flame">♨</span><div><h2>${Number(streak.current || 0)} DAY HEAT STREAK</h2><p>Keep showing up. Keep the conversation moving.</p></div>${heatWeekStrip(streak)}</header>
      <section class="heat-year-card"><header><strong>YOUR HEAT ACTIVITY</strong><span>${new Date().getUTCFullYear()} · YEAR TO DATE</span></header>${yearActivity.markup}<div class="heat-year-legend"><span><i></i>Quiet</span><span><i></i>Active</span><span><i></i>Heating up</span><span><i></i>On fire</span></div></section>
      <aside class="heat-streak-stats"><article><span>▣</span><small>CURRENT</small><strong>${Number(streak.current || 0)}</strong><b>days</b></article><article><span>⚑</span><small>LONGEST</small><strong>${Number(streak.longest || 0)}</strong><b>days</b></article><article><span>✓</span><small>ACTIVE DAYS</small><strong>${yearActivity.activeDays}</strong><b>this year</b></article></aside>
    </section>
    <aside class="info-callout heat-rules"><strong>How Heat grows</strong><p>Publish a post: +10 · Add a Take or reply: +4 · First vote or reaction: +1. Any meaningful action keeps that day’s Heat Streak alive; repeated toggling never creates extra Heat.</p></aside>`;
}

const guildLandingSections = ['announcement', 'about', 'rules', 'featured', 'members', 'events', 'progress'];

function guildIdentityEditor(guild) {
  const identity = guild.viewerMembership?.guildProfile || {};
  const questions = guild.onboardingQuestions || [];
  return `<form class="guild-identity-form" id="guildIdentityForm"><div class="guild-studio-heading"><div><span class="section-kicker">MEMBER IDENTITY</span><h2>Your look inside ${escapeHtml(guild.name)}</h2><p>This identity is only shown in this guild.</p></div><span class="avatar avatar-frame-${escapeHtml(identity.avatarFrame || 'none')}" style="--identity:${escapeHtml(identity.themeColor || guild.themeColor || '#7444e8')}">${identity.avatarUrl ? `<img src="${escapeHtml(identity.avatarUrl)}" alt="" />` : escapeHtml((identity.nickname || state.profile.displayName || 'C').charAt(0))}</span></div><div class="form-grid"><label>Guild nickname<input name="nickname" maxlength="40" value="${escapeHtml(identity.nickname || '')}" placeholder="Use my Callout name" /></label><label>Identity color<input name="themeColor" type="color" value="${escapeHtml(identity.themeColor || guild.themeColor || '#7444e8')}" /></label><label>Avatar frame<select name="avatarFrame">${['none','spark','gold','violet','flame'].map(value => `<option value="${value}" ${identity.avatarFrame === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Guild avatar<input name="avatarFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label><label>Mini banner<input name="bannerFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label></div><label>Guild bio<textarea name="bio" maxlength="300" placeholder="What should this community know about you?">${escapeHtml(identity.bio || '')}</textarea></label>${questions.length ? `<fieldset><legend>Member onboarding</legend>${questions.map((question, index) => `<label>${escapeHtml(question.prompt)}<select name="onboarding_${index}" ${question.required ? 'required' : ''}><option value="">Choose an answer</option>${question.options.map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select></label>`).join('')}</fieldset>` : ''}<input type="hidden" name="avatarUrl" value="${escapeHtml(identity.avatarUrl || '')}" /><input type="hidden" name="bannerUrl" value="${escapeHtml(identity.bannerUrl || '')}" /><button class="primary-action" type="submit">Save guild identity</button></form>`;
}

function guildSettingsEditor(guild) {
  const layout = guild.landingLayout?.length ? guild.landingLayout : ['announcement','about','rules','members','progress'];
  const emojiText = (guild.customEmojis || []).map(item => `${item.name}|${item.imageUrl}`).join('\n');
  const questions = (guild.onboardingQuestions || []).map(item => `${item.prompt}|${item.options.join(',')}|${item.required ? 'required' : 'optional'}`).join('\n');
  return `<form class="guild-settings-form guild-style-studio" id="guildSettingsForm"><div class="guild-studio-heading"><div><span class="section-kicker">GUILD STYLE STUDIO</span><h2>Build a community with its own identity</h2></div><div class="guild-template-actions">${['minimal','cinema','gaming','debate'].map(template => `<button type="button" data-guild-template="${template}">${template}</button>`).join('')}</div></div><div class="form-grid"><label>Guild name<input name="name" maxlength="60" value="${escapeHtml(guild.name)}" required /></label><label>Tagline<input name="tagline" maxlength="100" value="${escapeHtml(guild.tagline || '')}" /></label></div><label>Description<textarea name="description" maxlength="240">${escapeHtml(guild.description || '')}</textarea></label><label>Welcome message<textarea name="welcomeMessage" maxlength="500">${escapeHtml(guild.welcomeMessage || '')}</textarea></label><label>Pinned announcement<textarea name="pinnedAnnouncement" maxlength="500">${escapeHtml(guild.pinnedAnnouncement || '')}</textarea></label><label>Rules<textarea name="rules" maxlength="1200">${escapeHtml(guild.rules || '')}</textarea></label><div class="form-grid"><label>Privacy<select name="privacy"><option value="public" ${guild.privacy !== 'private' ? 'selected' : ''}>Public</option><option value="private" ${guild.privacy === 'private' ? 'selected' : ''}>Private</option></select></label><label>Invite code<input value="${escapeHtml(guild.inviteCode || '')}" readonly /></label><label>Icon image<input name="iconFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label><label>Banner image<input name="bannerFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label><label>Theme color<input name="themeColor" type="color" value="${escapeHtml(guild.themeColor || '#7444e8')}" /></label><label>Accent color<input name="accentColor" type="color" value="${escapeHtml(guild.accentColor || '#ff4713')}" /></label><label>Background<select name="backgroundPattern">${['clean','grid','waves','stars','noise'].map(value => `<option value="${value}" ${guild.backgroundPattern === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Card style<select name="cardStyle">${['solid','glass','outline','soft'].map(value => `<option value="${value}" ${guild.cardStyle === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Icon shape<select name="iconShape">${['circle','rounded','shield','hex'].map(value => `<option value="${value}" ${guild.iconShape === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Seasonal effect<select name="seasonalEffect">${['none','confetti','snow','embers','sparkles'].map(value => `<option value="${value}" ${guild.seasonalEffect === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div><div class="guild-settings-toggles"><label><input name="allowJoinRequests" type="checkbox" ${guild.settings?.allowJoinRequests !== false ? 'checked' : ''} /> Allow join requests</label><label><input name="showMemberList" type="checkbox" ${guild.settings?.showMemberList !== false ? 'checked' : ''} /> Show member list</label><label><input name="allowPerGuildProfiles" type="checkbox" ${guild.settings?.allowPerGuildProfiles !== false ? 'checked' : ''} /> Per-guild member profiles</label><label><input name="showOnlineStatus" type="checkbox" ${guild.settings?.showOnlineStatus !== false ? 'checked' : ''} /> Online status</label></div><div class="form-grid"><label>Reaction pack<input name="reactionSet" value="${escapeHtml((guild.reactionSet || []).join(' '))}" placeholder="👍 🔥 😂 💀" /><small>2–8 emoji separated by spaces.</small></label><label>Custom emoji library<textarea name="customEmojis" placeholder="name|https://image-url">${escapeHtml(emojiText)}</textarea><small>One name and image URL per line.</small></label><label>Onboarding builder<textarea name="onboardingQuestions" placeholder="Question|Option one,Option two|required">${escapeHtml(questions)}</textarea><small>One question per line.</small></label></div><fieldset class="layout-picker"><legend>Public landing page order</legend><div id="guildLayoutEditor">${layout.map((section, index) => `<span data-guild-layout-item="${section}"><strong>${section}</strong><button type="button" data-guild-layout-move="${index}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-guild-layout-move="${index}" data-direction="1" ${index === layout.length - 1 ? 'disabled' : ''}>↓</button></span>`).join('')}</div></fieldset><input type="hidden" name="iconUrl" value="${escapeHtml(guild.iconUrl || '')}" /><input type="hidden" name="bannerUrl" value="${escapeHtml(guild.bannerUrl || '')}" /><input type="hidden" name="contentPrivacy" value="members" /><button class="primary-action" type="submit">Save guild studio</button></form>`;
}

function guildDetailView() {
  const id = decodeURIComponent(location.hash.split('/')[1] || '');
  const guild = state.activeGuild?.id === id ? state.activeGuild : null;
  if (!guild) return `${pageHeader('GUILD', 'Loading guild…', 'Opening the public guild profile.')}`;
  const tab = location.hash.split('/')[2] || (guild.joined ? 'feed' : 'public');
  const tabs = `<nav class="guild-tabs"><button data-guild-tab="public" class="${tab === 'public' ? 'active' : ''}">Public profile</button><button data-guild-tab="feed" class="${tab === 'feed' ? 'active' : ''}">Member feed</button><button data-guild-tab="pinboard" class="${tab === 'pinboard' ? 'active' : ''}">Pinboard</button><button data-guild-tab="chat" class="${tab === 'chat' ? 'active' : ''}">Group chat</button>${guild.joined ? `<button data-guild-tab="members" class="${tab === 'members' ? 'active' : ''}">Members</button><button data-guild-tab="identity" class="${tab === 'identity' ? 'active' : ''}">My identity</button>` : ''}${guild.permissions?.manageRoles ? `<button data-guild-tab="roles" class="${tab === 'roles' ? 'active' : ''}">Roles</button>` : ''}${guild.permissions?.viewAudit ? `<button data-guild-tab="audit" class="${tab === 'audit' ? 'active' : ''}">Audit</button>` : ''}${guild.permissions?.manageGuild ? `<button data-guild-tab="settings" class="${tab === 'settings' ? 'active' : ''}">Style studio</button>` : ''}</nav>`;
  const hero = `<section class="guild-hero guild-bg-${escapeHtml(guild.backgroundPattern || 'clean')} guild-cards-${escapeHtml(guild.cardStyle || 'solid')} guild-effect-${escapeHtml(guild.seasonalEffect || 'none')}" style="--guild-theme:${escapeHtml(guild.themeColor || '#7444e8')};--guild-accent:${escapeHtml(guild.accentColor || '#ff4713')}"><div class="guild-cover">${guild.bannerUrl ? `<img src="${escapeHtml(guild.bannerUrl)}" alt="" />` : ''}</div><div class="guild-hero-body"><span class="guild-profile-icon guild-icon-${escapeHtml(guild.iconShape || 'rounded')}">${guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0))}</span><div><span class="section-kicker">LEVEL ${Number(guild.level || 1)} · ${guild.memberCount} MEMBERS</span><h1>${escapeHtml(guild.name)}</h1><p>${escapeHtml(guild.tagline || guild.description)}</p><div class="guild-xp-track"><i style="width:${Math.min(100, Number(guild.guildXp || 0) % 100)}%"></i></div></div><button class="${guild.joined ? 'quiet-action' : 'primary-action'}" type="button" data-toggle-guild="${guild.id}" ${guild.owner ? 'disabled' : ''}>${guild.owner ? 'Owner' : guild.joined ? 'Leave guild' : 'Join guild'}</button></div></section>`;
  let body = '';
  if (tab === 'public') body = `${guild.pinnedAnnouncement ? `<aside class="guild-announcement"><strong>Pinned announcement</strong><p>${escapeHtml(guild.pinnedAnnouncement)}</p></aside>` : ''}<section class="guild-public-grid"><article><span class="section-kicker">ABOUT</span><h2>${escapeHtml(guild.description || 'No description yet.')}</h2></article><article><span class="section-kicker">RULES</span><div class="formatted-copy">${escapeHtml(guild.rules || 'Guild rules have not been added yet.').replace(/\n/g, '<br>')}</div></article></section>`;
  else if (!guild.canViewContent) body = emptyState('🔒', 'Members-only area', 'This guild is public from the outside, but its feed and group chat are visible only to members.', `<button class="primary-action" type="button" data-toggle-guild="${guild.id}">Join guild</button>`);
  else if (tab === 'feed') body = `${guild.permissions?.createPosts ? `<form class="guild-post-composer" id="guildPostForm"><textarea name="content" maxlength="2000" required placeholder="Share something with ${escapeHtml(guild.name)}…"></textarea><select name="category"><option>Life</option><option>Entertainment</option><option>Movies</option><option>Music</option><option>Games</option></select><button class="primary-action" type="submit">Post to guild</button></form>` : '<aside class="info-callout"><strong>Read-only role</strong><p>The owner must grant Contributor posting permission before you can publish here.</p></aside>'}${state.guildPosts.length ? feedMarkup(state.guildPosts) : emptyState('✦', 'No guild posts yet', 'Permitted contributors can start the first conversation here.')}`;
  else if (tab === 'chat') body = guild.permissions?.chat ? `<section class="guild-chat"><div class="chat-stream">${state.guildMessages.length ? state.guildMessages.map(message => `<article><span class="avatar">${message.sender?.avatarUrl ? `<img src="${escapeHtml(message.sender.avatarUrl)}" alt="" />` : escapeHtml((message.sender?.displayName || 'C').charAt(0))}</span><div><strong>${escapeHtml(message.sender?.displayName || 'Member')}</strong><small>${timeLabel(new Date(message.createdAt).getTime())}</small><p>${escapeHtml(message.text)}</p></div></article>`).join('') : '<div class="stage-empty"><h2>No messages yet</h2><p>Start the guild group chat.</p></div>'}</div><form id="guildChatForm"><textarea name="text" maxlength="2000" required placeholder="Message the guild…"></textarea><button class="primary-action" type="submit">Send</button></form></section>` : emptyState('🔒', 'Chat permission required', 'Ask a guild moderator to grant a role with chat access.');
  else if (tab === 'pinboard') body = pinboardView(guild);
  else if (tab === 'members') body = `<section class="guild-member-list guild-identity-cards">${state.guildMembers.map(member => { const identity = member.guildProfile || {}; return `<article style="--member-accent:${escapeHtml(identity.themeColor || guild.themeColor || '#7444e8')}"><span class="avatar avatar-frame-${escapeHtml(identity.avatarFrame || 'none')}">${identity.avatarUrl || member.user?.avatarUrl ? `<img src="${escapeHtml(identity.avatarUrl || member.user.avatarUrl)}" alt="" />` : escapeHtml((identity.nickname || member.user?.displayName || 'C').charAt(0))}</span><div><strong>${escapeHtml(identity.nickname || member.user?.displayName || 'Member')}</strong><small><i class="status-dot ${escapeHtml(member.user?.status || 'invisible')}"></i> ${escapeHtml(member.roleKey)} · ${escapeHtml(member.status)}</small><span>${Number(member.contributionScore || 0)} contribution · ${Number(member.streakDays || 0)} day streak · ${Number(member.guildXp || 0)} XP</span></div>${guild.permissions?.manageMembers && member.roleKey !== 'owner' ? `<select data-member-role="${member.user.id}">${['moderator','contributor','chatter','viewer'].map(role => `<option value="${role}" ${member.roleKey === role ? 'selected' : ''}>${role}</option>`).join('')}</select>${member.status === 'pending' ? `<button data-approve-member="${member.user.id}">Approve</button>` : ''}` : ''}</article>`; }).join('') || '<p>No members yet.</p>'}</section>`;
  else if (tab === 'identity') body = guildIdentityEditor(guild);
  else if (tab === 'roles') body = `<section class="role-editor">${(guild.roles || []).filter(role => role.key !== 'owner').map(role => `<form data-role-form="${role.key}"><header><input name="icon" maxlength="12" value="${escapeHtml(role.icon || '◇')}" aria-label="Role icon" /><input name="name" maxlength="40" value="${escapeHtml(role.name)}" aria-label="Role name" /><input name="color" type="color" value="${escapeHtml(role.color)}" aria-label="Role color" /><small>${escapeHtml(role.key)}</small></header><div>${['manageGuild','manageRoles','manageMembers','managePosts','createPosts','chat','viewAudit'].map(permission => `<label><input type="checkbox" name="${permission}" ${role.permissions?.[permission] ? 'checked' : ''} />${permission.replace(/([A-Z])/g, ' $1')}</label>`).join('')}</div><button class="quiet-action" type="submit">Save role design</button></form>`).join('')}</section>`;
  else if (tab === 'audit') body = `<section class="audit-list">${state.guildAudit.map(item => `<article><strong>${escapeHtml(item.actor?.displayName || 'Member')}</strong><span>${escapeHtml(item.action)}</span><small>${new Date(item.createdAt).toLocaleString()}</small></article>`).join('') || '<p>No audited changes yet.</p>'}</section>`;
  else body = guildSettingsEditor(guild);
  return `${hero}${tabs}<div class="guild-workspace">${body}</div>`;
}

function pinboardView(guild) {
  if (!guild.canViewContent) return emptyState('🔒', 'Members-only Pinboard', 'Join this guild to enter its live community board.');
  const cycleEnds = (Number(state.pinboard.cycle || Math.floor(Date.now() / 18_000_000)) + 1) * 18_000_000;
  const items = state.pinboard.items || [];
  return `<section class="guild-pinboard">
    <header><div><span class="section-kicker">LIVE GUILD CHAT</span><h2>PINBOARD</h2><p>Messages, memes, images, and GIFs pinned in chronological order.</p></div><div class="pinboard-clock"><span>Resets in</span><strong>${Math.max(0, Math.ceil((cycleEnds - Date.now()) / 60_000))} min</strong>${state.pinboard.canManage ? '<button type="button" data-reset-pinboard>Reset board</button>' : ''}</div></header>
    <p class="pinboard-retention">Boards reset every five hours. Previous boards remain available for seven days.</p>
    <div class="pinboard-stream">${items.length ? items.map((item, index) => `<article class="pinboard-message pin-${index % 5}"><i class="pushpin"></i><span class="avatar">${item.sender?.avatarUrl ? `<img src="${escapeHtml(item.sender.avatarUrl)}" alt="" />` : escapeHtml((item.sender?.displayName || 'C').charAt(0))}</span><div><header><strong>${escapeHtml(item.sender?.displayName || 'Member')}</strong><small>${timeLabel(new Date(item.createdAt).getTime())}</small></header>${item.text ? `<p>${escapeHtml(item.text)}</p>` : ''}${(item.attachments || []).map(file => file.type === 'link' ? `<a href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(file.alt || file.url)}</a>` : `<img src="${escapeHtml(file.url)}" alt="${escapeHtml(file.alt || 'Pinboard attachment')}" />`).join('')}<footer><button type="button">↩ Reply</button><button type="button">♡ React</button></footer></div></article>`).join('') : '<div class="pinboard-empty"><span>📌</span><strong>The board is ready.</strong><p>Pin the first message for your guild.</p></div>'}</div>
    <form class="pinboard-composer" id="pinboardForm"><textarea name="text" maxlength="2000" placeholder="Pin a message to the board…"></textarea><div><input name="attachment" type="url" placeholder="Optional image, GIF, or link URL" /><button type="button" data-pinboard-emoji>☺</button><button class="primary-action" type="submit">Pin it</button></div></form>
  </section>`;
}

function topicsView() {
  const selectedId = decodeURIComponent(location.hash.split('/')[1] || '');
  const selected = state.topics.find(topic => String(topic.id) === selectedId || topic.slug === selectedId);
  if (selected) {
    const posts = [...state.posts, ...state.anonymousPosts].filter(post => String(post.topic?.id || post.topic || '') === String(selected.id));
    return `<div class="topic-detail ${selected.state === 'vaulted' ? 'topic-vault' : ''}" style="--topic-accent:${escapeHtml(selected.accentColor || '#ff4713')}"><header>${selected.artworkUrl ? `<img src="${escapeHtml(selected.artworkUrl)}" alt="" />` : '<span>◉</span>'}<div><span class="section-kicker">${selected.state === 'vaulted' ? 'TIME VAULT · READ ONLY' : selected.state.toUpperCase()}</span><h1>${escapeHtml(selected.title)}</h1><p>${escapeHtml(selected.description || '')}</p></div><button type="button" data-back-topics>All Topics</button></header>${selected.rules ? `<aside><strong>Topic rules</strong><p>${escapeHtml(selected.rules)}</p></aside>` : ''}${posts.length ? feedMarkup(posts) : emptyState('◷', selected.state === 'vaulted' ? 'This Vault is quiet' : 'No takes yet', selected.state === 'vaulted' ? 'The archived conversation remains preserved here.' : 'Start the conversation from the post composer.')}</div>`;
  }
  const groups = { live: [], scheduled: [], vaulted: [] };
  state.topics.forEach(topic => (groups[topic.state] ||= []).push(topic));
  const cards = items => items.length ? items.map(topic => `<button class="topic-card topic-${topic.state}" type="button" data-open-topic="${topic.id}" style="--topic-accent:${escapeHtml(topic.accentColor || '#ff4713')}">${topic.artworkUrl ? `<img src="${escapeHtml(topic.artworkUrl)}" alt="" />` : '<span>◉</span>'}<div><small>${topic.state.toUpperCase()}</small><strong>${escapeHtml(topic.title)}</strong><p>${escapeHtml(topic.description || '')}</p><time>${new Date(topic.startsAt).toLocaleDateString()} – ${new Date(topic.endsAt).toLocaleDateString()}</time></div></button>`).join('') : '<p class="mini-empty">Nothing here yet.</p>';
  return `${pageHeader('MOMENTS THAT END', 'Limited-Time Topics', 'Join live cultural moments before they become permanent, read-only Time Vaults.')}<section class="topic-groups"><div><h2>Live now</h2>${cards(groups.live)}</div><div><h2>Scheduled</h2>${cards(groups.scheduled)}</div><div><h2>Time Vaults</h2>${cards(groups.vaulted)}</div></section>`;
}

function battleTotalVotes(battle) {
  return (battle.rounds || []).reduce((total, match) => total + Number(match.leftVotes || 0) + Number(match.rightVotes || 0), 0);
}

function battleTimeLabel(battle) {
  const target = battle.status === 'submissions' ? battle.submissionsCloseAt : battle.endsAt;
  if (battle.status === 'selection') return 'Host selecting finalists';
  if (battle.status === 'complete') return 'Battle complete';
  const remaining = Math.max(0, new Date(target || Date.now()).getTime() - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${minutes}m left`;
}

function battleStageLabel(battle) {
  return ({ submissions: 'Taking submissions', selection: 'Finalists being selected', live: 'Bracket live', sudden_death: 'Sudden death', complete: 'Complete' })[battle.status] || 'Battle';
}

function battleBracket(battle, compact = false) {
  const totalRounds = Math.log2(Number(battle.size || 4));
  const entryFor = seed => (battle.entries || []).find(entry => Number(entry.seed) === Number(seed));
  const slot = (entry, match, side) => {
    const votes = side === 'left' ? Number(match?.leftVotes || 0) : Number(match?.rightVotes || 0);
    const isWinner = Number(match?.winnerSeed) === Number(entry?.seed);
    const canVote = ['live', 'sudden_death'].includes(battle.status) && entry && !match?.winnerSeed;
    const identity = battle.status === 'complete' && entry?.authorName ? entry.authorName : entry?.signalCode;
    return `<button type="button" class="tournament-slot ${isWinner ? 'winner' : ''} ${Number(match?.viewerVote) === Number(entry?.seed) ? 'selected' : ''}" ${canVote ? `data-battle-vote="${battle.id}" data-battle-round="${match.round}" data-battle-match="${match.match}" data-battle-seed="${entry.seed}"` : 'disabled'}>${entry?.mediaUrl ? `<img src="${escapeHtml(entry.mediaUrl)}" alt="" />` : `<i>${entry?.seed || '–'}</i>`}<span><small>${escapeHtml(identity || 'Awaiting winner')}</small><strong>${escapeHtml(entry?.label || 'TBD')}</strong></span><b>${votes}</b></button>`;
  };
  const columns = Array.from({ length: totalRounds }, (_, index) => {
    const roundNumber = index + 1;
    const expected = Number(battle.size) / (2 ** roundNumber);
    const matches = Array.from({ length: expected }, (_item, matchIndex) => (battle.rounds || []).find(match => Number(match.round) === roundNumber && Number(match.match) === matchIndex + 1) || { round: roundNumber, match: matchIndex + 1 });
    return `<section class="bracket-round round-${roundNumber}"><header>${roundNumber === totalRounds ? 'Final' : roundNumber === totalRounds - 1 ? 'Semifinal' : `Round ${roundNumber}`}</header><div>${matches.map(match => `<article class="bracket-match ${match.winnerSeed ? 'decided' : ''}">${slot(entryFor(match.leftSeed), match, 'left')}${slot(entryFor(match.rightSeed), match, 'right')}</article>`).join('')}</div></section>`;
  }).join('');
  return `<div class="tournament-bracket ${compact ? 'compact' : ''}">${columns || '<p class="mini-empty">The bracket appears after the host locks the finalists.</p>'}</div>`;
}

function liveBattleCard(battle, featured = false) {
  const bracketReady = ['live', 'sudden_death', 'complete'].includes(battle.status);
  return `<article class="battle-live-card ${featured ? 'featured' : ''}">${battle.coverUrl ? `<img class="battle-cover" src="${escapeHtml(battle.coverUrl)}" alt="" />` : ''}<header><strong>🔥 ${escapeHtml(battleStageLabel(battle).toUpperCase())}</strong><b>${battle.status === 'complete' ? 'ENDED' : '● LIVE'}</b></header><div class="battle-live-body"><small>${battle.size}-ENTRY BATTLE · ${escapeHtml(battle.category || 'General')}</small><h3>${escapeHtml(battle.title)}</h3><div class="battle-round-meta"><span>${battle.status === 'submissions' ? `${battle.submissionCount} SEALED TAKES` : battleStageLabel(battle).toUpperCase()}</span><time>${escapeHtml(battleTimeLabel(battle))}</time></div>${bracketReady ? battleBracket(battle, true) : `<div class="battle-sealed-preview"><span>◈</span><strong>${battle.status === 'selection' ? 'Finalists stay sealed until reveal' : 'Submit one original Take'}</strong></div>`}</div><footer><span><small>${bracketReady ? 'TOTAL VOTES' : 'SUBMISSIONS'}</small><strong>${bracketReady ? battleTotalVotes(battle).toLocaleString() : Number(battle.submissionCount || 0)}</strong></span><button type="button" data-open-battle="${battle.id}">${battle.status === 'submissions' ? 'Submit Take' : 'View Battle'}</button></footer></article>`;
}

function battleSubmissionStage(battle) {
  const close = battle.isHost && Number(battle.submissionCount) >= Number(battle.size) ? `<button class="battle-close-window" type="button" data-close-battle-submissions="${battle.id}">Close early & select finalists</button>` : '';
  if (battle.viewerSubmitted) return `<section class="battle-stage-panel battle-submitted"><span>✓</span><div><h2>Your Take is sealed</h2><p>Nobody else can see it. Finalists are revealed after the host makes their private selection.</p></div>${close}</section>`;
  return `<section class="battle-stage-panel"><header><span class="section-kicker">STAGE 2 OF 4</span><h2>Submit your Take</h2><p>One shot. Your entry stays private during the submission window.</p></header><form id="battleSubmissionForm" data-battle-id="${battle.id}"><textarea name="text" maxlength="1000" required placeholder="Write your strongest opinion…"></textarea><label>Optional image or GIF<input name="media" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label><footer><small><b data-battle-counter>0</b>/1,000 · one submission per person</small><button class="primary-action" type="submit">Seal my Take</button></footer></form>${close}</section>`;
}

function battleSelectionStage(battle) {
  if (!battle.isHost) return `<section class="battle-stage-panel battle-sealed"><span>◈</span><h2>The host is selecting finalists</h2><p>Every Take remains anonymous until the bracket reveal.</p></section>`;
  return `<section class="battle-stage-panel battle-finalist-picker"><header><span class="section-kicker">PRIVATE HOST VIEW · STAGE 3 OF 4</span><h2>Choose exactly ${battle.size} finalists</h2><p>Participants cannot see this shortlist until you lock it.</p></header><form id="battleFinalistForm" data-battle-id="${battle.id}"><div>${(battle.submissions || []).map(item => `<label><input type="checkbox" name="submissionId" value="${item.id}" /><span><small>${escapeHtml(item.signalCode)}</small><strong>${escapeHtml(item.text)}</strong>${item.mediaUrl ? `<img src="${escapeHtml(item.mediaUrl)}" alt="" />` : ''}</span></label>`).join('')}</div><footer><b><span data-finalist-count>0</span>/${battle.size} selected</b><button class="primary-action" type="submit">Reveal bracket</button></footer></form></section>`;
}

function battleDetailView(battle) {
  const body = battle.status === 'submissions' ? battleSubmissionStage(battle) : battle.status === 'selection' ? battleSelectionStage(battle) : `${battleBracket(battle)}<aside class="info-callout"><strong>Community voting</strong><p>Choose one anonymous Take in every open matchup. Winners advance when the round ends; tied matches enter six-hour sudden death.</p></aside>`;
  return `<section class="battle-room"><button class="quiet-action" type="button" data-back-battles>← All Battles</button>${battle.coverUrl ? `<div class="battle-room-cover" style="background-image:url('${escapeHtml(battle.coverUrl)}')"></div>` : ''}<header><div><span class="section-kicker">${battle.size}-ENTRY · ${escapeHtml(String(battle.category || 'GENERAL').toUpperCase())}</span><h1>${escapeHtml(battle.title)}</h1><p>${escapeHtml(battle.description || 'Submit a Take, make the bracket, and let the community decide the winner.')}</p></div><div><b>${escapeHtml(battleStageLabel(battle))}</b><time>${escapeHtml(battleTimeLabel(battle))}</time></div></header><section class="battle-room-host"><span class="avatar">${battle.hostAvatarUrl ? `<img src="${escapeHtml(battle.hostAvatarUrl)}" alt="" />` : escapeHtml((battle.hostName || 'C').charAt(0))}</span><div><small>HOSTED BY</small><strong>${escapeHtml(battle.hostName || 'Callout member')}</strong></div><span>${battle.privacy === 'invite' ? 'Invite only' : 'Public'}</span><span>${battle.submissionCount} submissions</span></section>${body}</section>`;
}

function battlesView() {
  const selectedId = decodeURIComponent(location.hash.split('/')[1] || '');
  const selected = state.battles.find(battle => String(battle.id) === selectedId);
  if (selected) return battleDetailView(selected);
  const live = state.battles.filter(battle => ['submissions', 'selection', 'live', 'sudden_death'].includes(battle.status));
  const filters = [['all','All'],['soon','Closing soon'],['popular','Most joined'],['four','4 finalists'],['eight','8 finalists'],['sixteen','16 finalists']];
  const hosted = state.battles.filter(battle => battle.isHost);
  let available = state.battles.filter(battle => battle.status === 'submissions' && !battle.isHost);
  if (state.battleFilter === 'soon') available = available.sort((a,b) => new Date(a.submissionsCloseAt) - new Date(b.submissionsCloseAt));
  if (state.battleFilter === 'popular') available = available.sort((a,b) => Number(b.submissionCount) - Number(a.submissionCount));
  if (state.battleFilter === 'four') available = available.filter(battle => Number(battle.size) === 4);
  if (state.battleFilter === 'eight') available = available.filter(battle => Number(battle.size) === 8);
  if (state.battleFilter === 'sixteen') available = available.filter(battle => Number(battle.size) === 16);
  const battleRow = (battle, hostedRow = false) => {
    const action = hostedRow ? ({ submissions: 'Manage', selection: 'Select finalists', live: 'View bracket', sudden_death: 'View bracket', complete: 'View results' })[battle.status] || 'Manage' : battle.viewerSubmitted ? 'Submitted' : 'Submit Take';
    return `<article class="battle-join-row ${hostedRow ? 'hosted' : ''}">${battle.coverUrl ? `<img src="${escapeHtml(battle.coverUrl)}" alt="" />` : `<span class="battle-row-art">⚔</span>`}<span class="avatar">${battle.hostAvatarUrl ? `<img src="${escapeHtml(battle.hostAvatarUrl)}" alt="" />` : escapeHtml((battle.hostName || 'C').charAt(0))}</span><div class="battle-row-copy"><small>${escapeHtml(battle.category || 'General')} · ${hostedRow ? 'Hosted by you' : `Hosted by ${escapeHtml(battle.hostName || 'Callout member')}`}</small><strong>${escapeHtml(battle.title)}</strong><span class="battle-row-meta"><b>${battle.size} finalists</b><b>${Number(battle.submissionCount || 0)} sealed</b><b>${escapeHtml(battleStageLabel(battle))}</b><b>${escapeHtml(battleTimeLabel(battle))}</b></span></div><button type="button" data-open-battle="${battle.id}">${action}</button></article>`;
  };
  const rows = available.map(battle => battleRow(battle)).join('');
  const hostedRows = hosted.map(battle => battleRow(battle, true)).join('');
  const liveShowcase = live.length ? live.slice(0,3).map((battle,index) => liveBattleCard(battle,index === 0)).join('') : `<article class="battle-live-empty"><span>⚔</span><div><strong>No Battles are live yet</strong><p>Host the first one and bring a topic into the arena.</p></div><button type="button" data-show-battle-host>Host free</button></article>`;
  return `<section class="battles-page"><header class="battles-page-head"><div><span class="section-kicker">COMMUNITY TOURNAMENTS</span><h1>Battles</h1></div><p>Submit an original Take, earn a bracket spot, and let Callout choose the winner.</p></header><section class="battle-live-showcase"><header><h2>🔥 Live Battles</h2><span>${live.length} active now</span></header><div>${liveShowcase}</div></section><section class="battle-primary-actions"><button class="battle-host-action" type="button" data-show-battle-host><span>⚔</span><strong>Host a Battle</strong><small>Set one topic — free</small></button><button class="battle-join-action" type="button" data-show-battle-join><span>◎</span><strong>Join a Battle</strong><small>Submit one sealed Take</small></button></section><form class="battle-host-form" id="battleHostForm" hidden><header><div><span class="section-kicker">FREE TO HOST</span><h2>What should people debate?</h2><p>That is all you need. Callout handles submissions and the bracket.</p></div><button type="button" data-close-battle-host aria-label="Close">×</button></header><label class="battle-topic-field">Battle topic<input name="title" maxlength="160" required placeholder="e.g. Which movie has the best opening scene?" /></label><details class="battle-advanced-options"><summary><span><strong>Advanced options</strong><small>Finalists, timing, privacy and artwork</small></span><b>＋</b></summary><div class="battle-advanced-grid"><label>Category<input name="category" maxlength="40" placeholder="Movies, Games, Music…" /></label><label>Finalists<select name="size"><option value="4">4 finalists</option><option value="8">8 finalists</option><option value="16">16 finalists</option></select></label><label>Submission window<select name="submissionHours"><option value="1">1 hour</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24" selected>24 hours</option><option value="48">48 hours</option></select></label><label>Round length<select name="roundHours"><option value="1">1 hour</option><option value="6">6 hours</option><option value="12">12 hours</option><option value="24" selected>24 hours</option></select></label><label>Privacy<select name="privacy"><option value="public">Public</option><option value="invite">Invite-only</option></select></label><label>Cover image (optional)<input name="coverFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label></div><label>Description<textarea name="description" maxlength="500" placeholder="Optional context or rules"></textarea></label></details><button class="primary-action" type="submit">Open submissions</button></form>${hostedRows ? `<section class="battle-join-browser battle-hosted-browser"><header><div><span class="section-kicker">HOST DASHBOARD</span><h2>Your hosted Battles</h2><p>Monitor the sealed count here. Takes unlock for your private review when submissions close.</p></div></header><div>${hostedRows}</div></section>` : ''}<section class="battle-join-browser" id="openBattles"><header><div><span class="section-kicker">SUBMISSIONS OPEN</span><h2>Battles you can join</h2></div><div>${filters.map(([key,label]) => `<button class="${state.battleFilter === key ? 'active' : ''}" type="button" data-battle-filter="${key}">${label}</button>`).join('')}</div></header><div>${rows || `<div class="battle-list-empty"><span>◎</span><strong>No matching Battles</strong><p>Try another filter or host a new Battle.</p></div>`}</div></section><section class="battle-how"><header><span class="section-kicker">THE FULL LOOP</span><h2>How Battles work</h2></header><div><article><span>1</span><strong>Host sets one topic</strong><p>The host opens a timed submission window.</p></article><article><span>2</span><strong>Takes stay sealed</strong><p>Each person submits once. Nobody can copy another entry.</p></article><article><span>3</span><strong>Host picks finalists</strong><p>The private shortlist fills the chosen 4, 8, or 16 slots.</p></article><article><span>4</span><strong>Bracket reveal</strong><p>Anonymous Takes face off in a real tournament bracket.</p></article><article><span>5</span><strong>Community crowns one</strong><p>Votes advance winners until the champion is revealed.</p></article></div></section></section>`;
}

function aboutView() {
  const sections = state.about.sections || [];
  const updates = state.about.updates || [];
  return `<section class="about-callout"><header><span class="section-kicker">ABOUT CALLOUT</span><h1>Built in public.<br />Made for honest takes.</h1><p>Callout is an independent social project exploring a better way to publish opinions, vote, debate, and build communities.</p></header><nav>${sections.map(section => `<a href="#about-${section.key}">${escapeHtml(section.title)}</a>`).join('')}</nav><div class="about-sections">${sections.map(section => `<article id="about-${section.key}"><span>${String(sections.indexOf(section) + 1).padStart(2, '0')}</span><div><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p></div></article>`).join('')}</div><section class="project-wall"><header><span class="section-kicker">OFFICIAL PROJECT LOG</span><h2>Project Wall</h2><p>Public updates posted by Callout staff.</p></header><div>${updates.length ? updates.map(update => `<article class="project-update ${update.pinned ? 'pinned' : ''}"><i class="pushpin"></i><small>${escapeHtml(String(update.label || 'building').replace('_', ' '))} · ${new Date(update.createdAt).toLocaleDateString()}</small><h3>${escapeHtml(update.title)}</h3><p>${escapeHtml(update.body).replace(/\n/g, '<br>')}</p></article>`).join('') : `<article class="project-update coming-soon"><i class="pushpin"></i><small>COMING SOON</small><h3>The public build log starts here.</h3><p>Official development updates will be posted as Callout grows.</p></article>`}</div></section></section>`;
}

function notificationCategory(item) {
  if (['comment', 'reply', 'vote', 'viral_video'].includes(item.type)) return 'takes';
  if (['guild', 'guild_invite'].includes(item.type)) return 'guilds';
  if (item.type === 'message') return 'messages';
  if (['friend_request', 'friend_accept', 'follow'].includes(item.type)) return 'social';
  return 'system';
}

function notificationsView() {
  const filtered = state.notificationFilter === 'all' ? state.notifications : state.notifications.filter(item => notificationCategory(item) === state.notificationFilter);
  const grouped = Object.groupBy ? Object.groupBy(filtered, notificationCategory) : filtered.reduce((groups, item) => { (groups[notificationCategory(item)] ||= []).push(item); return groups; }, {});
  const row = item => `<article class="activity-item ${item.read ? '' : 'unread'}"><span class="avatar">${item.actor?.avatarUrl ? `<img src="${escapeHtml(item.actor.avatarUrl)}" alt="${escapeHtml(item.actor.displayName || 'Sender')}" />` : escapeHtml((item.actor?.displayName || 'C').charAt(0))}</span><div><span class="notification-kind">${notificationCategory(item).toUpperCase()}</span><strong>${escapeHtml(item.text)}</strong><small>${item.actor ? `${escapeHtml(item.actor.displayName)} · ` : ''}${timeLabel(new Date(item.createdAt).getTime())}</small></div><div class="notification-actions">${item.type === 'friend_request' ? `<button type="button" data-notification-user="${escapeHtml(item.actor?.id || '')}">View request</button>` : ''}${item.post ? `<button type="button" data-notification-post="${item.post}">Open</button>` : ''}${item.guild ? `<button type="button" data-notification-guild="${item.guild}">Open</button>` : ''}${item.type === 'message' && item.actor?.id ? `<button type="button" data-notification-message="${item.actor.id}">Chat</button>` : ''}${item.actor?.id ? `<button type="button" data-mute-notification="user" data-mute-id="${item.actor.id}">Mute</button>` : item.guild ? `<button type="button" data-mute-notification="guild" data-mute-id="${item.guild}">Mute</button>` : `<button type="button" data-mute-notification="category" data-mute-id="${item.category || notificationCategory(item)}">Mute</button>`}</div></article>`;
  const content = filtered.length ? `<section class="notification-groups">${Object.entries(grouped).map(([category, items]) => `<section><h2>${escapeHtml(category)}</h2><div class="activity-list">${items.map(row).join('')}</div></section>`).join('')}</section>` : emptyState('♢', 'Nothing in this category', 'Specific account activity will appear here when it happens.');
  return `${pageHeader('INBOX', 'Notifications', 'Votes, replies, guild activity, and system updates in one place.', '<button class="quiet-action" type="button" data-mark-read>Mark all as read</button>')}
    <div class="segmented-control notification-filters">${[['all','All'],['takes','Takes'],['messages','Messages'],['social','Friends'],['guilds','Guilds'],['system','System']].map(([key,label]) => `<button class="${state.notificationFilter === key ? 'active' : ''}" type="button" data-notification-filter="${key}">${label}</button>`).join('')}</div>
    ${content}`;
}

function conversationGroups() {
  const groups = new Map();
  for (const message of state.messages) {
    const other = String(message.sender?.id) === String(sessionUser?.id) ? message.recipient : message.sender;
    if (!other?.id) continue;
    if (!groups.has(String(other.id))) groups.set(String(other.id), { user: other, messages: [] });
    groups.get(String(other.id)).messages.push(message);
  }
  return [...groups.values()].sort((a, b) => new Date(b.messages.at(-1)?.createdAt || 0) - new Date(a.messages.at(-1)?.createdAt || 0));
}

function messagesView() {
  const groups = conversationGroups();
  const selectedId = decodeURIComponent(location.hash.split('/')[1] || '');
  const selected = groups.find(group => String(group.user.id) === selectedId) || (selectedId && String(state.publicProfile?.id) === selectedId ? { user: state.publicProfile, messages: [] } : null) || (selectedId && state.leaderboard.find(user => String(user.id) === selectedId) ? { user: state.leaderboard.find(user => String(user.id) === selectedId), messages: [] } : null);
  const items = groups.map(group => { const last = group.messages.at(-1); return `<button class="message-item ${String(group.user.id) === selectedId ? 'active' : ''}" type="button" data-conversation="${group.user.id}"><span class="avatar">${escapeHtml((group.user.displayName || 'C').charAt(0))}</span><div><strong>${escapeHtml(group.user.displayName || 'Member')}</strong><p>${escapeHtml(last?.text || '')}</p><small>${timeLabel(new Date(last?.createdAt).getTime())}</small></div></button>`; }).join('');
  const stage = selected ? `<section class="dm-chat"><header><span class="avatar">${escapeHtml((selected.user.displayName || 'C').charAt(0))}</span><div><strong>${escapeHtml(selected.user.displayName)}</strong><small>${escapeHtml(selected.user.handle || '')}</small></div><button type="button" data-open-user="${selected.user.id}">Profile</button></header><div class="chat-stream">${selected.messages.map(message => `<article class="dm-bubble ${String(message.sender?.id) === String(sessionUser?.id) ? 'sent' : 'received'}"><p>${escapeHtml(message.text)}</p><small>${timeLabel(new Date(message.createdAt).getTime())}</small></article>`).join('')}</div><form id="dmChatForm"><textarea name="message" maxlength="2000" required placeholder="Message ${escapeHtml(selected.user.displayName)}…"></textarea><input type="hidden" name="recipient" value="${selected.user.id}" /><button class="primary-action" type="submit">Send</button></form></section>` : '<div class="stage-empty"><div class="empty-icon">✉</div><h2>Select a conversation</h2><p>Choose an existing chat or start a new one.</p></div>';
  return `${pageHeader('DIRECT MESSAGES', 'Messages', 'Private conversations with people you connect with on Callout.', '<button class="primary-action" type="button" data-new-message>＋ New message</button>')}
    <section class="messages-layout">
      <aside class="conversation-list"><label><svg><use href="#i-search"></use></svg><input type="search" placeholder="Search messages" aria-label="Search messages" /></label>${items || '<div class="mini-empty"><span>✉</span><strong>No conversations</strong><p>Your message history will appear here.</p></div>'}</aside>
      <div class="conversation-stage" id="conversationStage">${stage}</div>
    </section>`;
}

function savedView() {
  const saved = state.savedPosts;
  return `${pageHeader('YOUR LIBRARY', 'Saved', 'Takes you want to revisit, kept private to your account.')}
    ${saved.length ? `<section class="take-list">${saved.map(postTemplate).join('')}</section>` : emptyState('◇', 'Nothing saved yet', 'Use the bookmark on a real take and it will be collected here.')}`;
}

function legacyProfileView() {
  const profile = state.profile;
  const data = { ...profile, ...(state.ownProfileData || {}), socialLinks: { ...profile.socialLinks, ...(state.ownProfileData?.socialLinks || {}) } };
  const level = heatMilestone(Number(profile.heatScore || 0));
  return `${pageHeader('ACCOUNT', 'Your profile', 'Your posts, communities, and Heat in one focused identity.', '<button class="quiet-action" type="button" data-open-settings>Edit profile</button>')}
    <section class="profile-hero discord-profile profile-bg-${escapeHtml(profile.profileBackground)} profile-effect-${escapeHtml(profile.profileEffect)}" style="--profile-accent:${escapeHtml(profile.themeColor)}">
      <div class="profile-cover">${profile.bannerUrl ? `<img src="${escapeHtml(profile.bannerUrl)}" alt="Profile banner" />` : '<span>CALL IT LIKE YOU SEE IT.</span>'}</div>
      <div class="profile-identity">${avatarMarkup('profile-avatar')}<div><div class="identity-line"><h2>${escapeHtml(profile.displayName)}</h2><i class="status-dot ${escapeHtml(profile.status)}"></i></div><p>${escapeHtml(profile.handle)}${profile.pronouns ? ` · ${escapeHtml(profile.pronouns)}` : ''}</p>${profile.bio ? `<small class="profile-bio-line">${escapeHtml(profile.bio.slice(0, 180))}</small>` : ''}</div><button class="profile-heat-chip" type="button" data-open-heat><span>${calloutGlyph('personal')}</span><div><strong>${Number(profile.heatScore || 0).toLocaleString()} HEAT</strong><small>${escapeHtml(level.name)} · LEVEL ${level.level}</small></div></button></div>
    </section>
    ${profileTabs()}${profileTabPanel(data)}`;
}

function formatBio(value) {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
}

const legacyProfileTabNames = ['posts', 'guilds', 'heat'];
function legacyProfileTabs(user = state.profile) {
  const active = legacyProfileTabNames.includes(state.profileTab) ? state.profileTab : 'posts';
  return `<nav class="profile-tabs" aria-label="Profile sections">${legacyProfileTabNames.map(tab => `<button type="button" data-profile-tab="${tab}" class="${active === tab ? 'active' : ''}">${tab.charAt(0).toUpperCase()}${tab.slice(1)}</button>`).join('')}</nav>`;
}

function legacyProfileTabPanel(user) {
  const tab = legacyProfileTabNames.includes(state.profileTab) ? state.profileTab : 'posts';
  const allPosts = user.posts || [];
  const posts = user.showcaseMode === 'featured' && user.featuredPosts?.length ? user.featuredPosts : [...allPosts].sort((a, b) => user.showcaseMode === 'popular' ? (Number(b.alrightVotes || 0) + Number(b.cringeVotes || 0)) - (Number(a.alrightVotes || 0) + Number(a.cringeVotes || 0)) : user.showcaseMode === 'controversial' ? Math.abs(Number(a.alrightVotes || 0) - Number(a.cringeVotes || 0)) - Math.abs(Number(b.alrightVotes || 0) - Number(b.cringeVotes || 0)) : new Date(b.createdAt) - new Date(a.createdAt));
  if (tab === 'posts') return `<section class="profile-tab-panel">${posts.length ? `<div class="profile-post-list">${posts.map(post => `<article><small>${escapeHtml(post.category || 'Take')} · ${timeLabel(new Date(post.createdAt).getTime())}</small><strong>${formatPostContent(post.content || '')}</strong><span>${Number(post.alrightVotes || 0)} Based · ${Number(post.cringeVotes || 0)} Hot Take</span></article>`).join('')}</div>` : emptyState('✦', 'No posts yet', 'Published takes will appear on this profile.')}</section>`;
  if (tab === 'guilds') return `<section class="profile-tab-panel">${user.guilds?.length ? `<div class="profile-guild-list">${user.guilds.map(guild => `<button type="button" data-open-guild="${guild.id}"><span class="guild-monogram">${guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0))}</span><span><strong>${escapeHtml(guild.name)}</strong><small>${Number(guild.memberCount || 0)} members</small></span></button>`).join('')}</div>` : emptyState('⚔', 'No guilds to show', 'Guild memberships will appear here.')}</section>`;
  const score = Number(user.heatScore || 0);
  const level = heatMilestone(score);
  const streak = user.heatStreak || {};
  return `<section class="profile-tab-panel profile-heat-panel"><div class="profile-heat-grid"><article class="profile-heat-level" style="--heat-accent:${level.color}"><span class="heat-tier-emblem">${calloutGlyph('personal')}</span><div><span class="section-kicker">HEAT LEVEL</span><h2>${escapeHtml(level.name)}</h2><strong>${score.toLocaleString()} Heat · Level ${level.level}</strong><div class="mini-heat-track"><span style="width:${level.progress}%"></span></div><small>${level.level === 6 ? 'Highest level reached' : `${level.remaining.toLocaleString()} Heat to the next level`}</small></div></article><article class="profile-heat-streak"><span>🔥</span><div><span class="section-kicker">HEAT STREAK</span><h2>${Number(streak.current || 0)} days</h2><p>Longest: ${Number(streak.longest || 0)} days</p></div>${heatActivityGrid(streak, 56)}</article></div></section>`;
}

function legacyPublicUserView() {
  const user = state.publicProfile;
  const id = decodeURIComponent(location.hash.split('/')[1] || '');
  if (!user || String(user.id) !== id) return `${pageHeader('PROFILE', 'Loading profile…', 'Fetching the latest public account details.')}`;
  const level = heatMilestone(Number(user.heatScore || 0));
  const friendButton = user.requestIncoming ? `<button class="quiet-action" type="button" data-accept-friend="${user.friendshipId}">Accept friend</button>` : `<button class="quiet-action" type="button" data-friend-user="${user.id}" ${['accepted','pending'].includes(user.friendship) ? 'disabled' : ''}>${user.friendship === 'accepted' ? 'Friends ✓' : user.friendship === 'pending' ? 'Request pending' : 'Add friend'}</button>`;
  return `<section class="public-user-card profile-bg-${escapeHtml(user.profileBackground || 'clean')} profile-effect-${escapeHtml(user.profileEffect || 'none')}" style="--profile-accent:${escapeHtml(user.themeColor || '#ff4713')}"><div class="public-user-banner">${user.bannerUrl ? `<img src="${escapeHtml(user.bannerUrl)}" alt="" />` : ''}</div><div class="public-user-main"><span class="avatar heat-frame ${heatFrameClass(user.heatScore || 0)}">${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />` : escapeHtml((user.displayName || 'C').charAt(0))}</span><div><h1>${escapeHtml(user.displayName)}${user.isAutomated ? ' <span class="automation-label">AUTOMATED</span>' : ''}</h1><p>${escapeHtml(user.handle || '')}${user.pronouns ? ` · ${escapeHtml(user.pronouns)}` : ''}</p><small>${user.isAutomated ? `${escapeHtml(user.automationPersona || 'Callout automation')} · Clearly labelled automated account` : `${Number(user.heatScore || 0).toLocaleString()} Heat · ${escapeHtml(level.name)} · Level ${level.level}`}</small>${user.bio ? `<p class="profile-bio-line">${escapeHtml(user.bio.slice(0, 180))}</p>` : ''}</div><div class="public-user-actions">${user.isAutomated ? '<span class="automation-notice">Operated by Callout</span>' : user.friendship === 'self' ? '<button class="quiet-action" data-open-settings>Edit profile</button>' : `${friendButton}<button class="primary-action" type="button" data-message-user="${user.id}">Message</button>`}</div></div>${profileTabs(user)}${profileTabPanel(user)}</section>`;
}

const profileTabNames = ['posts', 'guilds', 'heat', 'about', 'activity', 'collections'];

function profileAvatar(user, className = '') {
  return `<span class="avatar heat-frame ${heatFrameClass(user.heatScore || 0)} ${className}">${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.displayName || 'Callout member')}" />` : escapeHtml((user.displayName || 'C').charAt(0).toUpperCase())}</span>`;
}

function profileBadgeShelf(user) {
  const badges = user.badges || [];
  const defaults = [
    { key: 'hot-take', name: 'Hot Take', description: '100+ Hot Take votes received', icon: '♨', tone: 'hot', value: 0, target: 100 },
    { key: 'debater', name: 'Debater', description: '50+ Takes published', icon: '◯', tone: 'mint', value: 0, target: 50 },
    { key: 'wordsmith', name: 'Wordsmith', description: '10+ posts published', icon: '✎', tone: 'blue', value: 0, target: 10 },
    { key: 'top-heat', name: 'Top 10%', description: 'Current Global Heat rank', icon: '♛', tone: 'violet', value: 0, target: 1, dynamic: true }
  ];
  const rows = defaults.map(item => ({ ...item, ...(badges.find(badge => badge.key === item.key) || {}) }));
  return `<section class="profile-badge-shelf"><header><div><span class="section-kicker">BADGES</span><h2>Callout credentials</h2></div><p>Earned from genuine contributions. Never bought.</p></header><div>${rows.map(badge => `<article class="badge-${escapeHtml(badge.tone)} ${badge.unlocked ? 'unlocked' : 'locked'}"><span>${escapeHtml(badge.icon)}</span><strong>${escapeHtml(badge.name)}</strong><small>${badge.unlocked ? escapeHtml(badge.description) : `${Number(badge.value || 0).toLocaleString()} / ${Number(badge.target || 1).toLocaleString()}`}</small><i><b style="width:${Math.min(100, Number(badge.progress || 0))}%"></b></i></article>`).join('')}</div></section>`;
}

function profileTabs() {
  const active = profileTabNames.includes(state.profileTab) ? state.profileTab : 'posts';
  return `<nav class="profile-dossier-tabs" aria-label="Profile sections">${profileTabNames.map(tab => `<button type="button" data-profile-tab="${tab}" class="${active === tab ? 'active' : ''}">${tab.charAt(0).toUpperCase()}${tab.slice(1)}</button>`).join('')}</nav>`;
}

function profilePostPanel(user, own = false) {
  const categories = ['all', ...new Set((user.posts || []).map(post => post.category).filter(Boolean))];
  const selected = categories.includes(state.profilePostFilter) ? state.profilePostFilter : 'all';
  const posts = (user.posts || []).filter(post => selected === 'all' || post.category === selected);
  return `<section class="dossier-panel profile-post-panel"><header><div><span class="section-kicker">RECENT POSTS</span><h2>${posts.length} public post${posts.length === 1 ? '' : 's'}</h2></div><label>Filter<select data-profile-post-filter>${categories.map(category => `<option value="${escapeHtml(category)}" ${category === selected ? 'selected' : ''}>${category === 'all' ? 'All posts' : escapeHtml(category)}</option>`).join('')}</select></label></header><div>${posts.length ? posts.slice(0, 12).map(post => `<article class="dossier-post" data-profile-post="${post.id}"><small>${escapeHtml(post.category || 'Callout')} · ${timeLabel(new Date(post.createdAt).getTime())}</small><strong>${formatPostContent(post.content || '')}</strong><footer><span>${Number(post.alrightVotes || 0)} Based · ${Number(post.cringeVotes || 0)} Hot Take</span><span>${own ? `<button type="button" data-add-post-collection="${post.id}">＋ Collection</button>` : ''}<button type="button" data-open-profile-post="${post.id}">Open →</button></span></footer></article>`).join('') : emptyState('✦', 'No posts to show', 'Published public posts will appear here.')}</div></section>`;
}

function profileGuildPanel(user) {
  return `<section class="dossier-panel"><header><div><span class="section-kicker">GUILDS</span><h2>Communities</h2></div></header>${user.guilds?.length ? `<div class="dossier-guild-grid">${user.guilds.map(guild => `<button type="button" data-open-guild="${guild.id}"><span class="guild-monogram">${guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0))}</span><span><strong>${escapeHtml(guild.name)}</strong><small>${Number(guild.memberCount || 0)} members</small></span></button>`).join('')}</div>` : emptyState('⚔', 'No public Guilds', 'Public Guild memberships will appear here.')}</section>`;
}

function profileHeatPanel(user) {
  const score = Number(user.heatScore || 0); const level = heatMilestone(score); const streak = user.heatStreak || {};
  return `<section class="dossier-panel dossier-heat-panel"><div class="profile-heat-grid"><article class="profile-heat-level" style="--heat-accent:${level.color}"><span class="heat-tier-emblem">${calloutGlyph('personal')}</span><div><span class="section-kicker">HEAT LEVEL</span><h2>${escapeHtml(level.name)}</h2><strong>${score.toLocaleString()} Heat · Level ${level.level}</strong><div class="mini-heat-track"><span style="width:${level.progress}%"></span></div><small>${level.level === 6 ? 'Highest level reached' : `${level.remaining.toLocaleString()} Heat to the next level`}</small></div></article><article class="profile-heat-streak"><span>♨</span><div><span class="section-kicker">HEAT STREAK</span><h2>${Number(streak.current || 0)} days</h2><p>Longest: ${Number(streak.longest || 0)} days</p></div>${heatActivityGrid(streak, 56)}</article></div><button class="quiet-action" type="button" data-open-heat>Open full Heat dashboard →</button></section>`;
}

function profileAboutPanel(user) {
  if (user.aboutVisible === false) return `<section class="dossier-panel">${emptyState('◈', 'About is private', 'This member controls who can see their About section.')}</section>`;
  const socials = Object.entries(user.socialLinks || {}).filter(([, value]) => value);
  return `<section class="dossier-panel dossier-about"><header><div><span class="section-kicker">ABOUT ME</span><h2>${escapeHtml(user.tagline || 'Call it like you see it.')}</h2></div></header><p>${user.bio ? formatBio(user.bio) : 'This member has not written an About section yet.'}</p><dl>${user.location ? `<div><dt>Location</dt><dd>${escapeHtml(user.location)}</dd></div>` : ''}${user.pronouns ? `<div><dt>Pronouns</dt><dd>${escapeHtml(user.pronouns)}</dd></div>` : ''}<div><dt>Joined</dt><dd>${new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</dd></div></dl>${socials.length ? `<footer>${socials.map(([name, value]) => `<a href="${/^https:\/\//i.test(value) ? escapeHtml(value) : '#'}" ${/^https:\/\//i.test(value) ? 'target="_blank" rel="noopener"' : ''}>${escapeHtml(name)}</a>`).join('')}</footer>` : ''}</section>`;
}

function profileActivityPanel(user) {
  if (user.activityVisible === false) return `<section class="dossier-panel">${emptyState('◷', 'Activity is private', 'This member controls who can see their contribution history.')}</section>`;
  const activity = user.activity || [];
  return `<section class="dossier-panel dossier-activity"><header><div><span class="section-kicker">ACTIVITY</span><h2>Contribution history</h2></div><small>Votes stay private</small></header><div>${activity.length ? activity.map(item => `<article><span>${({ joined: '◉', post: '✎', take: '◯', guild_join: '⚔', guild_founder: '♛', badge: '◆', top_heat: '♨' })[item.type] || '✦'}</span><div><strong>${escapeHtml(item.text || item.type)}</strong><small>${new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</small></div>${item.post ? `<button type="button" data-open-profile-post="${item.post}">Open</button>` : item.guild ? `<button type="button" data-open-guild="${item.guild}">Open</button>` : ''}</article>`).join('') : emptyState('◷', 'No activity yet', 'Posts, Takes, Guild joins and milestones will appear here.')}</div></section>`;
}

function profileCollectionsPanel(user, own) {
  const collections = user.collections || [];
  return `<section class="dossier-panel dossier-collections"><header><div><span class="section-kicker">COLLECTIONS</span><h2>Curated by ${own ? 'you' : escapeHtml(user.displayName)}</h2></div>${own ? '<button class="primary-action" type="button" data-create-collection>＋ New collection</button>' : ''}</header>${collections.length ? `<div>${collections.map(collection => `<article><div class="collection-cover">${collection.coverUrl ? `<img src="${escapeHtml(collection.coverUrl)}" alt="" />` : `<span>${collection.type === 'portfolio' ? '▣' : '◇'}</span>`}</div><div><small>${escapeHtml(collection.type)} · ${escapeHtml(collection.visibility)}</small><h3>${escapeHtml(collection.title)}</h3><p>${escapeHtml(collection.description || 'No description')}</p><strong>${Number(collection.postCount || 0)} posts</strong></div>${own ? `<button type="button" data-edit-collection="${collection.id}">Manage</button>` : ''}</article>`).join('')}</div>` : emptyState('◇', 'No visible collections', own ? 'Create a private saved folder or a public creator portfolio.' : 'This member has no collections visible to you.')}</section>`;
}

function profileTabPanel(user, own = false) {
  const tab = profileTabNames.includes(state.profileTab) ? state.profileTab : 'posts';
  return ({ posts: value => profilePostPanel(value, own), guilds: profileGuildPanel, heat: profileHeatPanel, about: profileAboutPanel, activity: profileActivityPanel, collections: value => profileCollectionsPanel(value, own) })[tab](user);
}

function profileDossier(user, own = false) {
  const level = heatMilestone(Number(user.heatScore || 0)); const stats = user.stats || {};
  const actions = own ? '<button class="quiet-action" type="button" data-open-settings>Edit profile</button><button class="icon-button" type="button" aria-label="Profile options">•••</button>' : `<button class="profile-follow-action ${user.isFollowing ? 'following' : ''}" type="button" data-follow-user="${user.id}">${user.isFollowing ? 'Following' : 'Follow'}</button>${user.requestIncoming ? `<button class="quiet-action" type="button" data-accept-friend="${user.friendshipId}">Accept friend</button>` : `<button class="quiet-action" type="button" data-friend-user="${user.id}" ${['accepted','pending'].includes(user.friendship) ? 'disabled' : ''}>${user.friendship === 'accepted' ? 'Friends ✓' : user.friendship === 'pending' ? 'Request pending' : 'Add friend'}</button>`}<button class="primary-action" type="button" data-message-user="${user.id}">Message</button>`;
  return `<section class="profile-dossier profile-bg-${escapeHtml(user.profileBackground || 'clean')} profile-effect-${escapeHtml(user.profileEffect || 'none')}" style="--profile-accent:${escapeHtml(user.themeColor || '#ff4713')}"><header class="dossier-toolbar"><span>USER PROFILE</span><div>${actions}</div></header><div class="dossier-identity"><div class="dossier-photo">${profileAvatar(user, 'dossier-avatar')}</div><div class="dossier-main"><div class="dossier-name"><h1>${escapeHtml(user.displayName || 'Callout member')}</h1><i class="status-dot ${escapeHtml(user.status || 'offline')}"></i></div><p>${escapeHtml(user.handle || '')}${user.pronouns ? ` · ${escapeHtml(user.pronouns)}` : ''}</p>${user.tagline ? `<blockquote>“${escapeHtml(user.tagline)}”</blockquote>` : ''}<button class="dossier-heat-card" type="button" data-open-heat><span>${calloutGlyph('personal')}</span><strong>${Number(user.heatScore || 0).toLocaleString()} HEAT</strong><small>${escapeHtml(level.name)} · Level ${level.level}</small><b>›</b></button><div class="dossier-stats"><span><small>RANK</small><strong>${user.heatRank ? `#${Number(user.heatRank).toLocaleString()}` : '—'}</strong></span><span><small>POSTS</small><strong>${Number(stats.posts || 0).toLocaleString()}</strong></span><span><small>HOT TAKES</small><strong>${Number(stats.hotTakeVotes || 0).toLocaleString()}</strong></span><button type="button" data-profile-connections="followers" data-profile-user="${user.id}"><small>FOLLOWERS</small><strong>${Number(stats.followers || 0).toLocaleString()}</strong></button><button type="button" data-profile-connections="following" data-profile-user="${user.id}"><small>FOLLOWING</small><strong>${Number(stats.following || 0).toLocaleString()}</strong></button></div><dl class="dossier-meta"><div><dt>JOINED</dt><dd>${new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</dd></div><div><dt>STATUS</dt><dd>${escapeHtml(String(user.status || 'offline').toUpperCase())}</dd></div>${user.location ? `<div><dt>LOCATION</dt><dd>${escapeHtml(user.location)}</dd></div>` : ''}</dl></div></div>${profileTabs()}${profileTabPanel(user, own)}${profileBadgeShelf(user)}</section>`;
}

function profileView() {
  if (!sessionUser) return `${pageHeader('PROFILE', 'Sign in to build your identity', 'Your Heat, badges, collections and activity live on your Callout profile.', '<button class="primary-action" data-go-auth>Sign in</button>')}`;
  const data = { ...state.profile, ...(state.ownProfileData || {}), socialLinks: { ...state.profile.socialLinks, ...(state.ownProfileData?.socialLinks || {}) } };
  return profileDossier(data, true);
}

function publicUserView() {
  const user = state.publicProfile; const id = decodeURIComponent(location.hash.split('/')[1] || '');
  if (!user || String(user.id) !== id) return pageHeader('PROFILE', 'Loading profile…', 'Fetching the latest public identity.');
  if (user.isAutomated) return `${profileDossier(user, false)}<aside class="info-callout"><strong>Automated account</strong><p>This profile is operated by Callout and is clearly excluded from Global Heat rank.</p></aside>`;
  return profileDossier(user, user.friendship === 'self');
}

function settingsView() {
  const settings = state.settings;
  const mode = ['customize', 'accessibility'].includes(currentRoute()) ? currentRoute() : 'settings';
  const checked = value => value ? 'checked' : '';
  return `${pageHeader('PREFERENCES', mode === 'customize' ? 'Customize' : mode === 'accessibility' ? 'Accessibility' : 'Settings', mode === 'customize' ? 'Edit your profile identity and visual preferences.' : mode === 'accessibility' ? 'Adjust theme, motion, text, and content visibility.' : 'Manage notifications, privacy, and account controls.')}
    <nav class="settings-subnav" aria-label="Settings sections"><a href="#settings" class="${mode === 'settings' ? 'active' : ''}">Settings</a><a href="#customize" class="${mode === 'customize' ? 'active' : ''}">Customize</a><a href="#accessibility" class="${mode === 'accessibility' ? 'active' : ''}">Accessibility</a></nav>
    <form class="settings-form settings-mode-${mode}" id="settingsForm">
      <section class="settings-section customization-studio"><div class="settings-section-head"><div><span class="settings-icon">✦</span><div><h2>Callout Style Studio</h2><p>Personalize your profile, feed, motion, and signature interactions.</p></div></div></div>
        <div class="customization-grid"><label>Color palette<select name="palette">${['callout','midnight','mint','violet','sunset'].map(value => `<option value="${value}" ${settings.palette === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Feed density<select name="feedDensity">${['compact','comfortable','spacious'].map(value => `<option value="${value}" ${settings.feedDensity === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Vote animation<select name="voteEffect">${['pop','confetti','pulse','none'].map(value => `<option value="${value}" ${settings.voteEffect === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Notification sound<select name="notificationSound">${['callout','spark','soft','none'].map(value => `<option value="${value}" ${settings.notificationSound === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Profile effect<select name="profileEffect">${['none','glow','bubbles','spotlight','confetti'].map(value => `<option value="${value}" ${state.profile.profileEffect === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Profile background<select name="profileBackground">${['clean','grid','waves','stars','noise'].map(value => `<option value="${value}" ${state.profile.profileBackground === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Take showcase<select name="showcaseMode">${['featured','popular','controversial','recent'].map(value => `<option value="${value}" ${state.profile.showcaseMode === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div>
        <label class="setting-row"><span><strong>Reduced motion</strong><small>Disable profile effects and animated feedback.</small></span><input class="switch-input" type="checkbox" name="reducedMotion" ${checked(settings.reducedMotion)} /><i></i></label>
        <label>Hidden feed topics<input name="hiddenTopics" value="${escapeHtml((settings.hiddenTopics || []).join(', '))}" placeholder="e.g. remakes, spoilers, celebrity news" /><small>Comma-separated topics you do not want in your feed.</small></label>
        <fieldset class="cosmetic-collection"><legend>Unlocked cosmetic collection</legend><div>${Object.entries(state.profile.cosmeticUnlocks || {}).map(([kind, values]) => `<article><strong>${escapeHtml(kind)}</strong>${values.map(value => `<span>${escapeHtml(value)}</span>`).join('')}</article>`).join('')}</div></fieldset>
      </section>
      <section class="settings-section"><div class="settings-section-head"><div><span class="settings-icon">◐</span><div><h2>Appearance</h2><p>Choose how Callout looks on this device.</p></div></div></div>
        <div class="theme-options" role="radiogroup" aria-label="Theme"><label><input type="radio" name="theme" value="light" ${checked(settings.theme === 'light')} /><span>☀<strong>Light</strong><small>Bright and crisp</small></span></label><label><input type="radio" name="theme" value="dark" ${checked(settings.theme === 'dark')} /><span>◐<strong>Dark</strong><small>Easy on the eyes</small></span></label><label><input type="radio" name="theme" value="system" ${checked(settings.theme === 'system')} /><span>◫<strong>System</strong><small>Match your device</small></span></label></div>
      </section>
      <section class="settings-section"><div class="settings-section-head"><div><span class="settings-icon">♢</span><div><h2>Notification preferences</h2><p>Choose what deserves your attention.</p></div></div></div>
        <div class="setting-rows"><label class="setting-row"><span><strong>Likes</strong><small>Votes on your posts</small></span><input class="switch-input" type="checkbox" name="notifyLikes" ${checked(settings.notifications.likes)} /><i></i></label><label class="setting-row"><span><strong>Takes</strong><small>Replies and comments</small></span><input class="switch-input" type="checkbox" name="notifyComments" ${checked(settings.notifications.comments)} /><i></i></label><label class="setting-row"><span><strong>Guild activity</strong><small>Invites and community updates</small></span><input class="switch-input" type="checkbox" name="notifyGuildInvites" ${checked(settings.notifications.guildInvites)} /><i></i></label><label class="setting-row"><span><strong>In-app delivery</strong></span><input class="switch-input" type="checkbox" name="deliveryInApp" ${checked(settings.notificationDelivery?.inApp)} /><i></i></label><label class="setting-row"><span><strong>Push delivery</strong></span><input class="switch-input" type="checkbox" name="deliveryPush" ${checked(settings.notificationDelivery?.push)} /><i></i></label><label class="setting-row"><span><strong>Email delivery</strong></span><input class="switch-input" type="checkbox" name="deliveryEmail" ${checked(settings.notificationDelivery?.email)} /><i></i></label></div>
      </section>
      <section class="settings-section"><div class="settings-section-head"><div><span class="settings-icon">⌁</span><div><h2>Privacy</h2><p>Control who can reach you directly.</p></div></div></div>
        <label class="select-setting">Who can send you Direct Messages?<select name="directMessages"><option value="everyone" ${settings.directMessages === 'everyone' ? 'selected' : ''}>Everyone</option><option value="guilds" ${settings.directMessages === 'guilds' ? 'selected' : ''}>Guild Members Only</option><option value="nobody" ${settings.directMessages === 'nobody' ? 'selected' : ''}>Nobody</option></select></label>
      </section>
      <section class="settings-section"><div class="settings-section-head"><div><span class="settings-icon">Aa</span><div><h2>Display options</h2><p>Set the text size used for feed content.</p></div></div></div>
        <div class="text-size-options" role="radiogroup" aria-label="Feed text size"><label><input type="radio" name="textSize" value="small" ${checked(settings.textSize === 'small')} /><span>Small</span></label><label><input type="radio" name="textSize" value="medium" ${checked(settings.textSize === 'medium')} /><span>Medium</span></label><label><input type="radio" name="textSize" value="large" ${checked(settings.textSize === 'large')} /><span>Large</span></label></div>
      </section>
      <section class="settings-section"><div class="settings-section-head"><div><span class="settings-icon">✎</span><div><h2>Profile customization</h2><p>Build a profile that feels distinctly yours.</p></div></div></div>
        <div class="profile-live-preview" id="profilePreview" style="--profile-accent:${escapeHtml(state.profile.themeColor)}"><div class="preview-banner" id="bannerPreview">${state.profile.bannerUrl ? `<img src="${escapeHtml(state.profile.bannerUrl)}" alt="Banner preview" />` : ''}</div><div>${avatarMarkup('preview-avatar')}<span><strong id="previewName">${escapeHtml(state.profile.displayName)}</strong><small id="previewStatus">${escapeHtml(state.profile.status)}</small></span><b>${Number(state.profile.heatScore || 0).toLocaleString()} HEAT</b></div></div>
        <div class="form-grid"><label>Display name<input name="displayName" maxlength="40" value="${escapeHtml(state.profile.displayName)}" required /></label><label>Username<input name="handle" maxlength="30" value="${escapeHtml(state.profile.handle)}" required /></label><label>Pronouns<input name="pronouns" maxlength="40" value="${escapeHtml(state.profile.pronouns)}" placeholder="e.g. they/them" /></label><label>Online status<select name="status"><option value="online" ${state.profile.status === 'online' ? 'selected' : ''}>Online</option><option value="idle" ${state.profile.status === 'idle' ? 'selected' : ''}>Idle</option><option value="dnd" ${state.profile.status === 'dnd' ? 'selected' : ''}>Do Not Disturb</option><option value="invisible" ${state.profile.status === 'invisible' ? 'selected' : ''}>Invisible</option></select></label><label>Profile tagline<input name="tagline" maxlength="80" value="${escapeHtml(state.profile.tagline || '')}" placeholder="One line that sounds like you" /></label><label>Location<input name="location" maxlength="80" value="${escapeHtml(state.profile.location || '')}" placeholder="City, country or anywhere you claim" /></label></div>
        <div class="form-grid"><label>Profile banner<input id="bannerUpload" type="file" accept="image/*" /><small>PNG, JPG, GIF, or WebP. Maximum 2 MB.</small></label><label>Avatar or animated GIF<input id="avatarUpload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /><small>Animated GIF avatars are supported. Maximum 2 MB.</small></label><label>Theme color<div class="color-control"><input name="themeColor" type="color" value="${escapeHtml(state.profile.themeColor)}" /><output id="colorHex">${escapeHtml(state.profile.themeColor)}</output></div></label><label>Avatar frame<select name="avatarFrame">${['none','spark','gold','violet','flame'].map(frame => `<option value="${frame}" ${state.profile.avatarFrame === frame ? 'selected' : ''}>${frame}</option>`).join('')}</select></label></div>
        <input type="hidden" name="bannerUrl" value="${escapeHtml(state.profile.bannerUrl)}" /><input type="hidden" name="avatarUrl" value="${escapeHtml(state.profile.avatarUrl)}" />
        <label>About Me <span class="field-counter" id="bioCounter">${state.profile.bio.length} / 1000</span><textarea name="bio" maxlength="1000" placeholder="Use **bold**, *italic*, and line breaks to tell your story.">${escapeHtml(state.profile.bio)}</textarea></label>
        <div class="profile-privacy-grid"><label>Who can see About?<select name="aboutVisibility"><option value="public" ${state.profile.profileVisibility?.about === 'public' ? 'selected' : ''}>Public</option><option value="friends" ${state.profile.profileVisibility?.about === 'friends' ? 'selected' : ''}>Friends</option><option value="private" ${state.profile.profileVisibility?.about === 'private' ? 'selected' : ''}>Private</option></select><small>Controls your bio, tagline, location and social links.</small></label><label>Who can see Activity?<select name="activityVisibility"><option value="public" ${state.profile.profileVisibility?.activity === 'public' ? 'selected' : ''}>Public</option><option value="friends" ${state.profile.profileVisibility?.activity === 'friends' ? 'selected' : ''}>Friends</option><option value="private" ${state.profile.profileVisibility?.activity === 'private' ? 'selected' : ''}>Private</option></select><small>Your individual voting choices are never shown.</small></label></div>
        <div class="social-fields"><h3>Social media</h3><label><span>𝕏</span><input name="twitter" value="${escapeHtml(state.profile.socialLinks.twitter)}" placeholder="x.com/username" /></label><label><span>◎</span><input name="instagram" value="${escapeHtml(state.profile.socialLinks.instagram)}" placeholder="instagram.com/username" /></label><label><span>◈</span><input name="discord" value="${escapeHtml(state.profile.socialLinks.discord)}" placeholder="Discord username" /></label><label><span>▶</span><input name="youtube" value="${escapeHtml(state.profile.socialLinks.youtube)}" placeholder="youtube.com/@channel" /></label><label><span>◉</span><input name="twitch" value="${escapeHtml(state.profile.socialLinks.twitch)}" placeholder="twitch.tv/username" /></label><label><span>↗</span><input name="custom" value="${escapeHtml(state.profile.socialLinks.custom)}" placeholder="https://your-site.example" /></label></div>
      </section>
      <section class="settings-section"><div class="settings-section-head"><div><span class="settings-icon">⊘</span><div><h2>Blocked & muted users</h2><p>Accounts you have restricted will be listed here.</p></div></div></div>
        <div class="blocked-list">${settings.blockedUsers.length ? settings.blockedUsers.map(user => `<div><span class="skeleton-avatar small"></span><strong>${escapeHtml(user)}</strong><button type="button" data-unblock="${escapeHtml(user)}">Unblock</button></div>`).join('') : '<div class="blocked-empty"><span class="skeleton-avatar small"></span><span><strong>No blocked accounts</strong><small>Blocked users will appear here.</small></span><button type="button" disabled>Unblock</button></div>'}</div>
      </section>
      <div class="settings-save"><span>Preferences are saved on this device.</span><button class="primary-action" type="submit">Save settings</button></div>
    </form>`;
}

function adminBigPatchView() {
  const controls = state.adminBigPatch || { staff: [], audit: [], features: [] };
  return `<section class="big-patch-admin"><header><div><span class="section-kicker">PRODUCT CONTROL</span><h2>Big Patch Console</h2><p>Server-enforced staff tools, beta controls, Topics, Project Wall, and immutable activity history.</p></div><span class="admin-lock">${escapeHtml(sessionUser?.staffRole || 'ADMIN')}</span></header>
    <div class="admin-beta-grid"><form id="adminTopicForm"><strong>Create Limited-Time Topic</strong><input name="title" maxlength="100" required placeholder="Topic title" /><textarea name="description" maxlength="500" placeholder="What is this moment about?"></textarea><div><label>Starts<input name="startsAt" type="datetime-local" required /></label><label>Ends<input name="endsAt" type="datetime-local" required /></label></div><button class="primary-action" type="submit">Schedule Topic</button></form>
    <form id="adminAboutForm"><strong>Publish Project Wall update</strong><input name="title" maxlength="120" required placeholder="Update title" /><textarea name="body" maxlength="4000" required placeholder="Truthful project update"></textarea><div><select name="label"><option value="building">Building</option><option value="shipped">Shipped</option><option value="milestone">Milestone</option><option value="coming_soon">Coming soon</option></select><label><input name="pinned" type="checkbox" /> Pin</label></div><button class="primary-action" type="submit">Publish update</button></form></div>
    <section class="feature-kills"><header><strong>Beta flags & emergency kill switches</strong><small>Owner changes are saved server-side and audited.</small></header><div>${controls.features.map(feature => `<label><span><b>${escapeHtml(feature.key)}</b><small>${feature.overridden ? 'Override active' : `Default: ${feature.defaultEnabled ? 'on' : 'off'}`}</small></span><input type="checkbox" data-feature-control="${escapeHtml(feature.key)}" ${feature.enabled ? 'checked' : ''} ${sessionUser?.staffRole !== 'owner' ? 'disabled' : ''} /></label>`).join('')}</div></section>
    <div class="admin-ops-grid"><section><h3>Staff roles</h3>${controls.staff.map(user => `<article><span class="avatar">${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />` : escapeHtml((user.displayName || 'C').charAt(0))}</span><span><b>${escapeHtml(user.displayName)}</b><small>${escapeHtml(user.handle || user.email || '')}</small></span><strong>${escapeHtml(user.staffRole)}</strong></article>`).join('') || '<p>No persisted staff role records. Environment owners remain active.</p>'}</section><section><h3>Latest audit events</h3>${controls.audit.slice(0, 12).map(item => `<article><span><b>${escapeHtml(item.action)}</b><small>${escapeHtml(item.targetType)} · ${new Date(item.createdAt).toLocaleString()}</small></span><strong>${escapeHtml(item.actor?.displayName || 'Staff')}</strong></article>`).join('') || '<p>No audited changes yet.</p>'}</section></div>
  </section>`;
}

function botAdminControlView() {
  const automation = state.botAutomation || { bots: [], intervalMinutes: 360 };
  return `<section class="bot-admin"><header><div><span class="section-kicker">COMMUNITY AUTOMATION</span><h2>Automated hosts</h2><p>Clearly labelled accounts using original curated opinions. One action at most every ${Number(automation.intervalMinutes)} minutes.</p></div><button class="primary-action" type="button" data-run-bots>Run one action</button></header><div>${automation.bots.map(bot => `<article><span class="avatar">${bot.avatarUrl ? `<img src="${escapeHtml(bot.avatarUrl)}" alt="" />` : escapeHtml((bot.displayName || 'B').charAt(0))}</span><div><strong>${escapeHtml(bot.displayName)}</strong><small>${escapeHtml(bot.handle)} · ${escapeHtml(bot.persona || '')}</small><span>${bot.lastRunAt ? `Last active ${timeLabel(new Date(bot.lastRunAt).getTime())}` : 'Ready for first activity'} · ${Number(bot.postCount || 0)} posts</span></div><label class="bot-toggle"><input type="checkbox" data-toggle-bot="${bot.id}" ${bot.enabled ? 'checked' : ''} /><i></i><span>${bot.enabled ? 'Active' : 'Paused'}</span></label></article>`).join('') || '<p>Automated accounts are being initialized.</p>'}</div></section>`;
}

function adminPostConsoleView() {
  return `<section class="admin-post-console"><header><div><span class="section-kicker">CONTENT CORRECTIONS</span><h2>Post control console</h2><p>Edit published wording, category, or visibility. Votes and views are genuine activity and cannot be manually changed.</p></div><span class="admin-lock">OWNER ONLY</span></header><div>${state.posts.map(post => `<details><summary><span>${postAvatarMarkup(post)}</span><span><strong>${escapeHtml(post.text.slice(0, 85) || 'Media post')}</strong><small>${escapeHtml(post.authorHandle)} · ${Number(post.impressions).toLocaleString()} real views · ${Number(post.alrightVotes + post.cringeVotes).toLocaleString()} account votes</small></span><b>EDIT</b></summary><form data-admin-post-form="${post.id}"><label>Post content<textarea name="content" maxlength="2000" required>${escapeHtml(post.text)}</textarea></label><div class="admin-post-fields"><label>Category<select name="category">${['Movies','Music','Entertainment','Games','Life'].map(value => `<option ${post.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Visibility<select name="visibility"><option value="public" ${post.visibility === 'public' ? 'selected' : ''}>Public</option><option value="friends" ${post.visibility === 'friends' ? 'selected' : ''}>Friends</option></select></label></div><div class="admin-post-actions"><button type="button" data-open-admin-post="${post.id}">Open post</button><button class="primary-action" type="submit">Save corrections</button></div></form></details>`).join('') || '<p class="admin-console-empty">No published posts are available.</p>'}</div></section>`;
}

function adminControlView() {
  if (!sessionUser) return emptyState('↗', 'Sign in required', 'Admin Control is restricted to the Callout owner.', '<button class="primary-action" type="button" data-go-auth>Sign in</button>');
  if (!sessionUser.isAdmin) return emptyState('🔒', 'Owner access required', 'This private console is available only to the account configured as the Callout owner.');
  if (state.adminError) return `${pageHeader('OWNER ONLY', 'Admin Control', 'Product controls, moderation, automation, and audit history.')}<section class="analytics-setup"><strong>Admin data unavailable</strong><p>${escapeHtml(state.adminError)}</p><button class="quiet-action" type="button" data-refresh-admin>Try again</button></section>`;
  const controls = state.adminBigPatch || { staff: [], audit: [], features: [] };
  const section = location.hash.split('/')[1] || 'overview';
  const tabs = [
    ['overview', 'Overview'], ['people', 'People & Staff'], ['content', 'Content'],
    ['anonymous', 'Anonymous'], ['topics', 'Topics'], ['guilds', 'Guilds'],
    ['battles', 'Battles'], ['reports', 'Reports'], ['audit', 'Audit Log']
  ];
  const summary = [
    ['People', state.leaderboard.length], ['Posts', state.posts.length], ['Signals', state.anonymousPosts.length],
    ['Topics', state.topics.length], ['Guilds', state.guilds.length], ['Battles', state.battles.length]
  ];
  const featureControls = `<section class="feature-kills admin-console-block"><header><strong>Beta flags & emergency kill switches</strong><small>Every owner change is saved server-side and audited.</small></header><div>${controls.features.map(feature => `<label><span><b>${escapeHtml(feature.key)}</b><small>${feature.overridden ? 'Override active' : `Default: ${feature.defaultEnabled ? 'on' : 'off'}`}</small></span><input type="checkbox" data-feature-control="${escapeHtml(feature.key)}" ${feature.enabled ? 'checked' : ''} /></label>`).join('')}</div></section>`;
  const topicColumn = (title, kind, items) => `<section class="admin-topic-column"><header><span><i></i><strong>${title}</strong></span><b>${items.length}</b></header><div>${items.length ? items.map(topic => `<article style="--topic-accent:${escapeHtml(topic.accentColor || '#7444e8')}">${topic.artworkUrl ? `<img src="${escapeHtml(topic.artworkUrl)}" alt="" />` : '<span class="topic-fallback">◉</span>'}<div><small>${escapeHtml(kind)}</small><strong>${escapeHtml(topic.title)}</strong><p>${escapeHtml(topic.description || 'No description yet.')}</p><time>${new Date(topic.startsAt).toLocaleDateString()} – ${new Date(topic.endsAt).toLocaleDateString()}</time></div><button type="button" data-open-topic="${topic.id}">${kind === 'VAULTED' ? 'Open Vault' : 'View Topic'}</button></article>`).join('') : `<p class="mini-empty">No ${title.toLowerCase()}.</p>`}</div></section>`;
  const topicManager = `<section class="admin-topic-manager"><div class="admin-topic-board">${topicColumn('Live now', 'LIVE', state.topics.filter(topic => topic.state === 'live'))}${topicColumn('Scheduled', 'UPCOMING', state.topics.filter(topic => topic.state === 'scheduled'))}${topicColumn('Time Vaults', 'VAULTED', state.topics.filter(topic => topic.state === 'vaulted'))}</div><form class="admin-topic-editor" id="adminTopicForm"><span class="section-kicker">TOPIC EDITOR</span><h2>Create Limited-Time Topic</h2><label>Title<input name="title" maxlength="100" required placeholder="Topic title" /></label><label>Description<textarea name="description" maxlength="500" placeholder="What is this moment about?"></textarea></label><div><label>Start time<input name="startsAt" type="datetime-local" required /></label><label>End time<input name="endsAt" type="datetime-local" required /></label></div><button class="primary-action" type="submit">Schedule Topic</button></form></section>`;
  const staff = `<section class="admin-console-block"><header><div><span class="section-kicker">AUTHORIZED ACCOUNTS</span><h2>People & Staff</h2></div><span class="admin-lock">OWNER MANAGED</span></header><div class="admin-staff-list">${controls.staff.map(user => `<article><span class="avatar heat-frame ${escapeHtml(user.heatTier?.className || 'heat-fresh')}">${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />` : escapeHtml((user.displayName || 'C').charAt(0))}</span><div><strong>${escapeHtml(user.displayName)}</strong><small>${escapeHtml(user.handle || user.email || '')}</small></div><b>${escapeHtml(user.staffRole)}</b></article>`).join('') || '<p>Only the configured owner account has console access.</p>'}</div><aside class="admin-security-note"><strong>Private console rule</strong><p>Analytics, automation, monetisation, and product controls are restricted to the email configured in <code>ADMIN_EMAILS</code>. Ordinary accounts never appear here.</p></aside></section>`;
  const anonymous = `<section class="admin-console-block"><header><div><span class="section-kicker">MODERATION</span><h2>Anonymous Signals</h2></div><b>${state.anonymousPosts.length}</b></header><p class="admin-section-copy">Public responses never contain the real author. Use “Inspect Signal” from a post menu only when moderation requires it; every lookup is permanently audited.</p><div class="admin-signal-grid">${state.anonymousPosts.map(post => `<article><span>${escapeHtml(post.anonymousCode || 'SIGNAL')}</span><strong>${escapeHtml(post.text.slice(0, 110))}</strong><button type="button" data-open-take="${post.id}">Open Signal</button></article>`).join('') || '<p>No anonymous posts require review.</p>'}</div></section>`;
  const guildAdmin = `<section class="admin-console-block"><header><div><span class="section-kicker">COMMUNITIES</span><h2>Guild oversight</h2></div><b>${state.guilds.length}</b></header><div class="admin-entity-grid">${state.guilds.map(guild => `<article><span class="avatar">${guild.iconUrl ? `<img src="${escapeHtml(guild.iconUrl)}" alt="" />` : escapeHtml(guild.name.charAt(0))}</span><div><strong>${escapeHtml(guild.name)}</strong><small>${Number(guild.memberCount || 0)} members · ${escapeHtml(guild.privacy || 'public')}</small></div><button type="button" data-open-guild="${guild.id}">Open</button></article>`).join('') || '<p>No guilds yet.</p>'}</div></section>`;
  const battleAdmin = `<section class="admin-console-block"><header><div><span class="section-kicker">TOURNAMENTS</span><h2>Battle control</h2></div><button class="primary-action" type="button" data-route-button="battles">Open public Battles</button></header><div class="admin-entity-grid">${state.battles.map(battle => `<article><span class="admin-entity-icon">⚔</span><div><strong>${escapeHtml(battle.title)}</strong><small>${battle.size}-entry · ${escapeHtml(battle.status)}</small></div><b>${escapeHtml(battle.status)}</b></article>`).join('') || '<p>No Battles have been created yet.</p>'}</div></section>`;
  const audit = `<section class="admin-console-block"><header><div><span class="section-kicker">IMMUTABLE HISTORY</span><h2>Audit Log</h2></div><b>${controls.audit.length}</b></header><div class="admin-audit-table">${controls.audit.map(item => `<article><span>${escapeHtml(item.action)}</span><small>${escapeHtml(item.targetType)} · ${escapeHtml(item.targetId || 'platform')}</small><strong>${escapeHtml(item.actor?.displayName || 'Owner')}</strong><time>${new Date(item.createdAt).toLocaleString()}</time></article>`).join('') || '<p>No audited actions yet.</p>'}</div></section>`;
  const aboutEditor = `<form class="admin-console-block admin-about-editor" id="adminAboutForm"><span class="section-kicker">PROJECT WALL</span><h2>Publish official update</h2><input name="title" maxlength="120" required placeholder="Update title" /><textarea name="body" maxlength="4000" required placeholder="Truthful project update"></textarea><div><select name="label"><option value="building">Building</option><option value="shipped">Shipped</option><option value="milestone">Milestone</option><option value="coming_soon">Coming soon</option></select><label><input name="pinned" type="checkbox" /> Pin update</label></div><button class="primary-action" type="submit">Publish update</button></form>`;
  const reports = `<section class="admin-console-block">${emptyState('⚑', 'No open reports', 'User reports and their moderation status will appear here without exposing unrelated private account data.')}</section>`;
  const views = {
    overview: `<section class="admin-overview-grid">${summary.map(([label, value]) => `<article><small>${label}</small><strong>${Number(value).toLocaleString()}</strong></article>`).join('')}</section>${featureControls}${botAdminControlView()}`,
    people: staff, content: `${adminPostConsoleView()}${aboutEditor}`, anonymous, topics: topicManager,
    guilds: guildAdmin, battles: battleAdmin, reports, audit
  };
  return `<section class="admin-console-shell"><header><span class="section-kicker">ADMIN CONSOLE · OWNER ONLY</span><h1>${escapeHtml(tabs.find(([key]) => key === section)?.[1] || 'Overview')}</h1><p>Private Callout operations, kept separate from website analytics.</p></header><nav class="admin-console-tabs">${tabs.map(([key, label]) => `<button type="button" class="${section === key ? 'active' : ''}" data-admin-section="${key}">${label}</button>`).join('')}</nav><div class="admin-console-view">${views[section] || views.overview}</div></section>`;
}

function analyticsView() {
  if (!sessionUser) return emptyState('↗', 'Sign in required', 'The analytics dashboard is restricted to the Callout administrator.', '<button class="primary-action" type="button" data-go-auth>Sign in</button>');
  if (!sessionUser.isAdmin) return emptyState('🔒', 'Admin access required', 'Traffic and performance data is private and is not available to standard accounts.');
  if (state.analyticsError) return `${pageHeader('PRIVATE DASHBOARD', 'Analytics', 'Google Analytics traffic and performance reporting.')}<section class="analytics-setup"><strong>Analytics API unavailable</strong><p>${escapeHtml(state.analyticsError)}</p><button class="quiet-action" type="button" data-refresh-analytics>Try again</button></section>`;
  if (!state.analytics) return `${pageHeader('PRIVATE DASHBOARD', 'Analytics', 'Loading Google Analytics traffic and performance data.')}<section class="analytics-loading"><span></span><span></span><span></span></section>`;
  if (!state.analytics.configured) return `${pageHeader('PRIVATE DASHBOARD', 'Analytics', 'Google Analytics traffic and performance reporting.')}<section class="analytics-setup"><span class="settings-icon">GA</span><div><strong>Connect the Analytics Data API</strong><p>Tracking can run with a Measurement ID. Dashboard reporting additionally requires the property ID and a read-only service account.</p><code>GA_PROPERTY_ID · GA_CLIENT_EMAIL · GA_PRIVATE_KEY</code></div></section>`;

  const analytics = state.analytics;
  const adsense = analytics.adsense || {};
  const summary = analytics.summary || {};
  const maxViews = Math.max(1, ...(analytics.daily || []).map(item => item.screenPageViews));
  const cards = [
    ['Active users', summary.activeUsers, 'People who engaged'], ['Sessions', summary.sessions, 'Visits'],
    ['Page views', summary.screenPageViews, 'Pages viewed'], ['New users', summary.newUsers, 'First-time visitors'],
    ['Engagement', `${(Number(summary.engagementRate || 0) * 100).toFixed(1)}%`, 'Engaged sessions'],
    ['Avg. session', `${Math.round(Number(summary.averageSessionDuration || 0))}s`, 'Average duration']
  ];
  const table = (rows, kind) => rows.length ? rows.map((row, index) => kind === 'pages'
    ? `<tr><td>${index + 1}</td><td title="${escapeHtml(row.path)}">${escapeHtml(row.path)}</td><td>${Number(row.screenPageViews).toLocaleString()}</td><td>${Number(row.activeUsers).toLocaleString()}</td></tr>`
    : `<tr><td>${index + 1}</td><td>${escapeHtml(row.channel)}</td><td>${Number(row.sessions).toLocaleString()}</td><td>${Number(row.activeUsers).toLocaleString()}</td></tr>`).join('') : '<tr><td colspan="4">No data has been collected for this range yet.</td></tr>';
  const money = value => new Intl.NumberFormat(undefined, { style: 'currency', currency: adsense.currencyCode || 'EUR', maximumFractionDigits: 2 }).format(Number(value || 0));
  const siteStatus = String(adsense.siteStatus || 'GETTING_READY').replaceAll('_', ' ').toLowerCase();
  const adsenseSection = adsense.connected
    ? `<section class="adsense-analytics"><header><div><span class="section-kicker">MONETISATION</span><h2>AdSense earnings</h2></div><span class="adsense-status ${adsense.siteStatus === 'READY' ? 'ready' : 'pending'}">${escapeHtml(siteStatus)}</span></header><div class="adsense-metrics"><article><small>Estimated earnings</small><strong>${money(adsense.summary?.estimatedEarnings)}</strong><span>${state.analyticsDays}-day estimate</span></article><article><small>Ad impressions</small><strong>${Number(adsense.summary?.impressions || 0).toLocaleString()}</strong><span>Paid ad displays</span></article><article><small>Ad clicks</small><strong>${Number(adsense.summary?.clicks || 0).toLocaleString()}</strong><span>Valid clicks</span></article><article><small>Impression RPM</small><strong>${money(adsense.summary?.impressionsRpm)}</strong><span>Revenue per 1,000 impressions</span></article></div><p>Figures come directly from Google AdSense and may be adjusted after invalid-traffic checks.</p></section>`
    : `<section class="adsense-analytics adsense-connect"><header><div><span class="section-kicker">MONETISATION</span><h2>AdSense earnings</h2></div><span class="adsense-status pending">${escapeHtml(siteStatus)}</span></header><div><strong>${adsense.error ? 'AdSense needs to be reconnected' : 'Google is reviewing Callout'}</strong><p>${adsense.error ? escapeHtml(adsense.error) : 'Paid ads cannot appear until Google changes the site from Getting ready to Ready. Connect the read-only reporting API now so earnings will appear here automatically after approval.'}</p><a class="primary-action" href="/api/admin/reporting/connect">Connect AdSense reporting</a></div></section>`;
  const automation = state.botAutomation || { bots: [], intervalMinutes: 360 };
  const botsSection = `<section class="bot-admin"><header><div><span class="section-kicker">COMMUNITY AUTOMATION</span><h2>Automated hosts</h2><p>Clearly labelled accounts using original curated opinions. One action at most every ${Number(automation.intervalMinutes)} minutes.</p></div><button class="primary-action" type="button" data-run-bots>Run one action</button></header><div>${automation.bots.map(bot => `<article><span class="avatar">${escapeHtml((bot.displayName || 'B').charAt(0))}</span><div><strong>${escapeHtml(bot.displayName)}</strong><small>${escapeHtml(bot.handle)} · ${escapeHtml(bot.persona || '')}</small><span>${bot.lastRunAt ? `Last active ${timeLabel(new Date(bot.lastRunAt).getTime())}` : 'Ready for first activity'} · ${Number(bot.postCount || 0)} posts</span></div><label class="bot-toggle"><input type="checkbox" data-toggle-bot="${bot.id}" ${bot.enabled ? 'checked' : ''} /><i></i><span>${bot.enabled ? 'Active' : 'Paused'}</span></label></article>`).join('') || '<p>Automated accounts are being initialized.</p>'}</div></section>`;
  const postConsole = `<section class="admin-post-console"><header><div><span class="section-kicker">ADMIN CORRECTIONS</span><h2>Post control console</h2><p>Edit published post copy and public counters. Changes are protected by server-side administrator checks and retain real user vote records.</p></div><span class="admin-lock">ADMIN ONLY</span></header><div>${state.posts.map(post => `<details><summary><span>${postAvatarMarkup(post)}</span><span><strong>${escapeHtml(post.text.slice(0, 85) || 'Media post')}</strong><small>${escapeHtml(post.authorHandle)} · ${Number(post.impressions).toLocaleString()} views · ${Number(post.alrightVotes).toLocaleString()} Based · ${Number(post.cringeVotes).toLocaleString()} Hot Take</small></span><b>EDIT</b></summary><form data-admin-post-form="${post.id}"><label>Post content<textarea name="content" maxlength="2000" required>${escapeHtml(post.text)}</textarea></label><div class="admin-post-fields"><label>Category<select name="category">${['Movies','Music','Entertainment','Games','Life'].map(value => `<option ${post.category === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Visibility<select name="visibility"><option value="public" ${post.visibility === 'public' ? 'selected' : ''}>Public</option><option value="friends" ${post.visibility === 'friends' ? 'selected' : ''}>Friends</option></select></label><label>Views<input name="impressions" type="number" min="0" max="1000000000" value="${Number(post.impressions || 0)}" required /></label><label>Based votes<input name="basedVotes" type="number" min="0" max="1000000000" value="${Number(post.alrightVotes || 0)}" required /></label><label>Hot Take votes<input name="cringeVotes" type="number" min="0" max="1000000000" value="${Number(post.cringeVotes || 0)}" required /></label></div><div class="admin-post-actions"><button type="button" data-open-admin-post="${post.id}">Open post</button><button class="primary-action" type="submit">Save corrections</button></div></form></details>`).join('') || '<p class="admin-console-empty">No published posts are available.</p>'}</div></section>`;
  return `${pageHeader('PRIVATE DASHBOARD', 'Analytics', 'Traffic, acquisition, and performance data from Google Analytics and AdSense.', `<button class="quiet-action" type="button" data-refresh-analytics>Refresh</button>`)}
    <div class="analytics-toolbar"><div class="analytics-ranges">${[7,28,90].map(days => `<button type="button" data-analytics-days="${days}" class="${state.analyticsDays === days ? 'active' : ''}">${days} days</button>`).join('')}</div><span><i></i><strong>${Number(analytics.realtime?.activeUsers || 0)}</strong> active now</span></div>
    <section class="analytics-cards">${cards.map(([label,value,note]) => `<article><small>${label}</small><strong>${typeof value === 'number' ? value.toLocaleString() : value}</strong><span>${note}</span></article>`).join('')}</section>
    ${adsenseSection}
    <section class="analytics-chart"><header><div><span class="section-kicker">TRAFFIC TREND</span><h2>Daily page views</h2></div><small>Updated ${new Date(analytics.generatedAt).toLocaleString()}</small></header><div class="analytics-bars">${(analytics.daily || []).map(item => `<div title="${item.date}: ${item.screenPageViews} views"><span style="height:${Math.max(4, item.screenPageViews / maxViews * 100)}%"></span><small>${item.date.slice(5)}</small></div>`).join('') || '<p>No daily traffic yet.</p>'}</div></section>
    <section class="analytics-tables"><article><header><span class="section-kicker">CONTENT</span><h2>Top pages</h2></header><div class="analytics-table-scroll"><table><thead><tr><th>#</th><th>Path</th><th>Views</th><th>Users</th></tr></thead><tbody>${table(analytics.pages || [], 'pages')}</tbody></table></div></article><article><header><span class="section-kicker">ACQUISITION</span><h2>Traffic channels</h2></header><div class="analytics-table-scroll"><table><thead><tr><th>#</th><th>Channel</th><th>Sessions</th><th>Users</th></tr></thead><tbody>${table(analytics.channels || [], 'channels')}</tbody></table></div></article></section>`;
}

function authView() {
  if (sessionUser) return `${pageHeader('SECURITY', 'Account access', 'Your session is protected by short-lived HTTP-only cookies.')}<section class="auth-session-card">${sessionUser.avatarUrl ? `<span class="avatar"><img src="${escapeHtml(sessionUser.avatarUrl)}" alt="" /></span>` : '<span class="avatar">✓</span>'}<div><span class="section-kicker">SIGNED IN</span><h2>${escapeHtml(sessionUser.displayName)}</h2><p>${escapeHtml(sessionUser.email)}</p></div><button class="quiet-action" type="button" data-logout>Sign out</button></section>`;
  return `${pageHeader('SECURE ACCESS', 'Join Callout', 'Sign in with email or Google. Authentication tokens are never stored in localStorage.')}
    <section class="auth-grid"><form class="auth-card" id="loginForm"><span class="section-kicker">WELCOME BACK</span><h2>Sign in</h2><label>Email<input type="email" name="email" autocomplete="email" required /></label><label>Password<input type="password" name="password" autocomplete="current-password" required minlength="8" /></label><button class="primary-action" type="submit">Sign in</button><a class="google-auth" href="/api/auth/google">G&nbsp; Continue with Google</a></form>
    <form class="auth-card" id="signupForm"><span class="section-kicker">NEW ACCOUNT</span><h2>Create account</h2><label>Display name<input name="displayName" maxlength="40" required /></label><label>Email<input type="email" name="email" autocomplete="email" required /></label><label>Password<input type="password" name="password" autocomplete="new-password" required minlength="8" /></label><label class="age-check"><input type="checkbox" name="ageConfirmed" required /><span>I confirm I am 13 years or older.</span></label><button class="primary-action" type="submit">Create account</button><a class="google-auth" href="/api/auth/google">G&nbsp; Sign up with Google</a></form></section>
    <details class="reset-panel"><summary>Forgot your password?</summary><form id="resetRequestForm"><label>Email<input type="email" name="email" required /></label><button class="quiet-action" type="submit">Request reset</button></form><form id="resetConfirmForm" hidden><label>Email<input type="email" name="email" required /></label><label>Reset token<input name="token" required /></label><label>New password<input type="password" name="password" minlength="8" required /></label><button class="primary-action" type="submit">Update password</button></form></details>`;
}

const viewRenderers = { home: homeExperienceView, trending: trendingView, topics: topicsView, battles: battlesView, guilds: guildsView, guild: guildDetailView, ideas: ideasView, leaderboards: rankingsExperienceView, heat: heatLevelView, notifications: notificationsView, messages: messagesView, saved: savedView, profile: profileView, user: publicUserView, settings: settingsView, customize: settingsView, accessibility: settingsView, analytics: analyticsView, admin: adminControlView, about: aboutView, take: takeDetailView, auth: authView };

function renderRoute() {
  const route = currentRoute();
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.route === route || (['customize','accessibility'].includes(route) && item.dataset.route === 'settings') || (route === 'take' && item.dataset.route === 'home') || (route === 'guild' && item.dataset.route === 'guilds') || (route === 'heat' && item.dataset.route === 'profile')));
  document.querySelector('#sidebar').classList.remove('open');
  mainContent.innerHTML = viewRenderers[route]();
  mainContent.dataset.route = route;
  document.body.dataset.route = route;
  updateAdVisibility();
  document.title = `${route === 'home' ? 'Callout' : `${route.charAt(0).toUpperCase()}${route.slice(1)} · Callout`}`;
  bindViewInteractions(route);
  renderProfileHeatFrame();
  if (routeAllowsAds()) initializeAds(mainContent);
  trackPageView();
  mainContent.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderFilteredPosts(category = 'All', search = '') {
  const rawSource = state.activeFeedTab === 'Anonymous' ? state.anonymousPosts : state.activeFeedTab === 'Trending' ? state.trendingPosts : state.posts;
  const source = sessionUser ? rawSource : rawSource.filter(post => !post.authorAutomated);
  const filtered = source.filter(post => (category === 'All' || post.category === category) && post.text.toLowerCase().includes(search.toLowerCase()));
  const results = document.querySelector('#feedResults');
  if (!results) return;
  results.innerHTML = filtered.length
    ? feedMarkup(filtered)
    : emptyState('✦', source.length ? 'No matching takes' : 'No takes to show yet', source.length ? 'Try a different category or search.' : 'Your feed is ready for real community posts. Create the first take to see voting come alive.', '<button class="primary-action" type="button" data-open-composer>Post a take</button>');
  bindPostInteractions();
}

function findPostById(id) {
  return [...state.posts, ...state.anonymousPosts, ...state.trendingPosts, ...state.savedPosts, ...state.guildPosts].find(item => String(item.id) === String(id));
}

function bindPostInteractions() {
  document.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', async () => {
    const card = button.closest('[data-post-id]');
    const post = findPostById(card.dataset.postId);
    if (!post) return;
    if (!sessionUser) { navigate('auth'); return showToast('Sign in to vote.'); }
    const nextVote = button.dataset.vote;
    try {
      const payload = await apiFetch(`/api/posts/${post.databaseId}/vote`, { method: 'POST', body: JSON.stringify({ value: nextVote }) });
      Object.assign(post, { alrightVotes: payload.post.alrightVotes, cringeVotes: payload.post.cringeVotes, userVote: payload.post.userVote, impressions: payload.post.impressions });
      runVoteEffect(button, nextVote);
      await Promise.all([hydrateTrending(), hydrateSession(), hydrateLeaderboard()]); renderRoute();
      trackEvent('rank_post', { rank_value: nextVote, post_category: post.category });
      showToast(payload.post.userVote ? `You called it ${nextVote === 'alright' ? 'Based' : 'a Hot Take'}.` : 'Vote removed.');
    } catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-save-post]').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.savePost;
    if (!sessionUser) { navigate('auth'); return showToast('Sign in to save posts.'); }
    try { const payload = await apiFetch(`/api/posts/${id}/save`, { method: 'POST' }); state.savedPostIds = payload.savedPostIds.map(String); await hydrateSavedPosts(); persist(); renderRoute(); showToast(payload.saved ? 'Saved for later.' : 'Removed from saved.'); }
    catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-open-take]').forEach(element => {
    const open = () => navigate(`take/${element.dataset.openTake}`);
    element.addEventListener('click', open);
    element.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
  document.querySelectorAll('[data-post-menu]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); openPostMenu(button.dataset.postMenu); }));
  document.querySelectorAll('[data-poll-option]').forEach(button => button.addEventListener('click', async () => {
    if (!sessionUser) { navigate('auth'); return showToast('Sign in to vote in polls.'); }
    try { const payload = await apiFetch(`/api/posts/${button.dataset.pollPost}/poll-vote`, { method: 'POST', body: JSON.stringify({ optionId: button.dataset.pollOption }) }); Object.assign(findPostById(button.dataset.pollPost), mapPost(payload.post)); renderRoute(); }
    catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-post-reaction]').forEach(button => button.addEventListener('click', async () => {
    if (!sessionUser) { navigate('auth'); return showToast('Sign in to react.'); }
    const post = button.closest('[data-post-id]');
    try {
      const payload = await apiFetch(`/api/posts/${post.dataset.postId}/reactions`, { method: 'POST', body: JSON.stringify({ key: button.dataset.postReaction }) });
      Object.assign(findPostById(post.dataset.postId), mapPost(payload.post)); renderRoute();
    } catch (error) { showToast(error.message); }
  }));
}

function prepareBattleHostForm() {
  const form = document.querySelector('#battleHostForm');
  if (!form || form.dataset.prepared === 'true') return;
  form.dataset.prepared = 'true';
  form.elements.title?.focus({ preventScroll: true });
}

function bindViewInteractions(route) {
  bindPostInteractions();
  prepareBattleHostForm();
  document.querySelectorAll('[data-admin-section]').forEach(button => button.addEventListener('click', () => navigate(`admin/${button.dataset.adminSection}`)));
  document.querySelectorAll('.admin-console-view [data-route-button]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.routeButton)));
  document.querySelectorAll('[data-post-state]').forEach(button => button.addEventListener('click', () => {
    state.expandedPostState = state.expandedPostState === button.dataset.postState ? '' : button.dataset.postState;
    renderRoute();
  }));
  document.querySelectorAll('[data-close-post-state]').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation(); state.expandedPostState = ''; renderRoute();
  }));
  document.querySelectorAll('[data-defense-form]').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    try {
      await apiFetch(`/api/posts/${form.dataset.defenseForm}/defense`, { method: 'POST', body: JSON.stringify({ content: sanitizeInput(form.elements.content.value) }) });
      await hydratePosts(); showToast('Your Defense is attached to the original Take.');
    } catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-open-redemption]').forEach(button => button.addEventListener('click', async () => {
    const post = button.closest('[data-post-id]');
    try { await apiFetch(`/api/posts/${post.dataset.postId}/redemption`, { method: 'POST' }); await hydratePosts(); showToast('The 72-hour Redemption vote is live.'); }
    catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-redemption-vote]').forEach(button => button.addEventListener('click', async () => {
    if (!sessionUser) return navigate('auth');
    try {
      await apiFetch(`/api/posts/${button.dataset.redemptionPost}/redemption/vote`, { method: 'POST', body: JSON.stringify({ value: button.dataset.redemptionVote }) });
      await hydratePosts(); showToast('Redemption vote recorded.');
    } catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-reveal-anonymous]').forEach(button => button.addEventListener('click', async () => {
    if (!window.confirm('Reveal your identity permanently on this anonymous Take? This cannot be undone.')) return;
    try { await apiFetch(`/api/posts/${button.dataset.revealAnonymous}/reveal`, { method: 'POST' }); await hydrateBigPatch(); await hydratePosts(); renderRoute(); }
    catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-open-topic]').forEach(button => button.addEventListener('click', () => navigate(`topics/${button.dataset.openTopic}`)));
  document.querySelector('[data-back-topics]')?.addEventListener('click', () => navigate('topics'));
  document.querySelector('[data-back-battles]')?.addEventListener('click', () => navigate('battles'));
  document.querySelectorAll('[data-open-battle]').forEach(button => button.addEventListener('click', () => navigate(`battles/${button.dataset.openBattle}`)));
  document.querySelectorAll('[data-show-battle-host]').forEach(button => button.addEventListener('click', () => {
    if (!sessionUser) return navigate('auth');
    const form = document.querySelector('#battleHostForm');
    if (form) { form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'start' }); form.elements.title.focus(); }
  }));
  document.querySelector('[data-close-battle-host]')?.addEventListener('click', () => { document.querySelector('#battleHostForm').hidden = true; });
  document.querySelector('[data-show-battle-join]')?.addEventListener('click', () => document.querySelector('#openBattles')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.querySelectorAll('[data-battle-filter]').forEach(button => button.addEventListener('click', () => { state.battleFilter = button.dataset.battleFilter; renderRoute(); }));
  document.querySelector('#battleHostForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!sessionUser) return navigate('auth');
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = 'Launching…';
    try {
      const coverFile = form.elements.coverFile?.files?.[0];
      if (coverFile && coverFile.size > 2 * 1024 * 1024) throw new Error('Cover image must be 2 MB or smaller.');
      const coverUrl = coverFile ? await fileToDataUrl(coverFile) : '';
      const payload = { title: sanitizeInput(form.elements.title.value), description: sanitizeInput(form.elements.description.value), category: sanitizeInput(form.elements.category.value) || 'General', size: Number(form.elements.size.value), submissionHours: Number(form.elements.submissionHours.value), roundHours: Number(form.elements.roundHours.value), privacy: form.elements.privacy.value, votingRule: 'community', coverUrl, startsAt: null };
      const { battle } = await apiFetch('/api/battles', { method: 'POST', body: JSON.stringify(payload) });
      state.battles.unshift(battle); showToast('Submissions are open.'); navigate(`battles/${battle.id}`);
    } catch (error) { showToast(error.message); submit.disabled = false; submit.textContent = 'Open submissions'; }
  });
  document.querySelector('#battleSubmissionForm')?.addEventListener('submit', async event => {
    event.preventDefault(); if (!sessionUser) return navigate('auth');
    const form = event.currentTarget; const button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Sealing…';
    try {
      const file = form.elements.media.files?.[0];
      if (file && file.size > 2 * 1024 * 1024) throw new Error('Image or GIF must be 2 MB or smaller.');
      const mediaUrl = file ? await fileToDataUrl(file) : '';
      const { battle } = await apiFetch(`/api/battles/${form.dataset.battleId}/submissions`, { method: 'POST', body: JSON.stringify({ text: sanitizeInput(form.elements.text.value), mediaUrl }) });
      state.battles = state.battles.map(item => String(item.id) === String(battle.id) ? battle : item); renderRoute(); showToast('Your Take is sealed.');
    } catch (error) { showToast(error.message); button.disabled = false; button.textContent = 'Seal my Take'; }
  });
  document.querySelector('#battleSubmissionForm textarea')?.addEventListener('input', event => { const counter = document.querySelector('[data-battle-counter]'); if (counter) counter.textContent = event.target.value.length; });
  document.querySelector('[data-close-battle-submissions]')?.addEventListener('click', async event => {
    if (!window.confirm('Close submissions now and privately choose the finalists?')) return;
    try { const { battle } = await apiFetch(`/api/battles/${event.currentTarget.dataset.closeBattleSubmissions}/close-submissions`, { method: 'POST' }); state.battles = state.battles.map(item => String(item.id) === String(battle.id) ? battle : item); renderRoute(); }
    catch (error) { showToast(error.message); }
  });
  document.querySelectorAll('#battleFinalistForm input[name="submissionId"]').forEach(input => input.addEventListener('change', () => { const count = document.querySelectorAll('#battleFinalistForm input[name="submissionId"]:checked').length; const output = document.querySelector('[data-finalist-count]'); if (output) output.textContent = count; }));
  document.querySelector('#battleFinalistForm')?.addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const submissionIds = [...form.querySelectorAll('input[name="submissionId"]:checked')].map(input => input.value); const battle = state.battles.find(item => String(item.id) === String(form.dataset.battleId));
    if (submissionIds.length !== Number(battle?.size)) return showToast(`Choose exactly ${battle?.size} finalists.`);
    try { const payload = await apiFetch(`/api/battles/${form.dataset.battleId}/finalists`, { method: 'POST', body: JSON.stringify({ submissionIds }) }); state.battles = state.battles.map(item => String(item.id) === String(payload.battle.id) ? payload.battle : item); renderRoute(); showToast('The bracket is live.'); }
    catch (error) { showToast(error.message); }
  });
  document.querySelectorAll('[data-battle-vote]').forEach(button => button.addEventListener('click', async () => {
    if (!sessionUser) return navigate('auth');
    try {
      const { battle } = await apiFetch(`/api/battles/${button.dataset.battleVote}/vote`, { method: 'POST', body: JSON.stringify({ round: Number(button.dataset.battleRound), match: Number(button.dataset.battleMatch), seed: Number(button.dataset.battleSeed) }) });
      state.battles = state.battles.map(item => String(item.id) === String(battle.id) ? battle : item); renderRoute(); showToast('Battle vote recorded.');
    } catch (error) { showToast(error.message); }
  }));
  document.querySelector('#pinboardForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget; const text = sanitizeInput(form.elements.text.value); const url = form.elements.attachment.value.trim();
    if (!text && !url) return showToast('Add a message or attachment.');
    try {
      const attachments = url ? [{ type: /\.(gif|png|jpe?g|webp)(\?.*)?$/i.test(url) ? 'image' : 'link', url, alt: 'Guild pin' }] : [];
      await apiFetch(`/api/guilds/${state.activeGuild.id}/pinboard`, { method: 'POST', body: JSON.stringify({ text, attachments }) });
      await hydrateGuildDetail(); renderRoute();
    } catch (error) { showToast(error.message); }
  });
  document.querySelector('[data-reset-pinboard]')?.addEventListener('click', async () => {
    if (!window.confirm('Reset this Pinboard now? The previous board stays archived for seven days.')) return;
    try { await apiFetch(`/api/guilds/${state.activeGuild.id}/pinboard/reset`, { method: 'POST' }); await hydrateGuildDetail(); renderRoute(); }
    catch (error) { showToast(error.message); }
  });
  document.querySelectorAll('[data-open-composer]').forEach(button => button.addEventListener('click', openComposerForUser));
  document.querySelector('[data-open-idea-form]')?.addEventListener('click', openIdeaSubmission);
  document.querySelectorAll('[data-idea-mood]').forEach(button => button.addEventListener('click', () => { state.ideaMood = button.dataset.ideaMood; renderRoute(); }));
  document.querySelectorAll('[data-create-guild]').forEach(button => button.addEventListener('click', () => guildComposer.showModal()));
  document.querySelectorAll('.segmented-control button').forEach(button => button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
  }));
  document.querySelectorAll('[data-feed-tab]').forEach(button => button.addEventListener('click', () => {
    state.activeFeedTab = button.dataset.feedTab;
    renderRoute();
  }));
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    button.parentElement.querySelectorAll('button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    renderFilteredPosts(button.dataset.category);
  }));
  document.querySelector('[data-mark-read]')?.addEventListener('click', async () => { try { await apiFetch('/api/notifications/read', { method: 'POST' }); state.notifications.forEach(item => { item.read = true; }); renderRoute(); showToast('Notifications marked as read.'); } catch (error) { showToast(error.message); } });
  document.querySelector('[data-new-message]')?.addEventListener('click', renderMessageComposer);
  document.querySelector('[data-open-settings]')?.addEventListener('click', () => navigate('settings'));
  document.querySelector('[data-go-auth]')?.addEventListener('click', () => navigate('auth'));
  document.querySelectorAll('[data-ranking-view]').forEach(button => button.addEventListener('click', () => { state.leaderboardView = button.dataset.rankingView; renderRoute(); }));
  document.querySelectorAll('[data-open-heat]').forEach(button => button.addEventListener('click', () => navigate('heat')));
  document.querySelectorAll('[data-analytics-days]').forEach(button => button.addEventListener('click', async () => { state.analyticsDays = Number(button.dataset.analyticsDays); state.analytics = null; renderRoute(); await hydrateAnalytics(); renderRoute(); }));
  document.querySelector('[data-refresh-analytics]')?.addEventListener('click', async () => { state.analytics = null; state.analyticsError = ''; renderRoute(); await hydrateAnalytics(); renderRoute(); });
  document.querySelector('[data-refresh-admin]')?.addEventListener('click', async () => { state.adminError = ''; renderRoute(); await hydrateAdminControl(); renderRoute(); });
  document.querySelector('[data-run-bots]')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { const payload = await apiFetch('/api/admin/bots/run', { method: 'POST' }); state.botAutomation.bots = payload.bots; await Promise.all([hydratePosts(), hydrateTrending()]); renderRoute(); showToast(`${payload.result.bot || 'Automation'} completed a ${payload.result.action} action.`); }
    catch (error) { showToast(error.message); event.currentTarget.disabled = false; }
  });
  document.querySelectorAll('[data-toggle-bot]').forEach(input => input.addEventListener('change', async () => {
    try { await apiFetch(`/api/admin/bots/${input.dataset.toggleBot}`, { method: 'PATCH', body: JSON.stringify({ enabled: input.checked }) }); state.botAutomation = await apiFetch('/api/admin/bots'); renderRoute(); showToast(input.checked ? 'Automated account activated.' : 'Automated account paused.'); }
    catch (error) { input.checked = !input.checked; showToast(error.message); }
  }));
  document.querySelectorAll('[data-admin-post-form]').forEach(form => form.addEventListener('submit', saveAdminPost));
  document.querySelector('#adminTopicForm')?.addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    try {
      await apiFetch('/api/topics', { method: 'POST', body: JSON.stringify({ title: sanitizeInput(form.elements.title.value), slug: '', description: sanitizeInput(form.elements.description.value), rules: '', artworkUrl: '', accentColor: '#ff4713', startsAt: new Date(form.elements.startsAt.value).toISOString(), endsAt: new Date(form.elements.endsAt.value).toISOString(), featured: true }) });
      form.reset(); await hydrateBigPatch(); renderRoute(); showToast('Limited-Time Topic scheduled.');
    } catch (error) { showToast(error.message); }
  });
  document.querySelector('#adminAboutForm')?.addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    try {
      await apiFetch('/api/admin/about', { method: 'POST', body: JSON.stringify({ title: sanitizeInput(form.elements.title.value), body: sanitizeInput(form.elements.body.value), label: form.elements.label.value, pinned: form.elements.pinned.checked, order: 0 }) });
      form.reset(); await hydrateBigPatch(); renderRoute(); showToast('Project Wall updated.');
    } catch (error) { showToast(error.message); }
  });
  document.querySelectorAll('[data-feature-control]').forEach(input => input.addEventListener('change', async () => {
    try {
      await apiFetch(`/api/admin/features/${encodeURIComponent(input.dataset.featureControl)}`, { method: 'PATCH', body: JSON.stringify({ enabled: input.checked }) });
      await hydrateAdminControl(); renderRoute(); showToast(`${input.dataset.featureControl} ${input.checked ? 'enabled' : 'disabled'}.`);
    } catch (error) { input.checked = !input.checked; showToast(error.message); }
  }));
  document.querySelectorAll('[data-open-admin-post]').forEach(button => button.addEventListener('click', () => navigate(`take/${button.dataset.openAdminPost}`)));
  document.querySelectorAll('[data-layout-move]').forEach(button => button.addEventListener('click', () => {
    const order = [...document.querySelectorAll('[data-layout-item]')].map(item => item.dataset.layoutItem);
    const index = Number(button.dataset.layoutMove); const next = index + Number(button.dataset.direction);
    if (next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]]; state.profile.profileLayout = order; renderRoute();
  }));
  document.querySelectorAll('[data-profile-tab]').forEach(button => button.addEventListener('click', () => { state.profileTab = button.dataset.profileTab; renderRoute(); }));
  document.querySelectorAll('[data-follow-user]').forEach(button => button.addEventListener('click', toggleProfileFollow));
  document.querySelectorAll('[data-profile-connections]').forEach(button => button.addEventListener('click', openProfileConnections));
  document.querySelectorAll('[data-profile-post-filter]').forEach(select => select.addEventListener('change', () => { state.profilePostFilter = select.value; renderRoute(); }));
  document.querySelectorAll('[data-open-profile-post]').forEach(button => button.addEventListener('click', () => navigate(`take/${button.dataset.openProfilePost}`)));
  document.querySelector('[data-create-collection]')?.addEventListener('click', openCreateCollection);
  document.querySelectorAll('[data-edit-collection]').forEach(button => button.addEventListener('click', () => openCollectionManager(button.dataset.editCollection)));
  document.querySelectorAll('[data-add-post-collection]').forEach(button => button.addEventListener('click', () => openCollectionPicker(button.dataset.addPostCollection)));
  document.querySelector('[data-back-feed]')?.addEventListener('click', () => navigate('home'));
  document.querySelector('#commentForm')?.addEventListener('submit', addComment);
  document.querySelector('[data-expand-comment]')?.addEventListener('click', event => {
    const form = document.querySelector('#commentForm');
    if (!form) return;
    form.hidden = false;
    event.currentTarget.closest('.comment-thread-tools')?.setAttribute('hidden', '');
    form.querySelector('textarea')?.focus();
  });
  document.querySelectorAll('[data-comment-emoji]').forEach(button => button.addEventListener('click', () => { const textarea = button.closest('form').elements.comment; textarea.value += button.dataset.commentEmoji; textarea.focus(); }));
  document.querySelector('#settingsForm')?.addEventListener('submit', saveSettings);
  document.querySelectorAll('input[name="theme"], input[name="textSize"]').forEach(input => input.addEventListener('change', previewDisplaySettings));
  document.querySelector('#settingsForm')?.addEventListener('input', updateProfilePreview);
  document.querySelector('#bannerUpload')?.addEventListener('change', handleBannerUpload);
  document.querySelector('#avatarUpload')?.addEventListener('change', handleAvatarUpload);
  document.querySelectorAll('[data-reply-comment]').forEach(button => button.addEventListener('click', () => openReplyComposer(button.dataset.replyComment)));
  document.querySelectorAll('[data-upvote-comment]').forEach(button => button.addEventListener('click', () => toggleCommentVote(button.dataset.upvoteComment)));
  document.querySelectorAll('[data-comment-menu]').forEach(button => button.addEventListener('click', () => openCommentMenu(button.dataset.commentMenu)));
  document.querySelectorAll('[data-unblock]').forEach(button => button.addEventListener('click', () => unblockUser(button.dataset.unblock)));
  document.querySelectorAll('[data-open-guild]').forEach(button => button.addEventListener('click', () => navigate(`guild/${button.dataset.openGuild}/public`)));
  document.querySelectorAll('[data-toggle-guild]').forEach(button => button.addEventListener('click', async () => {
    if (!sessionUser) { navigate('auth'); return showToast('Sign in to join a guild.'); }
    try { await apiFetch(`/api/guilds/${button.dataset.toggleGuild}/membership`, { method: 'POST' }); await Promise.all([hydrateGuilds(), hydrateGuildDetail()]); renderRoute(); showToast('Guild membership updated.'); } catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-guild-tab]').forEach(button => button.addEventListener('click', () => navigate(`guild/${state.activeGuild.id}/${button.dataset.guildTab}`)));
  document.querySelector('#guildPostForm')?.addEventListener('submit', createGuildFeedPost);
  document.querySelector('#guildChatForm')?.addEventListener('submit', sendGuildChatMessage);
  document.querySelector('#guildSettingsForm')?.addEventListener('submit', saveGuildSettings);
  document.querySelector('#guildIdentityForm')?.addEventListener('submit', saveGuildIdentity);
  document.querySelectorAll('[data-guild-template]').forEach(button => button.addEventListener('click', applyGuildTemplate));
  document.querySelectorAll('[data-guild-layout-move]').forEach(button => button.addEventListener('click', moveGuildLayoutSection));
  document.querySelectorAll('[data-role-form]').forEach(form => form.addEventListener('submit', saveGuildRole));
  document.querySelectorAll('[data-member-role]').forEach(select => select.addEventListener('change', updateGuildMemberRole));
  document.querySelectorAll('[data-approve-member]').forEach(button => button.addEventListener('click', approveGuildMember));
  document.querySelectorAll('[data-notification-filter]').forEach(button => button.addEventListener('click', () => { state.notificationFilter = button.dataset.notificationFilter; renderRoute(); }));
  document.querySelectorAll('[data-notification-post]').forEach(button => button.addEventListener('click', () => navigate(`take/${button.dataset.notificationPost}`)));
  document.querySelectorAll('[data-notification-guild]').forEach(button => button.addEventListener('click', () => navigate(`guild/${button.dataset.notificationGuild}/public`)));
  document.querySelectorAll('[data-notification-message]').forEach(button => button.addEventListener('click', () => navigate(`messages/${button.dataset.notificationMessage}`)));
  document.querySelectorAll('[data-notification-user]').forEach(button => button.addEventListener('click', () => navigate(`user/${button.dataset.notificationUser}`)));
  document.querySelectorAll('[data-mute-notification]').forEach(button => button.addEventListener('click', () => openNotificationMute(button.dataset.muteNotification, button.dataset.muteId)));
  document.querySelectorAll('[data-conversation]').forEach(button => button.addEventListener('click', () => navigate(`messages/${button.dataset.conversation}`)));
  document.querySelector('#dmChatForm')?.addEventListener('submit', sendDirectMessage);
  document.querySelectorAll('[data-open-user]').forEach(button => button.addEventListener('click', () => navigate(`user/${button.dataset.openUser}`)));
  document.querySelectorAll('[data-leader-user]').forEach(button => button.addEventListener('click', () => navigate(`user/${button.dataset.leaderUser}`)));
  document.querySelector('[data-friend-user]')?.addEventListener('click', sendFriendRequest);
  document.querySelector('[data-accept-friend]')?.addEventListener('click', acceptFriendRequestFromProfile);
  document.querySelector('[data-message-user]')?.addEventListener('click', event => navigate(`messages/${event.currentTarget.dataset.messageUser}`));
  document.querySelector('#loginForm')?.addEventListener('submit', loginUser);
  document.querySelector('#signupForm')?.addEventListener('submit', signupUser);
  document.querySelector('#resetRequestForm')?.addEventListener('submit', requestPasswordReset);
  document.querySelector('#resetConfirmForm')?.addEventListener('submit', confirmPasswordReset);
  document.querySelector('[data-logout]')?.addEventListener('click', logoutUser);
}

function openNotificationMute(scopeType, scopeId) {
  showActionDialog(actionDialogShell('NOTIFICATION CONTROLS', 'Mute or snooze', `<p>Hide matching notifications until you change this rule.</p><div class="dialog-actions"><button class="quiet-action" type="button" data-mute-duration="day">Snooze 24 hours</button><button class="primary-action" type="button" data-mute-duration="forever">Mute</button></div>`));
  document.querySelectorAll('[data-mute-duration]').forEach(button => button.addEventListener('click', async () => {
    const snoozedUntil = button.dataset.muteDuration === 'day' ? new Date(Date.now() + 86400000).toISOString() : null;
    try { await apiFetch('/api/notifications/mutes', { method: 'POST', body: JSON.stringify({ scopeType, scopeId, snoozedUntil }) }); closeActionDialog(); await hydrateAccountData(); renderRoute(); showToast(snoozedUntil ? 'Notifications snoozed for 24 hours.' : 'Notifications muted.'); }
    catch (error) { showToast(error.message); }
  }));
}

function postTextError(text) {
  if (text.includes('#')) return 'Hashtags are not allowed in post text.';
  if (/(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|co|gg|me|tv)(?:\/|\b))/i.test(text)) return 'Links are not allowed in post text. Use the GIF attachment field for GIF links.';
  return '';
}

async function createGuildFeedPost(event) {
  event.preventDefault();
  const content = sanitizeInput(event.currentTarget.elements.content.value);
  const error = postTextError(content); if (error) return showToast(error);
  try { await apiFetch(`/api/guilds/${state.activeGuild.id}/posts`, { method: 'POST', body: JSON.stringify({ content, category: event.currentTarget.elements.category.value, media: [] }) }); trackEvent('create_post', { audience: 'guild' }); await Promise.all([hydrateGuildDetail(), hydrateSession()]); renderRoute(); showToast('Posted to the guild.'); }
  catch (requestError) { showToast(requestError.message); }
}

async function sendGuildChatMessage(event) {
  event.preventDefault(); const text = sanitizeInput(event.currentTarget.elements.text.value); if (!text) return;
  try { await apiFetch(`/api/guilds/${state.activeGuild.id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }); await hydrateGuildDetail(); renderRoute(); }
  catch (error) { showToast(error.message); }
}

async function imageFieldValue(file, existing = '') {
  if (!file) return existing;
  if (file.size > 2 * 1024 * 1024) throw new Error('Guild images must be 2 MB or smaller.');
  return fileToDataUrl(file);
}

async function saveGuildSettings(event) {
  event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
  try {
    const [iconUrl, bannerUrl] = await Promise.all([imageFieldValue(form.elements.iconFile.files[0], data.get('iconUrl')), imageFieldValue(form.elements.bannerFile.files[0], data.get('bannerUrl'))]);
    const customEmojis = String(data.get('customEmojis') || '').split(/\r?\n/).map(line => line.split('|')).filter(parts => parts.length >= 2 && parts[0].trim() && parts[1].trim()).map(([name, imageUrl]) => ({ name: sanitizeInput(name.trim()).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24), imageUrl: imageUrl.trim() })).filter(item => item.name.length >= 2);
    const onboardingQuestions = String(data.get('onboardingQuestions') || '').split(/\r?\n/).map(line => line.split('|')).filter(parts => parts.length >= 2).map(([prompt, options, required]) => ({ prompt: sanitizeInput(prompt.trim()), options: options.split(',').map(option => sanitizeInput(option.trim())).filter(Boolean), required: String(required).trim().toLowerCase() === 'required' })).filter(item => item.prompt && item.options.length >= 2);
    const reactionSet = [...new Set(String(data.get('reactionSet') || '').trim().split(/\s+/).filter(Boolean))].slice(0, 8);
    const landingLayout = [...document.querySelectorAll('[data-guild-layout-item]')].map(item => item.dataset.guildLayoutItem);
    await apiFetch(`/api/guilds/${state.activeGuild.id}`, { method: 'PATCH', body: JSON.stringify({ name: sanitizeInput(data.get('name')), description: sanitizeInput(data.get('description')), tagline: sanitizeInput(data.get('tagline')), welcomeMessage: sanitizeInput(data.get('welcomeMessage')), pinnedAnnouncement: sanitizeInput(data.get('pinnedAnnouncement')), rules: sanitizeInput(data.get('rules')), iconUrl, bannerUrl, themeColor: data.get('themeColor'), accentColor: data.get('accentColor'), backgroundPattern: data.get('backgroundPattern'), cardStyle: data.get('cardStyle'), iconShape: data.get('iconShape'), seasonalEffect: data.get('seasonalEffect'), customEmojis, reactionSet: reactionSet.length >= 2 ? reactionSet : ['👍','🔥'], landingLayout, onboardingQuestions, privacy: data.get('privacy'), settings: { allowJoinRequests: data.has('allowJoinRequests'), showMemberList: data.has('showMemberList'), allowPerGuildProfiles: data.has('allowPerGuildProfiles'), showOnlineStatus: data.has('showOnlineStatus') }, contentPrivacy: 'members' }) });
    await Promise.all([hydrateGuilds(), hydrateGuildDetail()]); renderRoute(); showToast('Guild settings saved.');
  } catch (error) { showToast(error.message); }
}

function moveGuildLayoutSection(event) {
  const items = [...document.querySelectorAll('[data-guild-layout-item]')];
  const index = Number(event.currentTarget.dataset.guildLayoutMove); const next = index + Number(event.currentTarget.dataset.direction);
  if (next < 0 || next >= items.length) return;
  const parent = items[index].parentElement;
  if (next > index) parent.insertBefore(items[next], items[index]); else parent.insertBefore(items[index], items[next]);
  [...parent.children].forEach((item, position, list) => { item.querySelectorAll('button').forEach(button => { button.dataset.guildLayoutMove = position; button.disabled = (button.dataset.direction === '-1' && position === 0) || (button.dataset.direction === '1' && position === list.length - 1); }); });
}

function applyGuildTemplate(event) {
  const form = document.querySelector('#guildSettingsForm');
  const templates = { minimal: ['#111111','#ff4713','clean','outline'], cinema: ['#38185f','#f3bd25','stars','glass'], gaming: ['#5d2fe6','#2ee6a6','grid','solid'], debate: ['#ba2818','#ffda45','waves','soft'] };
  const [theme, accent, background, cards] = templates[event.currentTarget.dataset.guildTemplate];
  form.elements.themeColor.value = theme; form.elements.accentColor.value = accent; form.elements.backgroundPattern.value = background; form.elements.cardStyle.value = cards;
  showToast(`${event.currentTarget.dataset.guildTemplate} template applied. Save to publish it.`);
}

async function saveGuildIdentity(event) {
  event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
  try {
    const [avatarUrl, bannerUrl] = await Promise.all([imageFieldValue(form.elements.avatarFile.files[0], data.get('avatarUrl')), imageFieldValue(form.elements.bannerFile.files[0], data.get('bannerUrl'))]);
    const onboardingAnswers = (state.activeGuild.onboardingQuestions || []).map((question, index) => ({ question: question.prompt, answer: sanitizeInput(data.get(`onboarding_${index}`) || '') })).filter(item => item.answer);
    await apiFetch(`/api/guilds/${state.activeGuild.id}/identity`, { method: 'PATCH', body: JSON.stringify({ nickname: sanitizeInput(data.get('nickname')), avatarUrl, bannerUrl, bio: sanitizeInput(data.get('bio')), themeColor: data.get('themeColor'), avatarFrame: data.get('avatarFrame'), onboardingAnswers }) });
    await hydrateGuildDetail(); renderRoute(); showToast('Guild identity saved.');
  } catch (error) { showToast(error.message); }
}

async function saveGuildRole(event) {
  event.preventDefault(); const form = event.currentTarget;
  const permissions = Object.fromEntries(['manageGuild','manageRoles','manageMembers','managePosts','createPosts','chat','viewAudit'].map(key => [key, form.elements[key].checked]));
  try { await apiFetch(`/api/guilds/${state.activeGuild.id}/roles/${form.dataset.roleForm}`, { method: 'PATCH', body: JSON.stringify({ name: sanitizeInput(form.elements.name.value), icon: sanitizeInput(form.elements.icon.value), color: form.elements.color.value, permissions }) }); await hydrateGuildDetail(); renderRoute(); showToast('Role design saved.'); }
  catch (error) { showToast(error.message); }
}

async function updateGuildMemberRole(event) {
  try { await apiFetch(`/api/guilds/${state.activeGuild.id}/members/${event.currentTarget.dataset.memberRole}`, { method: 'PATCH', body: JSON.stringify({ roleKey: event.currentTarget.value }) }); await hydrateGuildDetail(); renderRoute(); showToast('Member role updated.'); }
  catch (error) { showToast(error.message); }
}

async function approveGuildMember(event) {
  try { await apiFetch(`/api/guilds/${state.activeGuild.id}/members/${event.currentTarget.dataset.approveMember}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) }); await hydrateGuildDetail(); renderRoute(); showToast('Join request approved.'); }
  catch (error) { showToast(error.message); }
}

async function sendDirectMessage(event) {
  event.preventDefault(); const form = event.currentTarget; const message = sanitizeInput(form.elements.message.value); if (!message) return;
  try { await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ recipient: form.elements.recipient.value, message }) }); await hydrateAccountData(); renderRoute(); }
  catch (error) { showToast(error.message); }
}

async function sendFriendRequest(event) {
  const userId = event.currentTarget.dataset.friendUser;
  if (!sessionUser) { navigate('auth'); return; }
  try { await apiFetch('/api/friends', { method: 'POST', body: JSON.stringify({ userId }) }); await Promise.all([hydrateAccountData(), hydratePublicProfile()]); renderRoute(); showToast('Friend request sent.'); }
  catch (error) { showToast(error.message); }
}

async function acceptFriendRequestFromProfile(event) {
  try { await apiFetch(`/api/friends/${event.currentTarget.dataset.acceptFriend}/accept`, { method: 'POST' }); await Promise.all([hydrateAccountData(), hydratePublicProfile()]); renderRoute(); showToast('Friend added.'); }
  catch (error) { showToast(error.message); }
}

async function toggleProfileFollow(event) {
  if (!sessionUser) return navigate('auth');
  const button = event.currentTarget;
  const userId = button.dataset.followUser;
  button.disabled = true;
  try {
    await apiFetch(`/api/users/${userId}/follow`, { method: button.classList.contains('following') ? 'DELETE' : 'POST' });
    await Promise.all([hydratePublicProfile(), hydrateOwnProfile(), hydrateAccountData()]);
    renderRoute();
    showToast(button.classList.contains('following') ? 'Unfollowed.' : 'You are now following this profile.');
  } catch (error) { button.disabled = false; showToast(error.message); }
}

async function openProfileConnections(event) {
  const { profileConnections: direction, profileUser: userId } = event.currentTarget.dataset;
  try {
    const payload = await apiFetch(`/api/users/${userId}/${direction}`, {}, false);
    const title = direction === 'followers' ? 'Followers' : 'Following';
    const rows = (payload.users || []).map(user => `<button type="button" class="connection-row" data-connection-user="${user.id}">${profileAvatar(user)}<span><strong>${escapeHtml(user.displayName)}</strong><small>${escapeHtml(user.handle || '')}</small></span><b>View →</b></button>`).join('');
    showActionDialog(actionDialogShell('PROFILE CONNECTIONS', `${Number(payload.total || 0).toLocaleString()} ${title}`, `<div class="connection-list">${rows || `<p class="dialog-copy">No ${title.toLowerCase()} yet.</p>`}</div>`));
    document.querySelectorAll('[data-connection-user]').forEach(button => button.addEventListener('click', () => { closeActionDialog(); navigate(`user/${button.dataset.connectionUser}`); }));
  } catch (error) { showToast(error.message); }
}

function collectionForm(collection = {}) {
  return `<form id="collectionForm"><label>Collection type<select name="type" ${collection.id ? 'disabled' : ''}><option value="saved" ${collection.type === 'saved' ? 'selected' : ''}>Saved collection</option><option value="portfolio" ${collection.type === 'portfolio' ? 'selected' : ''}>Creator portfolio</option></select><small>Portfolios can contain only your own public posts.</small></label><label>Title<input name="title" maxlength="80" value="${escapeHtml(collection.title || '')}" required /></label><label>Description<textarea name="description" maxlength="240">${escapeHtml(collection.description || '')}</textarea></label><label>Cover image URL<input name="coverUrl" type="url" maxlength="1000" value="${escapeHtml(collection.coverUrl || '')}" placeholder="https://…" /></label><label>Visibility<select name="visibility"><option value="private" ${!collection.visibility || collection.visibility === 'private' ? 'selected' : ''}>Private</option><option value="friends" ${collection.visibility === 'friends' ? 'selected' : ''}>Friends</option><option value="public" ${collection.visibility === 'public' ? 'selected' : ''}>Public</option></select></label><button class="primary-action" type="submit">${collection.id ? 'Save collection' : 'Create collection'}</button></form>`;
}

function openCreateCollection() {
  showActionDialog(actionDialogShell('NEW COLLECTION', 'Curate your Callout', collectionForm()));
  document.querySelector('#collectionForm').addEventListener('submit', async event => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    try { await apiFetch('/api/collections', { method: 'POST', body: JSON.stringify(values) }); await hydrateOwnProfile(); closeActionDialog(); state.profileTab = 'collections'; renderRoute(); showToast('Collection created privately.'); }
    catch (error) { showToast(error.message); }
  });
}

function openCollectionManager(collectionId) {
  const collection = state.ownProfileData?.collections?.find(item => String(item.id) === String(collectionId));
  if (!collection) return showToast('Collection could not be found.');
  const items = (collection.posts || []).map((post, index) => `<article class="collection-manage-item" data-collection-item="${post.id}"><span><strong>${escapeHtml((post.content || 'Post').slice(0, 90))}</strong><small>${escapeHtml(post.category || 'Callout')}</small></span><div><button type="button" data-move-collection="${post.id}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move-collection="${post.id}" data-direction="1" ${index === collection.posts.length - 1 ? 'disabled' : ''}>↓</button><button type="button" data-remove-collection="${post.id}">Remove</button></div></article>`).join('');
  showActionDialog(actionDialogShell('MANAGE COLLECTION', collection.title, `${collectionForm(collection)}<section class="collection-manage-list"><h3>Ordered posts</h3>${items || '<p>No posts have been added yet.</p>'}</section><button class="danger-action collection-delete" type="button" data-delete-collection>Delete collection</button>`));
  document.querySelector('#collectionForm').addEventListener('submit', async event => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); delete values.type;
    try { await apiFetch(`/api/collections/${collection.id}`, { method: 'PATCH', body: JSON.stringify(values) }); await hydrateOwnProfile(); closeActionDialog(); renderRoute(); showToast('Collection updated.'); }
    catch (error) { showToast(error.message); }
  });
  document.querySelectorAll('[data-remove-collection]').forEach(button => button.addEventListener('click', async () => {
    try { await apiFetch(`/api/collections/${collection.id}/posts/${button.dataset.removeCollection}`, { method: 'DELETE' }); await hydrateOwnProfile(); closeActionDialog(); renderRoute(); showToast('Post removed.'); }
    catch (error) { showToast(error.message); }
  }));
  document.querySelectorAll('[data-move-collection]').forEach(button => button.addEventListener('click', async () => {
    const ids = collection.posts.map(post => String(post.id)); const index = ids.indexOf(String(button.dataset.moveCollection)); const next = index + Number(button.dataset.direction);
    if (next < 0 || next >= ids.length) return; [ids[index], ids[next]] = [ids[next], ids[index]];
    try { await apiFetch(`/api/collections/${collection.id}/order`, { method: 'PATCH', body: JSON.stringify({ postIds: ids }) }); await hydrateOwnProfile(); closeActionDialog(); openCollectionManager(collection.id); }
    catch (error) { showToast(error.message); }
  }));
  document.querySelector('[data-delete-collection]').addEventListener('click', async () => {
    if (!window.confirm(`Delete “${collection.title}”?`)) return;
    try { await apiFetch(`/api/collections/${collection.id}`, { method: 'DELETE' }); await hydrateOwnProfile(); closeActionDialog(); renderRoute(); showToast('Collection deleted.'); }
    catch (error) { showToast(error.message); }
  });
}

function openCollectionPicker(postId) {
  const collections = state.ownProfileData?.collections || [];
  if (!collections.length) return openCreateCollection();
  showActionDialog(actionDialogShell('ADD TO COLLECTION', 'Choose a collection', `<div class="collection-picker">${collections.map(collection => `<button type="button" data-pick-collection="${collection.id}"><span><strong>${escapeHtml(collection.title)}</strong><small>${escapeHtml(collection.type)} · ${escapeHtml(collection.visibility)}</small></span><b>＋</b></button>`).join('')}</div>`));
  document.querySelectorAll('[data-pick-collection]').forEach(button => button.addEventListener('click', async () => {
    try { await apiFetch(`/api/collections/${button.dataset.pickCollection}/posts`, { method: 'POST', body: JSON.stringify({ postId }) }); await hydrateOwnProfile(); closeActionDialog(); showToast('Post added to collection.'); }
    catch (error) { showToast(error.message); }
  }));
}

function renderMessageComposer() {
  const stage = document.querySelector('#conversationStage');
  stage.innerHTML = `<form class="message-compose" id="messageForm"><div><span class="section-kicker">NEW MESSAGE</span><h2>Start a conversation</h2></div><label>To<input name="recipient" required placeholder="@username" /></label><label>Message<textarea name="message" required placeholder="Write a message..."></textarea></label><button class="primary-action" type="submit">Send message</button></form>`;
  document.querySelector('#messageForm').addEventListener('submit', async event => {
    event.preventDefault();
    const recipient = sanitizeInput(event.currentTarget.elements.recipient.value);
    const message = sanitizeInput(event.currentTarget.elements.message.value);
    if (!recipient || !message) return;
    if (!sessionUser) { navigate('auth'); return; }
    try { const payload = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ recipient, message }) }); await hydrateAccountData(); const other = String(payload.message.sender?.id) === String(sessionUser.id) ? payload.message.recipient : payload.message.sender; navigate(`messages/${other.id}`); showToast('Message sent.'); }
    catch (error) { showToast(error.message); }
  });
}

function closeActionDialog() {
  if (actionDialog.open) actionDialog.close();
  document.querySelector('#actionDialogContent').innerHTML = '';
}

function actionDialogShell(kicker, title, body) {
  return `<div class="dialog-title"><div><span class="section-kicker">${kicker}</span><h2>${title}</h2></div><button type="button" data-close-action aria-label="Close">×</button></div>${body}`;
}

function showActionDialog(content) {
  document.querySelector('#actionDialogContent').innerHTML = content;
  actionDialog.showModal();
  document.querySelector('[data-close-action]')?.addEventListener('click', closeActionDialog);
}

function openPostMenu(id) {
  const post = findPostById(id);
  if (!post) return;
  const isAuthor = post.authorId === currentUserId();
  showActionDialog(actionDialogShell('POST OPTIONS', 'What would you like to do?', `<div class="post-menu-list">${isAuthor ? '<button type="button" data-edit-post>✎ <span><strong>Edit Post</strong><small>Update the wording or category</small></span></button><button class="danger" type="button" data-delete-post>⌫ <span><strong>Delete Post</strong><small>Remove this take permanently</small></span></button>' : ''}<button type="button" data-share-post>↗ <span><strong>Share embed</strong><small>Copy a visual Callout card for any website</small></span></button>${isAuthor ? '' : '<button type="button" data-report-post>⚑ <span><strong>Report</strong><small>Send this take for review</small></span></button>'}</div>`));
  document.querySelector('[data-edit-post]')?.addEventListener('click', () => openEditPost(post));
  document.querySelector('[data-delete-post]')?.addEventListener('click', () => openDeletePost(post));
  document.querySelector('[data-share-post]')?.addEventListener('click', () => sharePost(post));
  document.querySelector('[data-report-post]')?.addEventListener('click', () => openReportPost(post));
  const menu = document.querySelector('.post-menu-list');
  const download = document.createElement('button');
  download.type = 'button'; download.dataset.downloadPost = ''; download.innerHTML = '<span>↓</span><span><strong>Download</strong><small>Export this live take as an image</small></span>';
  menu.insertBefore(download, menu.querySelector('[data-share-post]'));
  download.addEventListener('click', () => openPostDownload(post));
  if (isAuthor || sessionUser?.isAdmin) {
    const viral = document.createElement('button');
    viral.type = 'button'; viral.dataset.viralVideoPost = ''; viral.innerHTML = '<span>▶</span><span><strong>Viral video</strong><small>Generate a 7-second vertical share card</small></span>';
    menu.insertBefore(viral, menu.querySelector('[data-share-post]'));
    viral.addEventListener('click', () => openViralVideo(post));
  }
  if (sessionUser?.isAdmin) {
    const tts = document.createElement('button');
    tts.type = 'button'; tts.dataset.ttsPost = ''; tts.innerHTML = '<span>◉</span><span><strong>Text to Speech</strong><small>Admin-only MP3 voiceover export</small></span>';
    menu.insertBefore(tts, menu.querySelector('[data-share-post]'));
    tts.addEventListener('click', () => openPostTts(post));
  }
  if (post.anonymous && ['owner', 'admin', 'moderator'].includes(sessionUser?.staffRole)) {
    const inspect = document.createElement('button');
    inspect.type = 'button';
    inspect.innerHTML = '<span>◉</span><span><strong>Inspect Signal</strong><small>Moderation-only identity lookup · always audited</small></span>';
    menu.insertBefore(inspect, menu.querySelector('[data-share-post]'));
    inspect.addEventListener('click', async () => {
      if (!window.confirm('This identity inspection will be permanently recorded in the staff audit log. Continue?')) return;
      try {
        const { identity } = await apiFetch(`/api/admin/anonymous/${post.databaseId}`);
        showActionDialog(actionDialogShell('AUDITED MODERATION', post.anonymousCode || 'Anonymous Signal', `<div class="dialog-copy"><strong>${escapeHtml(identity.displayName || 'Account')}</strong><p>${escapeHtml(identity.handle || identity.email || identity.id)}</p><small>This lookup has been added to the immutable audit history.</small></div>`));
      } catch (error) { showToast(error.message); }
    });
  }
}

async function openPostTts(post) {
  if (!sessionUser) { navigate('auth'); return showToast('Sign in to generate voice audio.'); }
  if (!sessionUser.isAdmin) return showToast('Text to Speech is restricted to admins.');
  showActionDialog(actionDialogShell('TEXT TO SPEECH', 'Turn this take into audio', `<section class="tts-panel"><p class="dialog-copy">Choose a Callout voice. Audio is generated by ElevenLabs and can be played or downloaded as an MP3.</p><div class="tts-voice-grid" id="ttsVoiceGrid"><span class="export-preview-loading">Loading voices...</span></div><div class="tts-output" id="ttsOutput"><small>No audio generated yet.</small></div></section>`));
  try {
    const config = await apiFetch('/api/tts/voices');
    const voiceGrid = document.querySelector('#ttsVoiceGrid');
    if (!voiceGrid) return;
    voiceGrid.innerHTML = config.voices.map((voice, index) => `<button type="button" data-tts-voice="${escapeHtml(voice.key)}" ${!config.configured ? 'disabled' : ''}><b>${index + 1}</b><span><strong>${escapeHtml(voice.name)}</strong><small>${escapeHtml(voice.description)}</small></span></button>`).join('');
    if (!config.configured) {
      document.querySelector('#ttsOutput').innerHTML = config.isAdmin
        ? ttsAdminSetupForm(config)
        : `<div class="tts-setup-note"><strong>Voiceovers are almost ready.</strong><p>Callout voice generation is being connected by the site owner. You will not need to set up an ElevenLabs account.</p></div>`;
      document.querySelector('#ttsSetupForm')?.addEventListener('submit', event => submitTtsSetup(event, post));
      return;
    }
    voiceGrid.querySelectorAll('[data-tts-voice]').forEach(button => button.addEventListener('click', () => generatePostTts(post, button.dataset.ttsVoice, button)));
    if (config.isAdmin) {
      const output = document.querySelector('#ttsOutput');
      if (output) output.innerHTML = `<div class="tts-player"><div><strong>ElevenLabs is connected.</strong><small>Pick a voice above to generate an MP3. You can update the saved setup below.</small></div><details class="tts-admin-details"><summary>Update ElevenLabs setup</summary>${ttsAdminSetupForm(config, { compact: true })}</details></div>`;
      document.querySelector('#ttsSetupForm')?.addEventListener('submit', event => submitTtsSetup(event, post));
    }
  } catch (error) {
    const output = document.querySelector('#ttsOutput');
    if (output) output.innerHTML = `<div class="tts-setup-note"><strong>Could not load voices.</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function ttsAdminSetupForm(config = {}, options = {}) {
  const setup = config.setup || {};
  const voiceIds = setup.voiceIds || {};
  return `<form id="ttsSetupForm" class="tts-setup-form ${options.compact ? 'compact' : ''}">
    <div class="tts-setup-head">
      <strong>${setup.configured ? 'Change ElevenLabs voices' : 'Connect ElevenLabs once'}</strong>
      <small>Admin-only. You can use one voice for all slots now and replace them later.</small>
    </div>
    <label>ElevenLabs API key
      <input name="apiKey" type="password" autocomplete="off" placeholder="${setup.hasApiKey ? `${escapeHtml(setup.apiKeyPreview)} saved — leave blank to keep it` : 'Paste API key'}" />
    </label>
    <div class="tts-voice-id-grid">
      <label>Spark voice ID
        <input name="sparkVoiceId" required value="${escapeHtml(voiceIds.spark || '')}" placeholder="Energetic / viral narrator voice ID" />
      </label>
      <label>Debate voice ID
        <input name="debateVoiceId" required value="${escapeHtml(voiceIds.debate || '')}" placeholder="Confident opinion voice ID" />
      </label>
      <label>Calm voice ID
        <input name="calmVoiceId" required value="${escapeHtml(voiceIds.calm || '')}" placeholder="Clean narrator voice ID" />
      </label>
    </div>
    <label class="tts-same-voice"><input type="checkbox" data-copy-spark-voice /> Use the Spark voice ID for all three voices</label>
    <input name="modelId" type="hidden" value="${escapeHtml(setup.modelId || 'eleven_multilingual_v2')}" />
    <button class="primary-action" type="submit">Save voice setup</button>
    <small class="tts-form-help">In ElevenLabs, open Voice Library and search styles like “TikTok”, “social media”, “energetic narrator”, or “storytime”. Copy the Voice ID, not the voice name.</small>
  </form>`;
}

async function submitTtsSetup(event, post) {
  event.preventDefault();
  const form = event.currentTarget;
  const copySpark = form.querySelector('[data-copy-spark-voice]')?.checked;
  if (copySpark && form.elements.sparkVoiceId.value.trim()) {
    form.elements.debateVoiceId.value = form.elements.sparkVoiceId.value.trim();
    form.elements.calmVoiceId.value = form.elements.sparkVoiceId.value.trim();
  }
  const button = form.querySelector('button[type="submit"]');
  if (button) { button.disabled = true; button.textContent = 'Saving...'; }
  const body = {
    apiKey: form.elements.apiKey.value.trim(),
    modelId: form.elements.modelId.value.trim() || 'eleven_multilingual_v2',
    sparkVoiceId: form.elements.sparkVoiceId.value.trim(),
    debateVoiceId: form.elements.debateVoiceId.value.trim(),
    calmVoiceId: form.elements.calmVoiceId.value.trim()
  };
  try {
    await apiFetch('/api/admin/tts-settings', { method: 'POST', body: JSON.stringify(body) });
    showToast('ElevenLabs voice setup saved.');
    openPostTts(post);
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Save voice setup'; }
    showToast(error.message);
  }
}

async function generatePostTts(post, voiceKey, button) {
  const output = document.querySelector('#ttsOutput');
  const allButtons = [...document.querySelectorAll('[data-tts-voice]')];
  allButtons.forEach(item => item.disabled = true);
  button.classList.add('active');
  if (output) output.innerHTML = '<div class="tts-generating"><span></span><strong>Generating voiceover...</strong><small>Usually takes a few seconds. Cached audio is instant next time.</small></div>';
  try {
    const payload = await apiFetch(`/api/posts/${post.databaseId || post.id}/tts`, { method: 'POST', body: JSON.stringify({ voiceKey }) });
    const audio = payload.audio;
    if (!audio?.dataUrl) throw new Error('No audio returned.');
    if (output) output.innerHTML = `<div class="tts-player"><div><strong>${escapeHtml(audio.voiceName)} voiceover</strong><small>${audio.cached ? 'Loaded from cache' : 'Generated just now'} · MP3</small></div><audio controls src="${escapeHtml(audio.dataUrl)}"></audio><button class="primary-action" type="button" data-download-tts>Download MP3</button></div>`;
    document.querySelector('[data-download-tts]')?.addEventListener('click', () => downloadDataUrl(audio.dataUrl, `callout-${String(post.id || 'take').replace(/[^a-zA-Z0-9_-]/g, '')}-${audio.voiceKey}.mp3`));
  } catch (error) {
    if (output) output.innerHTML = `<div class="tts-setup-note"><strong>Voice generation failed.</strong><p>${escapeHtml(error.message)}</p></div>`;
  } finally {
    allButtons.forEach(item => item.disabled = false);
  }
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function openViralVideo(post) {
  const supported = Boolean(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const milestone = [...(post.viralVideo?.reached || [])].sort((a, b) => b - a)[0] || (total >= 100 ? 100 : null);
  showActionDialog(actionDialogShell('VIRAL VIDEO', 'Auto-generated share card', `<section class="viral-video-panel">
    <p class="dialog-copy">A short vertical video that sells the argument first: opinion, live votes, result split, top Take, then Callout CTA.</p>
    <div class="viral-video-status ${milestone ? 'ready' : ''}"><strong>${milestone ? `${Number(milestone).toLocaleString()} vote milestone reached` : `${Number(post.viralVideo?.next || 100).toLocaleString()} votes unlocks the trending notification`}</strong><small>You can still generate a preview/export now as the creator.</small></div>
    <div class="viral-video-preview"><canvas id="viralVideoCanvas" width="360" height="640" aria-label="Viral video preview"></canvas></div>
    <div class="viral-video-actions"><button type="button" data-preview-viral>Refresh preview</button><button class="primary-action" type="button" data-generate-viral ${supported ? '' : 'disabled'}>${supported ? 'Generate video' : 'Video recording unavailable'}</button></div>
    <small class="viral-video-note">${supported ? 'Exports as a vertical WebM. Chrome, Opera, and most desktop browsers support this.' : 'This browser cannot record canvas video. Try Chrome or Opera on desktop.'}</small>
  </section>`));
  const canvas = document.querySelector('#viralVideoCanvas');
  const assets = await loadExportAssets(post);
  const drawPreview = () => drawViralVideoFrame(canvas, post, assets, .58);
  drawPreview();
  document.querySelector('[data-preview-viral]')?.addEventListener('click', drawPreview);
  document.querySelector('[data-generate-viral]')?.addEventListener('click', event => generateViralVideo(post, assets, event.currentTarget));
}

function flattenPostComments(comments = []) {
  return comments.flatMap(comment => [comment, ...flattenPostComments(comment.replies || [])]);
}

function topCommentText(post) {
  const comments = flattenPostComments(post.comments || []);
  if (!comments.length) return post.commentCount > 0 ? 'Top Take is loading — open the discussion to see it.' : 'No Takes yet. Be the first to answer.';
  const top = comments.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0))[0];
  return top?.text || 'No Takes yet. Be the first to answer.';
}

function drawViralText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = canvasWrappedLines(context, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawViralVideoFrame(canvas, post, assets = {}, progress = 0) {
  const context = canvas.getContext('2d');
  const width = canvas.width; const height = canvas.height; const scale = width / 1080;
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const based = total ? Math.round((Number(post.alrightVotes || 0) / total) * 100) : 50;
  const hot = 100 - based;
  const stage = progress < .24 ? 0 : progress < .43 ? 1 : progress < .68 ? 2 : progress < .86 ? 3 : 4;
  drawExportBackground(context, width, height);
  context.save();
  context.globalAlpha = .18;
  context.fillStyle = '#101114';
  for (let y = 70 * scale; y < height; y += 230 * scale) {
    context.save(); context.translate(width * .82, y); context.rotate(-.18); context.fillRect(-110 * scale, -12 * scale, 220 * scale, 24 * scale); context.restore();
  }
  context.restore();
  const cardX = 58 * scale; const cardY = 172 * scale; const cardW = width - 116 * scale; const cardH = height - 315 * scale;
  context.fillStyle = '#101114'; context.beginPath(); context.roundRect(cardX + 12 * scale, cardY + 14 * scale, cardW, cardH, 38 * scale); context.fill();
  context.fillStyle = '#fffdfb'; context.strokeStyle = '#101114'; context.lineWidth = 4 * scale; context.beginPath(); context.roundRect(cardX, cardY, cardW, cardH, 38 * scale); context.fill(); context.stroke();
  const avatarX = cardX + 44 * scale; const avatarY = cardY + 52 * scale; const avatarSize = 74 * scale;
  context.save(); context.beginPath(); context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); context.clip();
  if (assets.avatar) context.drawImage(assets.avatar, avatarX, avatarY, avatarSize, avatarSize);
  else { context.fillStyle = '#e9edf1'; context.fillRect(avatarX, avatarY, avatarSize, avatarSize); context.fillStyle = '#101114'; context.font = `900 ${Math.round(34 * scale)}px Arial`; context.textAlign = 'center'; context.fillText((post.authorName || 'C').charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + 49 * scale); }
  context.restore(); context.strokeStyle = '#101114'; context.lineWidth = 3 * scale; context.beginPath(); context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); context.stroke();
  context.textAlign = 'left'; context.fillStyle = '#101114'; context.font = `900 ${Math.round(30 * scale)}px Arial`; context.fillText(post.authorName || 'Callout member', avatarX + avatarSize + 18 * scale, avatarY + 30 * scale);
  context.fillStyle = '#5b6069'; context.font = `800 ${Math.round(20 * scale)}px Arial`; context.fillText(post.authorHandle || '@member', avatarX + avatarSize + 18 * scale, avatarY + 61 * scale);
  const bodyX = cardX + 45 * scale; let y = cardY + 210 * scale; const maxW = cardW - 90 * scale;
  context.fillStyle = '#101114'; context.font = `900 ${Math.round(stage === 0 ? 55 : 43) * scale}px Arial`; y = drawViralText(context, post.text || 'Untitled take', bodyX, y, maxW, (stage === 0 ? 62 : 52) * scale, stage === 0 ? 6 : 4) + 34 * scale;
  if (stage >= 1) {
    context.fillStyle = '#101114'; context.font = `900 ${Math.round(62 * scale)}px Arial`; context.fillText(`${total.toLocaleString()} votes`, bodyX, y);
    context.fillStyle = '#5b6069'; context.font = `800 ${Math.round(22 * scale)}px Arial`; context.fillText('live on Callout', bodyX, y + 34 * scale); y += 92 * scale;
  }
  if (stage >= 2) {
    const barX = bodyX; const barY = y + 58 * scale; const barW = maxW; const barH = 34 * scale;
    const buttonW = 222 * scale; const buttonH = 82 * scale;
    const drawMiniButton = (x, label, color, mood) => { context.fillStyle = '#101114'; context.beginPath(); context.roundRect(x + 8 * scale, y + 8 * scale, buttonW, buttonH, 18 * scale); context.fill(); context.fillStyle = color; context.strokeStyle = '#101114'; context.lineWidth = 4 * scale; context.beginPath(); context.roundRect(x, y, buttonW, buttonH, 18 * scale); context.fill(); context.stroke(); drawFace(context, x + 48 * scale, y + buttonH / 2, 24 * scale, mood, scale); context.fillStyle = '#101114'; context.font = `900 ${Math.round(26 * scale)}px Arial`; context.fillText(label, x + 84 * scale, y + 52 * scale); };
    drawMiniButton(bodyX, 'BASED', '#55df50', 'based'); drawMiniButton(bodyX + maxW - buttonW, 'HOT TAKE', '#ff5431', 'hot');
    context.fillStyle = '#0fae32'; context.font = `900 ${Math.round(34 * scale)}px Arial`; context.fillText(`${based}%`, bodyX, y + 130 * scale);
    context.fillStyle = '#ff3f21'; context.textAlign = 'right'; context.fillText(`${hot}%`, bodyX + maxW, y + 130 * scale); context.textAlign = 'left';
    context.save(); context.beginPath(); context.roundRect(barX, barY + 95 * scale, barW, barH, barH / 2); context.clip(); context.fillStyle = '#55df50'; context.fillRect(barX, barY + 95 * scale, barW * based / 100, barH); context.fillStyle = '#ff5431'; context.fillRect(barX + barW * based / 100, barY + 95 * scale, barW * hot / 100, barH); context.restore();
    context.strokeStyle = '#101114'; context.lineWidth = 4 * scale; context.beginPath(); context.roundRect(barX, barY + 95 * scale, barW, barH, barH / 2); context.stroke();
    y += 210 * scale;
  }
  if (stage >= 3) {
    context.fillStyle = '#101114'; context.font = `900 ${Math.round(24 * scale)}px Arial`; context.fillText('TOP TAKE', bodyX, y);
    context.fillStyle = '#2e333b'; context.font = `800 ${Math.round(31 * scale)}px Arial`; drawViralText(context, `“${topCommentText(post)}”`, bodyX, y + 42 * scale, maxW, 39 * scale, 3);
  }
  if (stage >= 4) {
    context.fillStyle = '#101114'; context.font = `900 ${Math.round(32 * scale)}px Arial`; context.fillText('What do you think?', bodyX, cardY + cardH - 78 * scale);
    context.textAlign = 'right'; context.fillText('VOTE ON CALLOUT', cardX + cardW - 45 * scale, cardY + cardH - 78 * scale); context.textAlign = 'left';
  }
  context.fillStyle = '#101114'; context.font = `900 ${Math.round(20 * scale)}px Arial`; context.fillText('CALLOUT', cardX + 45 * scale, cardY + cardH - 35 * scale);
}

async function generateViralVideo(post, assets, button) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return showToast('This browser cannot record video exports.');
  button.disabled = true; button.textContent = 'Generating...';
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  const stream = canvas.captureStream(30);
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type)) || '';
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : { videoBitsPerSecond: 4_000_000 });
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
  const done = new Promise(resolve => { recorder.onstop = resolve; });
  recorder.start();
  const duration = 7600; const started = performance.now();
  await new Promise(resolve => {
    const frame = now => {
      const progress = Math.min(1, (now - started) / duration);
      drawViralVideoFrame(canvas, post, assets, progress);
      if (progress < 1) requestAnimationFrame(frame); else resolve();
    };
    requestAnimationFrame(frame);
  });
  await new Promise(resolve => setTimeout(resolve, 180));
  recorder.stop();
  await done;
  const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
  triggerBlobDownload(blob, `callout-${String(post.id || 'take').replace(/[^a-zA-Z0-9_-]/g, '')}-viral-video.webm`);
  trackEvent('generate_viral_video', { post: post.id, votes: Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0) });
  button.disabled = false; button.textContent = 'Generate again';
  showToast('Viral video downloaded.');
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function openPostDownload(post) {
  const format = selectExportFormat(post); let backgroundMode = 'transparent'; let selectedType = 'overlay'; let exportCanvases = {};
  showActionDialog(actionDialogShell('EXPORT TAKE', 'Choose your format', `<p class="dialog-copy">Four clean exports, each made for a different kind of post.</p><div class="export-format-grid" role="list" aria-label="Export formats"><button type="button" class="export-format-option active" data-export-type="overlay" role="listitem"><span class="export-format-icon">T</span><span><strong>TikTok overlay</strong><small>Transparent · 1080 × 1920</small></span><b>Best for video</b></button><button type="button" class="export-format-option" data-export-type="quote" role="listitem"><span class="export-format-icon">“</span><span><strong>Quote card</strong><small>Opinion-first social image</small></span></button><button type="button" class="export-format-option" data-export-type="votes" role="listitem"><span class="export-format-icon">%</span><span><strong>Live votes</strong><small>Based vs Hot Take result</small></span></button><button type="button" class="export-format-option" data-export-type="takes" role="listitem"><span class="export-format-icon">↳</span><span><strong>Top Takes</strong><small>Best replies in one image</small></span></button></div><div class="export-background-choice" id="exportBackgroundChoice" role="group" aria-label="Export background" hidden><button type="button" data-export-background="transparent" class="active">Transparent outside</button><button type="button" data-export-background="brand">Callout background</button></div><div class="export-selected-preview export-preview-loading transparent-preview" id="exportSelectedPreview"><p>Building preview...</p></div><div class="export-selected-meta" id="exportSelectedMeta"><strong>TikTok overlay</strong><span>Transparent PNG · centered upper-middle</span></div><button class="primary-action export-selected-download" type="button" id="downloadSelectedExport" disabled>Preparing image...</button>`));
  try {
    const takes = await loadExportTakes(post);
    const assets = await loadExportAssets(post, takes);
    const renderPreview = () => {
      exportCanvases = {
        overlay: drawTikTokOverlayExport(post),
        quote: drawQuoteExport(post, format, assets, backgroundMode),
        votes: drawVoteExport(post, format, assets, backgroundMode),
        takes: takes.length ? drawTakesExport(post, takes, format, assets, backgroundMode) : null
      };
      const preview = document.querySelector('#exportSelectedPreview'); if (!preview) return;
      const canvas = exportCanvases[selectedType]; const isTransparent = selectedType === 'overlay' || backgroundMode === 'transparent';
      preview.classList.remove('export-preview-loading'); preview.classList.toggle('transparent-preview', isTransparent); preview.innerHTML = '';
      if (canvas) preview.append(canvas); else preview.innerHTML = '<p>This post needs at least one Take before Top Takes can be exported.</p>';
      const labels = { overlay: ['TikTok overlay', 'Transparent PNG · 1080 × 1920 · centered upper-middle'], quote: ['Quote card', `${format.width} × ${format.height} · opinion-first card`], votes: ['Live votes', `${format.width} × ${format.height} · current voting result`], takes: ['Top Takes', takes.length ? `${format.width} × ${format.height} · ${takes.length} featured ${takes.length === 1 ? 'Take' : 'Takes'}` : 'No Takes available yet'] };
      const meta = document.querySelector('#exportSelectedMeta'); if (meta) meta.innerHTML = `<strong>${labels[selectedType][0]}</strong><span>${labels[selectedType][1]}</span>`;
      const download = document.querySelector('#downloadSelectedExport'); if (download) { download.disabled = !canvas; download.textContent = canvas ? `Download ${labels[selectedType][0]}` : 'No Takes to download'; }
      const backgroundChoice = document.querySelector('#exportBackgroundChoice'); if (backgroundChoice) backgroundChoice.hidden = selectedType === 'overlay';
    };
    renderPreview();
    document.querySelectorAll('[data-export-type]').forEach(option => option.addEventListener('click', () => { selectedType = option.dataset.exportType; document.querySelectorAll('[data-export-type]').forEach(button => button.classList.toggle('active', button === option)); renderPreview(); }));
    document.querySelectorAll('[data-export-background]').forEach(choice => choice.addEventListener('click', () => { backgroundMode = choice.dataset.exportBackground; document.querySelectorAll('[data-export-background]').forEach(button => button.classList.toggle('active', button === choice)); renderPreview(); }));
    const download = document.querySelector('#downloadSelectedExport');
    download.addEventListener('click', async () => {
      const canvas = exportCanvases[selectedType]; if (!canvas) return;
      download.disabled = true; download.textContent = 'Downloading...';
      try { await downloadSelectedPostExport(post, selectedType, format, backgroundMode, canvas, takes.length); closeActionDialog(); showToast(`${selectedType === 'overlay' ? 'TikTok overlay' : selectedType === 'takes' ? 'Top Takes' : selectedType === 'votes' ? 'Live votes' : 'Quote card'} downloaded.`); }
      catch (error) { download.disabled = false; download.textContent = 'Try download again'; showToast(error.message); }
    });
  } catch (error) { const preview = document.querySelector('#exportSelectedPreview'); if (preview) preview.innerHTML = '<p>Preview could not be generated.</p>'; showToast(error.message); }
}

function canvasWrappedLines(context, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text || '').split(/\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; } else line = candidate;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function exportMediaUrls(post) {
  const direct = (post.media || []).filter(item => item.type === 'image' || item.type === 'gif').map(item => item.url);
  const external = (post.externalEmbed?.mediaItems || []).filter(item => item.type === 'image').map(item => item.url);
  if (!external.length && post.externalEmbed?.mediaType === 'image' && post.externalEmbed.mediaUrl) external.push(post.externalEmbed.mediaUrl);
  return [...direct, ...external].filter(Boolean).slice(0, 4);
}

function selectExportFormat(post) {
  const words = String(post.text || '').trim().split(/\s+/).filter(Boolean).length; const images = exportMediaUrls(post).length;
  if (images >= 3 || words > 120) return { key: 'story', label: 'Story portrait', width: 1080, height: 1920 };
  if (images || words > 55) return { key: 'tall', label: 'Tall social portrait', width: 1080, height: 1600 };
  return { key: 'social', label: 'Social portrait', width: 1080, height: 1350 };
}

function exportCanvas(format) {
  const { width, height } = format;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  return { canvas, context: canvas.getContext('2d'), width, height, unit: width / 1080 };
}

function loadExportImage(url) {
  return new Promise(resolve => {
    if (!url) return resolve(null);
    const image = new Image(); const timer = setTimeout(() => resolve(null), 7000);
    if (!String(url).startsWith('data:')) image.crossOrigin = 'anonymous';
    image.onload = () => { clearTimeout(timer); resolve(image); }; image.onerror = () => { clearTimeout(timer); resolve(null); }; image.src = url;
  });
}

function exportCommentAuthor(comment) {
  const author = comment?.author || {};
  if (typeof author === 'string') return { name: author.replace(/^@/, ''), handle: author.startsWith('@') ? author : `@${author}`, avatarUrl: '' };
  const handle = author.handle || '@member';
  return { name: author.displayName || handle.replace(/^@/, ''), handle, avatarUrl: author.avatarUrl || '' };
}

async function loadExportTakes(post) {
  let comments = flattenPostComments(post.comments || []);
  if (!comments.length && post.databaseId && Number(post.commentCount || 0) > 0) {
    try {
      const payload = await apiFetch(`/api/posts/${post.databaseId}/comments`, {}, false);
      post.comments = payload.comments || [];
      post.commentCount = countComments(post.comments);
      comments = flattenPostComments(post.comments);
    } catch (error) { console.warn('Unable to load Takes for export:', error.message); }
  }
  return comments.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).slice(0, 3);
}

async function loadExportAssets(post, takes = []) {
  const mediaUrls = exportMediaUrls(post);
  const images = await Promise.all([loadExportImage(post.authorAvatarUrl), ...mediaUrls.map(loadExportImage), ...takes.map(comment => loadExportImage(exportCommentAuthor(comment).avatarUrl))]);
  return { avatar: images[0], media: images.slice(1, 1 + mediaUrls.length).filter(Boolean), takeAvatars: images.slice(1 + mediaUrls.length) };
}

function drawExportBackground(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ffb7c7'); gradient.addColorStop(.48, '#f16c89'); gradient.addColorStop(1, '#ff7043');
  context.fillStyle = gradient; context.fillRect(0, 0, width, height);
  context.globalAlpha = .14; context.fillStyle = '#fff';
  for (let x = -height; x < width; x += 150) { context.save(); context.translate(x, 0); context.rotate(-.45); context.fillRect(0, 0, 64, height * 1.6); context.restore(); }
  context.globalAlpha = 1;
}

function drawRoundedCard(context, x, y, width, height, radius, shadow) {
  context.fillStyle = shadow; context.beginPath(); context.roundRect(x + 12, y + 14, width, height, radius); context.fill();
  context.fillStyle = '#fffdfb'; context.strokeStyle = '#101114'; context.lineWidth = 4; context.beginPath(); context.roundRect(x, y, width, height, radius); context.fill(); context.stroke();
}

function drawExportAuthor(context, post, x, y, unit, avatarImage) {
  const avatar = Math.round(72 * unit); const radius = avatar / 2;
  context.fillStyle = '#e8ecef'; context.strokeStyle = '#101114'; context.lineWidth = Math.max(3, 3 * unit); context.beginPath(); context.arc(x + radius, y + radius, radius, 0, Math.PI * 2); context.fill(); context.stroke();
  if (avatarImage) { context.save(); context.beginPath(); context.arc(x + radius, y + radius, radius - 3 * unit, 0, Math.PI * 2); context.clip(); drawImageCover(context, avatarImage, x + 3 * unit, y + 3 * unit, avatar - 6 * unit, avatar - 6 * unit); context.restore(); }
  else { context.fillStyle = '#101114'; context.font = `900 ${Math.round(32 * unit)}px Arial`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText((post.authorName || post.authorHandle || 'C').replace('@', '').charAt(0).toUpperCase(), x + radius, y + radius + unit); context.textAlign = 'left'; context.textBaseline = 'alphabetic'; }
  const name = post.authorName || String(post.authorHandle || '@member').replace('@', '');
  context.fillStyle = '#101114'; context.font = `900 ${Math.round(27 * unit)}px Arial`; context.fillText(name, x + avatar + 18 * unit, y + 29 * unit);
  context.fillStyle = '#5f6269'; context.font = `700 ${Math.round(18 * unit)}px Arial`; context.fillText(post.authorHandle || '@member', x + avatar + 18 * unit, y + 57 * unit);
}

function drawImageCover(context, image, x, y, width, height) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight); const sourceWidth = width / ratio; const sourceHeight = height / ratio;
  context.drawImage(image, (image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

function drawExportMedia(context, images, x, y, width, height, unit) {
  if (!images.length) return;
  const gap = 8 * unit; context.save(); context.beginPath(); context.roundRect(x, y, width, height, 18 * unit); context.clip();
  if (images.length === 1) drawImageCover(context, images[0], x, y, width, height);
  else {
    const cellWidth = (width - gap) / 2; const rows = images.length > 2 ? 2 : 1; const cellHeight = (height - gap * (rows - 1)) / rows;
    images.forEach((image, index) => drawImageCover(context, image, x + (index % 2) * (cellWidth + gap), y + Math.floor(index / 2) * (cellHeight + gap), cellWidth, cellHeight));
  }
  context.restore(); context.strokeStyle = '#101114'; context.lineWidth = 3 * unit; context.beginPath(); context.roundRect(x, y, width, height, 18 * unit); context.stroke();
}

function fitExportText(context, text, maxWidth, maxHeight, preferredSize, minimumSize, unit) {
  for (let size = preferredSize; size >= minimumSize; size -= 2) {
    context.font = `900 ${Math.round(size * unit)}px Arial`;
    const lines = canvasWrappedLines(context, String(text || '').trim(), maxWidth);
    const lineHeight = Math.round(size * 1.08 * unit);
    if (lines.length * lineHeight <= maxHeight) return { lines, lineHeight, font: context.font };
  }
  context.font = `900 ${Math.round(minimumSize * unit)}px Arial`;
  const lineHeight = Math.round(minimumSize * 1.08 * unit); const lines = canvasWrappedLines(context, String(text || '').trim(), maxWidth); const limit = Math.max(1, Math.floor(maxHeight / lineHeight));
  if (lines.length > limit) { lines.length = limit; lines[limit - 1] = `${lines[limit - 1].replace(/[.,;:!?]*$/, '')}…`; }
  return { lines, lineHeight, font: context.font };
}

function drawFace(context, centerX, centerY, radius, mood, unit) {
  if (mood === 'hot') {
    context.save();
    context.fillStyle = '#ffb13b'; context.strokeStyle = '#101114'; context.lineWidth = Math.max(3, 3 * unit);
    context.beginPath();
    context.moveTo(centerX, centerY - radius * 1.18);
    context.bezierCurveTo(centerX + radius * .16, centerY - radius * .58, centerX + radius * .78, centerY - radius * .72, centerX + radius * .78, centerY - radius * .08);
    context.bezierCurveTo(centerX + radius * 1.05, centerY + radius * .22, centerX + radius * .8, centerY + radius * 1.05, centerX, centerY + radius * 1.12);
    context.bezierCurveTo(centerX - radius * .82, centerY + radius * 1.05, centerX - radius * 1.02, centerY + radius * .25, centerX - radius * .7, centerY - radius * .2);
    context.bezierCurveTo(centerX - radius * .64, centerY - radius * .56, centerX - radius * .26, centerY - radius * .7, centerX, centerY - radius * 1.18);
    context.closePath(); context.fill(); context.stroke();
    context.fillStyle = '#ffd37a'; context.beginPath(); context.arc(centerX, centerY + radius * .12, radius * .61, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = '#101114'; context.beginPath(); context.arc(centerX - radius * .22, centerY, radius * .065, 0, Math.PI * 2); context.arc(centerX + radius * .22, centerY, radius * .065, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(centerX, centerY + radius * .15, radius * .3, .2, Math.PI - .2); context.stroke(); context.restore();
    return;
  }
  context.strokeStyle = '#101114'; context.lineWidth = Math.max(3, 3 * unit); context.beginPath(); context.arc(centerX, centerY, radius, 0, Math.PI * 2); context.stroke();
  context.fillStyle = '#101114'; context.beginPath(); context.arc(centerX - radius * .34, centerY - radius * .18, radius * .09, 0, Math.PI * 2); context.arc(centerX + radius * .34, centerY - radius * .18, radius * .09, 0, Math.PI * 2); context.fill();
  context.beginPath();
  if (mood === 'based') context.arc(centerX, centerY + radius * .05, radius * .42, .15, Math.PI - .15);
  else context.arc(centerX, centerY + radius * .55, radius * .42, Math.PI + .2, Math.PI * 2 - .2);
  context.stroke();
}

function drawTikTokOverlayExport(post) {
  const format = { key: 'overlay', label: 'TikTok overlay', width: 1080, height: 1920 };
  const { canvas, context, width } = exportCanvas(format);
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const based = total ? Math.round(Number(post.alrightVotes || 0) / total * 100) : 50;
  const hot = 100 - based;
  const centerX = width / 2;
  const maxWidth = 900;
  const maxTextHeight = 430;
  const fitted = fitExportText(context, post.text || 'Untitled take', maxWidth, maxTextHeight, 76, 46, 1);
  const resultGap = 42;
  const resultLineHeight = 42;
  const brandGap = 26;
  const brandLineHeight = 28;
  const groupHeight = fitted.lines.length * fitted.lineHeight + resultGap + resultLineHeight + brandGap + brandLineHeight;
  let y = Math.max(300, 510 - groupHeight / 2) + fitted.lineHeight;

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.lineJoin = 'round';
  context.miterLimit = 2;
  context.font = fitted.font;
  context.strokeStyle = '#050505';
  context.fillStyle = '#ffffff';
  context.lineWidth = 18;
  fitted.lines.forEach(line => {
    context.strokeText(line, centerX, y, maxWidth);
    context.fillText(line, centerX, y, maxWidth);
    y += fitted.lineHeight;
  });

  y += resultGap;
  const verdict = `${based}% BASED · ${hot}% HOT`;
  context.font = '900 36px Arial';
  context.lineWidth = 11;
  context.strokeText(verdict, centerX, y, maxWidth);
  context.fillText(verdict, centerX, y, maxWidth);

  y += brandGap + brandLineHeight;
  context.font = '900 22px Arial';
  context.lineWidth = 8;
  context.globalAlpha = .82;
  context.strokeText('CALLOUT', centerX, y, maxWidth);
  context.fillText('CALLOUT', centerX, y, maxWidth);
  context.restore();
  return canvas;
}

function drawQuoteExport(post, format, assets, backgroundMode = 'brand') {
  const { canvas, context, width, height, unit } = exportCanvas(format); if (backgroundMode === 'brand') drawExportBackground(context, width, height);
  const side = Math.round(58 * unit); const cardWidth = width - side * 2; const innerPad = 42 * unit; const innerWidth = cardWidth - innerPad * 2;
  const mediaHeight = assets.media.length ? Math.min(format.key === 'story' ? 650 : 480, assets.media.length === 1 ? 560 : 470) * unit : 0;
  const textLimit = Math.min(format.key === 'story' ? 620 : 450, height * .36) * unit;
  const fitted = fitExportText(context, post.text, innerWidth, textLimit, 58, 32, unit); const textHeight = fitted.lines.length * fitted.lineHeight;
  const cardHeight = Math.min(height - 150 * unit, Math.max(520 * unit, 42 * unit + 72 * unit + 42 * unit + textHeight + (mediaHeight ? 32 * unit + mediaHeight : 0) + 92 * unit));
  const top = Math.round((height - cardHeight) / 2); drawRoundedCard(context, side, top, cardWidth, cardHeight, 42 * unit, '#101114');
  const inner = side + innerPad; drawExportAuthor(context, post, inner, top + 38 * unit, unit, assets.avatar);
  let y = top + 155 * unit + fitted.lineHeight; context.fillStyle = '#101114'; context.font = fitted.font; fitted.lines.forEach(line => { context.fillText(line, inner, y); y += fitted.lineHeight; });
  if (mediaHeight) { y += 24 * unit; drawExportMedia(context, assets.media, inner, y, innerWidth, Math.min(mediaHeight, top + cardHeight - 102 * unit - y), unit); }
  context.strokeStyle = '#d5d2ce'; context.lineWidth = 2 * unit; context.beginPath(); context.moveTo(inner, top + cardHeight - 68 * unit); context.lineTo(side + cardWidth - innerPad, top + cardHeight - 68 * unit); context.stroke(); context.fillStyle = '#101114'; context.font = `900 ${Math.round(19 * unit)}px Arial`; context.fillText('CALLOUT', inner, top + cardHeight - 30 * unit); context.fillStyle = '#6b6e74'; context.font = `700 ${Math.round(15 * unit)}px Arial`; context.textAlign = 'right'; context.fillText('CALL IT LIKE YOU SEE IT.', side + cardWidth - innerPad, top + cardHeight - 31 * unit); context.textAlign = 'left';
  return canvas;
}

function drawVoteExport(post, format, assets, backgroundMode = 'brand') {
  const { canvas, context, width, height, unit } = exportCanvas(format); if (backgroundMode === 'brand') drawExportBackground(context, width, height);
  const side = Math.round(56 * unit); const cardWidth = width - side * 2; const inner = side + 42 * unit;
  context.fillStyle = '#101114'; const fitted = fitExportText(context, post.text, cardWidth - 84 * unit, 230 * unit, 44, 28, unit); const textHeight = Math.min(4, fitted.lines.length) * fitted.lineHeight;
  const relativeVoteTop = 150 * unit + textHeight + 42 * unit; const cardHeight = Math.max(640 * unit, relativeVoteTop + 105 * unit + 70 * unit + 34 * unit + 118 * unit);
  const top = Math.round((height - cardHeight) / 2); drawRoundedCard(context, side, top, cardWidth, cardHeight, 38 * unit, '#101114');
  drawExportAuthor(context, post, inner, top + 35 * unit, unit, assets.avatar);
  let y = top + 150 * unit + fitted.lineHeight; context.font = fitted.font; context.fillStyle = '#101114';
  fitted.lines.slice(0, 4).forEach(line => { context.fillText(line, inner, y); y += fitted.lineHeight; });
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0); const based = total ? Math.round(Number(post.alrightVotes || 0) / total * 100) : 50; const cringe = 100 - based;
  const voteTop = y + 42 * unit; const buttonWidth = 250 * unit; const buttonHeight = 105 * unit; const rightX = side + cardWidth - 42 * unit - buttonWidth;
  const drawButton = (x, color, label, mood) => { context.fillStyle = '#101114'; context.beginPath(); context.roundRect(x + 8 * unit, voteTop + 9 * unit, buttonWidth, buttonHeight, 19 * unit); context.fill(); context.fillStyle = color; context.strokeStyle = '#101114'; context.lineWidth = 4 * unit; context.beginPath(); context.roundRect(x, voteTop, buttonWidth, buttonHeight, 19 * unit); context.fill(); context.stroke(); drawFace(context, x + 51 * unit, voteTop + buttonHeight / 2, 25 * unit, mood, unit); context.fillStyle = '#101114'; context.font = `900 ${Math.round(24 * unit)}px Arial`; const labelX = x + 91 * unit; const maxLabelWidth = buttonWidth - 105 * unit; if (context.measureText(label).width > maxLabelWidth) context.font = `900 ${Math.round(21 * unit)}px Arial`; context.fillText(label, labelX, voteTop + 64 * unit, maxLabelWidth); };
  drawButton(inner, '#55df50', 'BASED', 'based'); drawButton(rightX, '#ff5431', 'HOT TAKE', 'hot');
  const barX = inner; const barY = voteTop + buttonHeight + 70 * unit; const barWidth = cardWidth - 84 * unit; const barHeight = 34 * unit;
  context.save(); context.beginPath(); context.roundRect(barX, barY, barWidth, barHeight, barHeight / 2); context.clip(); context.fillStyle = '#55df50'; context.fillRect(barX, barY, barWidth * based / 100, barHeight); context.fillStyle = '#ff5431'; context.fillRect(barX + barWidth * based / 100, barY, barWidth * cringe / 100, barHeight); context.restore(); context.strokeStyle = '#101114'; context.lineWidth = 4 * unit; context.beginPath(); context.roundRect(barX, barY, barWidth, barHeight, barHeight / 2); context.stroke();
  context.font = `900 ${Math.round(29 * unit)}px Arial`; context.fillStyle = '#18a832'; context.fillText(`${based}%`, barX, barY - 18 * unit); context.fillStyle = '#ef3f1b'; context.textAlign = 'right'; context.fillText(`${cringe}%`, barX + barWidth, barY - 18 * unit); context.textAlign = 'left';
  context.fillStyle = '#555960'; context.font = `700 ${Math.round(20 * unit)}px Arial`; context.fillText(`${total.toLocaleString()} votes  ·  ${Number(post.commentCount || 0).toLocaleString()} Takes`, barX, barY + 82 * unit);
  context.fillStyle = '#101114'; context.font = `900 ${Math.round(18 * unit)}px Arial`; context.textAlign = 'right'; context.fillText('CALLOUT', side + cardWidth - 42 * unit, top + cardHeight - 28 * unit); context.textAlign = 'left';
  return canvas;
}

function drawTakesExport(post, takes, format, assets, backgroundMode = 'brand') {
  const { canvas, context, width, height, unit } = exportCanvas(format); if (backgroundMode === 'brand') drawExportBackground(context, width, height);
  const side = Math.round(46 * unit); const cardWidth = width - side * 2; const innerPad = 34 * unit; const inner = side + innerPad; const contentWidth = cardWidth - innerPad * 2;
  context.fillStyle = '#101114';
  const postText = fitExportText(context, post.text, contentWidth - 6 * unit, 170 * unit, 39, 27, unit);
  const postHeight = Math.max(345 * unit, 145 * unit + postText.lines.length * postText.lineHeight + 116 * unit);
  const takeRowHeight = (takes.length === 1 ? 190 : takes.length === 2 ? 174 : 162) * unit;
  const takesHeight = 30 * unit + takeRowHeight * takes.length + 50 * unit;
  const gap = 28 * unit; const groupHeight = postHeight + gap + takesHeight; const top = Math.max(42 * unit, (height - groupHeight) / 2);

  drawRoundedCard(context, side, top, cardWidth, postHeight, 30 * unit, '#101114');
  drawExportAuthor(context, post, inner, top + 27 * unit, unit, assets.avatar);
  let postY = top + 132 * unit + postText.lineHeight; context.fillStyle = '#101114'; context.font = postText.font;
  postText.lines.forEach(line => { context.fillText(line, inner, postY); postY += postText.lineHeight; });
  const total = Number(post.alrightVotes || 0) + Number(post.cringeVotes || 0);
  const based = total ? Math.round(Number(post.alrightVotes || 0) / total * 100) : 50;
  const hot = 100 - based;
  const voteY = top + postHeight - 76 * unit; const buttonHeight = 52 * unit; const basedWidth = 166 * unit; const hotWidth = 198 * unit;
  context.strokeStyle = '#d5d2ce'; context.lineWidth = 2 * unit; context.beginPath(); context.moveTo(inner, voteY - 14 * unit); context.lineTo(inner + contentWidth, voteY - 14 * unit); context.stroke();
  const drawBasedExportGlyph = (centerX, centerY, radius) => {
    context.save(); context.translate(centerX, centerY); context.scale(radius / 16, radius / 16); context.translate(-16, -16);
    const seal = new Path2D('M16 2.5 19 6l4.5-1 .7 4.5 4 2.5-2.4 4 1.5 4.4-4.4 1.7-2 4.2-4.6-1-3.5 3-3.1-3.4-4.7.4-.4-4.7-3.8-2.7 2.7-3.8-1.1-4.5 4.5-1.4L11 4.5z');
    context.fillStyle = '#adf4aa'; context.strokeStyle = '#101114'; context.lineWidth = 1.8; context.lineJoin = 'round'; context.fill(seal); context.stroke(seal);
    context.fillStyle = '#f5f1df'; context.lineWidth = 2; context.beginPath(); context.arc(16, 15.5, 8.5, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = '#101114'; context.beginPath(); context.arc(13, 13.5, 1.2, 0, Math.PI * 2); context.arc(19, 13.5, 1.2, 0, Math.PI * 2); context.fill();
    context.lineWidth = 2; context.lineCap = 'round'; context.beginPath(); context.moveTo(12.2, 17.2); context.bezierCurveTo(13.2, 19.7, 18.8, 19.7, 19.8, 17.2); context.stroke(); context.restore();
  };
  const drawCompactVote = (x, buttonWidth, color, label, mood) => {
    context.fillStyle = '#101114'; context.beginPath(); context.roundRect(x + 6 * unit, voteY + 7 * unit, buttonWidth, buttonHeight, 13 * unit); context.fill();
    context.fillStyle = color; context.strokeStyle = '#101114'; context.lineWidth = 3 * unit; context.beginPath(); context.roundRect(x, voteY, buttonWidth, buttonHeight, 13 * unit); context.fill(); context.stroke();
    if (mood === 'based') drawBasedExportGlyph(x + 31 * unit, voteY + buttonHeight / 2, 17 * unit);
    else drawFace(context, x + 31 * unit, voteY + buttonHeight / 2, 17 * unit, mood, unit);
    context.fillStyle = '#101114'; context.font = `900 ${Math.round(16 * unit)}px Arial`; context.fillText(label, x + 59 * unit, voteY + 32 * unit);
  };
  const hotButtonX = inner + contentWidth - hotWidth;
  const basedPercentX = inner + basedWidth + 14 * unit; const basedPercentWidth = 58 * unit;
  const hotPercentWidth = 58 * unit; const hotPercentRight = hotButtonX - 14 * unit; const hotPercentX = hotPercentRight - hotPercentWidth;
  const compactBarX = basedPercentX + basedPercentWidth + 14 * unit; const compactBarRight = hotPercentX - 14 * unit; const compactBarWidth = compactBarRight - compactBarX; const compactBarHeight = 17 * unit; const compactBarY = voteY + (buttonHeight - compactBarHeight) / 2;
  drawCompactVote(inner, basedWidth, '#55df50', 'BASED', 'based');
  drawCompactVote(hotButtonX, hotWidth, '#ff5431', 'HOT TAKE', 'hot');
  context.fillStyle = '#18a832'; context.font = `900 ${Math.round(20 * unit)}px Arial`; context.fillText(`${based}%`, basedPercentX, voteY + 33 * unit);
  context.fillStyle = '#ef3f1b'; context.textAlign = 'right'; context.fillText(`${hot}%`, hotPercentRight, voteY + 33 * unit); context.textAlign = 'left';
  context.save(); context.beginPath(); context.roundRect(compactBarX, compactBarY, compactBarWidth, compactBarHeight, compactBarHeight / 2); context.clip();
  context.fillStyle = '#55df50'; context.fillRect(compactBarX, compactBarY, compactBarWidth * based / 100, compactBarHeight);
  context.fillStyle = '#ff5431'; context.fillRect(compactBarX + compactBarWidth * based / 100, compactBarY, compactBarWidth * hot / 100, compactBarHeight); context.restore();
  context.strokeStyle = '#101114'; context.lineWidth = 3 * unit; context.beginPath(); context.roundRect(compactBarX, compactBarY, compactBarWidth, compactBarHeight, compactBarHeight / 2); context.stroke();

  const takesTop = top + postHeight + gap; drawRoundedCard(context, side, takesTop, cardWidth, takesHeight, 28 * unit, '#101114');
  takes.forEach((comment, index) => {
    const rowTop = takesTop + 18 * unit + index * takeRowHeight; const author = exportCommentAuthor(comment); const avatarSize = 54 * unit; const avatarX = inner; const avatarY = rowTop + 18 * unit; const avatarImage = assets.takeAvatars?.[index];
    context.strokeStyle = '#c8c5bf'; context.lineWidth = 3 * unit;
    if (index < takes.length - 1) { context.beginPath(); context.moveTo(avatarX + avatarSize / 2, avatarY + avatarSize); context.lineTo(avatarX + avatarSize / 2, rowTop + takeRowHeight); context.stroke(); }
    context.fillStyle = '#e8ecef'; context.strokeStyle = '#101114'; context.lineWidth = 3 * unit; context.beginPath(); context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2); context.fill(); context.stroke();
    if (avatarImage) { context.save(); context.beginPath(); context.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 3 * unit, 0, Math.PI * 2); context.clip(); drawImageCover(context, avatarImage, avatarX + 3 * unit, avatarY + 3 * unit, avatarSize - 6 * unit, avatarSize - 6 * unit); context.restore(); }
    else { context.fillStyle = '#101114'; context.font = `900 ${Math.round(22 * unit)}px Arial`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText((author.name || 'C').charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + unit); context.textAlign = 'left'; context.textBaseline = 'alphabetic'; }
    const textX = avatarX + avatarSize + 20 * unit; const textWidth = contentWidth - avatarSize - 22 * unit;
    context.fillStyle = '#101114'; context.font = `900 ${Math.round(21 * unit)}px Arial`; context.fillText(author.handle || author.name, textX, rowTop + 44 * unit, textWidth);
    const commentText = fitExportText(context, comment.text, textWidth, takeRowHeight - 78 * unit, 28, 20, unit); context.fillStyle = '#101114'; context.font = commentText.font; let commentY = rowTop + 82 * unit;
    commentText.lines.forEach(line => { context.fillText(line, textX, commentY); commentY += commentText.lineHeight; });
    if (index < takes.length - 1) { context.strokeStyle = '#e0ddd7'; context.lineWidth = 2 * unit; context.beginPath(); context.moveTo(textX, rowTop + takeRowHeight - 4 * unit); context.lineTo(side + cardWidth - innerPad, rowTop + takeRowHeight - 4 * unit); context.stroke(); }
  });
  context.fillStyle = '#101114'; context.font = `900 ${Math.round(18 * unit)}px Arial`; context.textAlign = 'right'; context.fillText('CALLOUT', side + cardWidth - innerPad, takesTop + takesHeight - 25 * unit); context.textAlign = 'left';
  return canvas;
}

async function triggerCanvasDownload(canvas, filename) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The image could not be generated.');
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function downloadPostImages(post, format, backgroundMode, canvases) {
  await document.fonts?.ready;
  const safeId = String(post.id || 'take').replace(/[^a-zA-Z0-9_-]/g, '');
  await triggerCanvasDownload(canvases[0], `callout-${safeId}-${format.key}-${backgroundMode}-quote.png`);
  await new Promise(resolve => setTimeout(resolve, 180));
  await triggerCanvasDownload(canvases[1], `callout-${safeId}-${format.key}-${backgroundMode}-votes.png`);
}

async function downloadTakesImage(post, format, backgroundMode, canvas) {
  await document.fonts?.ready;
  const safeId = String(post.id || 'take').replace(/[^a-zA-Z0-9_-]/g, '');
  await triggerCanvasDownload(canvas, `callout-${safeId}-${format.key}-${backgroundMode}-takes.png`);
  trackEvent('download_post_takes', { post: post.id, takes: Math.min(3, flattenPostComments(post.comments || []).length) });
}

async function downloadSelectedPostExport(post, type, format, backgroundMode, canvas, takeCount = 0) {
  await document.fonts?.ready;
  const safeId = String(post.id || 'take').replace(/[^a-zA-Z0-9_-]/g, '');
  const names = {
    overlay: `callout-${safeId}-tiktok-overlay.png`,
    quote: `callout-${safeId}-${format.key}-${backgroundMode}-quote.png`,
    votes: `callout-${safeId}-${format.key}-${backgroundMode}-votes.png`,
    takes: `callout-${safeId}-${format.key}-${backgroundMode}-takes.png`
  };
  if (!names[type]) throw new Error('That export format is unavailable.');
  await triggerCanvasDownload(canvas, names[type]);
  trackEvent('download_post_export', { post: post.id, type, background: type === 'overlay' ? 'transparent' : backgroundMode, takes: type === 'takes' ? takeCount : undefined });
}

function openEditPost(post) {
  showActionDialog(actionDialogShell('EDIT TAKE', 'Refine your take', `<form id="editPostForm"><label>Post content<textarea name="content" maxlength="180" required>${escapeHtml(post.text)}</textarea></label><label>Category<select name="category">${['Movies','Music','Entertainment','Games','Life'].map(category => `<option ${post.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label><button class="primary-action" type="submit">Save changes</button></form>`));
  document.querySelector('#editPostForm').addEventListener('submit', async event => {
    event.preventDefault();
    const content = sanitizeInput(event.currentTarget.elements.content.value);
    const category = event.currentTarget.elements.category.value;
    if (!content) return;
    const validationError = postTextError(content); if (validationError) return showToast(validationError);
    try { if (post.databaseId && sessionUser) await apiFetch(`/api/posts/${post.databaseId}`, { method: 'PATCH', body: JSON.stringify({ content, category }) }); post.text = content.toUpperCase(); post.category = category; persist(); closeActionDialog(); renderRoute(); showToast('Post updated.'); }
    catch (error) { showToast(error.message); }
  });
}

function openDeletePost(post) {
  showActionDialog(actionDialogShell('DELETE TAKE', 'Are you sure?', `<p class="dialog-copy">This permanently removes the post and its local discussion thread.</p><div class="confirm-actions"><button class="quiet-action" type="button" data-close-action-secondary>Cancel</button><button class="danger-action" type="button" data-confirm-delete>Delete post</button></div>`));
  document.querySelector('[data-close-action-secondary]').addEventListener('click', closeActionDialog);
  document.querySelector('[data-confirm-delete]').addEventListener('click', async () => {
    try {
      if (post.databaseId && sessionUser) await apiFetch(`/api/posts/${post.databaseId}`, { method: 'DELETE' });
      state.posts = state.posts.filter(item => item.id !== post.id);
      state.guildPosts = state.guildPosts.filter(item => item.id !== post.id);
      state.savedPostIds = state.savedPostIds.filter(id => id !== post.id);
      persist(); closeActionDialog(); navigate('home'); renderRoute(); showToast('Post deleted.');
    } catch (error) { showToast(error.message); }
  });
}

async function sharePost(post) {
  const embedUrl = `${location.origin}/embed/post/${post.id}`;
  const directUrl = `${location.origin}${location.pathname}#take/${post.id}`;
  const code = `<iframe src="${embedUrl}" title="Callout take" width="100%" height="430" style="border:0;max-width:720px" loading="lazy" allowtransparency="true"></iframe>`;
  showActionDialog(actionDialogShell('SHARE TAKE', 'Embed this Callout', `<p class="dialog-copy">A live, responsive card that keeps the current Based and Hot Take totals visible.</p><div class="embed-preview"><iframe src="${escapeHtml(embedUrl)}" title="Callout embed preview"></iframe></div><label class="embed-code-label">HTML embed code<textarea id="embedCode" readonly>${escapeHtml(code)}</textarea></label><div class="embed-share-actions"><button type="button" data-copy-direct>Copy link</button><button class="primary-action" type="button" data-copy-embed>Copy HTML embed</button></div>`));
  document.querySelector('[data-copy-embed]').addEventListener('click', async () => { await copyShareText(code); showToast('Embed HTML copied!'); });
  document.querySelector('[data-copy-direct]').addEventListener('click', async () => { await copyShareText(directUrl); showToast('Direct link copied!'); });
}

async function copyShareText(value) {
  try { await navigator.clipboard.writeText(value); }
  catch { const input = document.createElement('textarea'); input.value = value; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove(); }
}

function openReportPost(post) {
  showActionDialog(actionDialogShell('REPORT TAKE', 'Tell us what is wrong', `<form id="reportPostForm"><label>Reason<select name="reason"><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="offensive">Offensive</option><option value="other">Other</option></select></label><label>Details<textarea name="details" maxlength="500" placeholder="Optional context"></textarea></label><button class="primary-action" type="submit">Submit report</button></form>`));
  document.querySelector('#reportPostForm').addEventListener('submit', async event => {
    event.preventDefault();
    const reason = event.currentTarget.elements.reason.value;
    const details = sanitizeInput(event.currentTarget.elements.details.value);
    try {
      if (post.databaseId && sessionUser) await apiFetch(`/api/posts/${post.databaseId}/reports`, { method: 'POST', body: JSON.stringify({ reason, details }) });
      else console.info('Development report:', { postId: post.id, reason, details });
      closeActionDialog(); showToast('Report submitted.');
    } catch (error) { showToast(error.message); }
  });
}

function updateProfilePreview(event) {
  const form = event.currentTarget;
  if (event.target.name === 'displayName') document.querySelector('#previewName').textContent = sanitizeInput(event.target.value) || 'Display name';
  if (event.target.name === 'status') document.querySelector('#previewStatus').textContent = event.target.value;
  if (event.target.name === 'themeColor') { document.querySelector('#profilePreview').style.setProperty('--profile-accent', event.target.value); document.querySelector('#colorHex').textContent = event.target.value; }
  if (event.target.name === 'bio') document.querySelector('#bioCounter').textContent = `${event.target.value.length} / 1000`;
  if (form.elements.bannerUrl?.value) document.querySelector('#bannerPreview').dataset.hasImage = 'true';
}

function handleBannerUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { event.target.value = ''; return showToast('Choose an image smaller than 2 MB.'); }
  const reader = new FileReader();
  reader.onload = () => {
    const form = document.querySelector('#settingsForm');
    form.elements.bannerUrl.value = reader.result;
    document.querySelector('#bannerPreview').innerHTML = `<img src="${reader.result}" alt="Banner preview" />`;
    showToast('Banner ready to save.');
  };
  reader.readAsDataURL(file);
}

function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { event.target.value = ''; return showToast('Choose an avatar smaller than 2 MB.'); }
  const reader = new FileReader();
  reader.onload = () => { document.querySelector('#settingsForm').elements.avatarUrl.value = reader.result; state.profile.avatarUrl = reader.result; document.querySelector('.preview-avatar').innerHTML = `<img src="${reader.result}" alt="Avatar preview" />`; showToast('Avatar ready to save.'); };
  reader.readAsDataURL(file);
}

async function loginUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const payload = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: sanitizeInput(form.elements.email.value), password: form.elements.password.value }) }, false);
    applySessionUser(payload.user); trackEvent('login', { method: 'email' }); await Promise.all([hydratePosts(), hydrateAccountData(), hydrateGuilds(), hydrateLeaderboard()]); navigate('home'); showToast('Signed in securely.');
  } catch (error) { showToast(error.message); }
}

async function signupUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const payload = await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ displayName: sanitizeInput(form.elements.displayName.value), email: sanitizeInput(form.elements.email.value), password: form.elements.password.value, ageConfirmed: form.elements.ageConfirmed.checked }) }, false);
    applySessionUser(payload.user); trackEvent('sign_up', { method: 'email' }); await Promise.all([hydrateAccountData(), hydrateLeaderboard()]); navigate('settings'); showToast('Account created. Customize your profile.');
  } catch (error) { showToast(error.message); }
}

async function requestPasswordReset(event) {
  event.preventDefault();
  const email = sanitizeInput(event.currentTarget.elements.email.value);
  try {
    const payload = await apiFetch('/api/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }, false);
    const confirmForm = document.querySelector('#resetConfirmForm');
    confirmForm.hidden = false;
    confirmForm.elements.email.value = email;
    if (payload.developmentResetToken) confirmForm.elements.token.value = payload.developmentResetToken;
    showToast('Reset request accepted.');
  } catch (error) { showToast(error.message); }
}

async function confirmPasswordReset(event) {
  event.preventDefault();
  const form = event.currentTarget;
  try { await apiFetch('/api/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ email: sanitizeInput(form.elements.email.value), token: sanitizeInput(form.elements.token.value), password: form.elements.password.value }) }, false); showToast('Password updated. You can sign in.'); }
  catch (error) { showToast(error.message); }
}

async function logoutUser() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }, false); } catch { /* clear local session regardless */ }
  sessionUser = null;
  messageStream?.close(); messageStream = null;
  state.profile = { ...defaultState.profile, socialLinks: { ...defaultState.profile.socialLinks } };
  state.savedPostIds = []; state.notifications = []; state.messages = []; state.friendships = [];
  state.userStanding = null; state.activeGuild = null; state.guildPosts = []; state.guildMessages = []; state.publicProfile = null; state.ownProfileData = null;
  updateHeaderProfile(); await Promise.all([hydratePosts(), hydrateGuilds(), hydrateLeaderboard()]); renderRoute(); showToast('Signed out.');
}

function activeTake() {
  const id = decodeURIComponent(location.hash.split('/')[1] || '');
  return findPostById(id);
}

async function hydrateTake(post) {
  if (!post?.databaseId || post.publishing) return;
  try {
    await apiFetch(`/api/posts/${post.databaseId}/view`, { method: 'POST' }, false);
    const payload = await apiFetch(`/api/posts/${post.databaseId}/comments`, {}, false);
    post.comments = payload.comments || [];
    post.commentCount = countComments(post.comments);
  } catch (error) { console.error('Unable to load take:', error); }
}

function findComment(comments, id) {
  for (const comment of comments) {
    if (String(comment.id) === String(id)) return comment;
    const nested = findComment(comment.replies || [], id);
    if (nested) return nested;
  }
  return null;
}

async function addComment(event) {
  event.preventDefault();
  const post = activeTake();
  const input = event.currentTarget.elements.comment;
  const text = sanitizeInput(input.value);
  if (!post || !text) return;
  if (!sessionUser) { navigate('auth'); return showToast('Sign in to comment.'); }
  const gifFile = event.currentTarget.elements.gifFile?.files?.[0];
  if (gifFile?.size > 2 * 1024 * 1024) return showToast('Comment GIFs must be 2 MB or smaller.');
  const gifUrl = gifFile ? await fileToDataUrl(gifFile) : String(event.currentTarget.elements.gifUrl?.value || '').trim();
  try { await apiFetch('/api/comments', { method: 'POST', body: JSON.stringify({ postId: post.databaseId, text, parent: null, gifUrl }) }); trackEvent('add_take'); await hydrateTake(post); await Promise.all([hydrateTrending(), hydrateSession(), hydrateLeaderboard()]); renderRoute(); showToast('Take added.'); }
  catch (error) { showToast(error.message); }
}

function openReplyComposer(id) {
  const slot = document.querySelector(`#reply-${id}`);
  if (!slot) return;
  slot.hidden = !slot.hidden;
  if (slot.hidden) return;
  slot.innerHTML = `<form class="reply-composer" data-reply-form="${id}"><textarea name="reply" required maxlength="500" placeholder="Write a reply..."></textarea><div><button type="button" data-cancel-reply>Cancel</button><button type="submit">Reply</button></div></form>`;
  slot.querySelector('[data-cancel-reply]').addEventListener('click', () => { slot.hidden = true; slot.innerHTML = ''; });
  slot.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const post = activeTake();
    const parent = post && findComment(post.comments, id);
    const text = sanitizeInput(event.currentTarget.elements.reply.value);
    if (!parent || !text) return;
    if (!sessionUser) { navigate('auth'); return; }
    try { await apiFetch('/api/comments', { method: 'POST', body: JSON.stringify({ postId: post.databaseId, text, parent: String(parent.id) }) }); trackEvent('add_take', { reply: true }); await hydrateTake(post); await Promise.all([hydrateSession(), hydrateLeaderboard()]); renderRoute(); showToast('Reply added.'); }
    catch (error) { showToast(error.message); }
  });
}

async function toggleCommentVote(id) {
  const post = activeTake();
  const comment = post && findComment(post.comments, id);
  if (!comment) return;
  if (!sessionUser) { navigate('auth'); return showToast('Sign in to vote on comments.'); }
  try { await apiFetch(`/api/comments/${id}/vote`, { method: 'POST' }); await hydrateTake(post); await Promise.all([hydrateSession(), hydrateLeaderboard()]); renderRoute(); } catch (error) { showToast(error.message); }
}

function openCommentMenu(id) {
  const post = activeTake();
  const comment = post && findComment(post.comments || [], id);
  if (!comment || !canDeleteComment(comment)) return showToast('You can only manage your own Takes.');
  const adminCopy = ['owner', 'admin', 'moderator'].includes(sessionUser?.staffRole) && String(comment.author?.id || '') !== String(sessionUser.id)
    ? 'Administrator action: this permanently removes the selected Take and any replies beneath it.'
    : 'This permanently removes your Take and any replies beneath it.';
  showActionDialog(actionDialogShell('TAKE OPTIONS', 'Delete this Take?', `<p class="dialog-copy">${adminCopy}</p><div class="confirm-actions"><button class="quiet-action" type="button" data-close-action-secondary>Cancel</button><button class="danger-action" type="button" data-delete-comment="${escapeHtml(String(id))}">Delete Take</button></div>`));
  document.querySelector('[data-close-action-secondary]')?.addEventListener('click', closeActionDialog);
  document.querySelector('[data-delete-comment]')?.addEventListener('click', deleteSelectedComment);
}

async function deleteSelectedComment(event) {
  const id = event.currentTarget.dataset.deleteComment;
  const post = activeTake();
  if (!post || !id) return;
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = 'Deleting...';
  try {
    const result = await apiFetch(`/api/comments/${id}`, { method: 'DELETE' });
    await hydrateTake(post);
    closeActionDialog();
    renderRoute();
    showToast(result.deletedCount > 1 ? `Take and ${result.deletedCount - 1} replies deleted.` : 'Take deleted.');
  } catch (error) {
    event.currentTarget.disabled = false;
    event.currentTarget.textContent = 'Delete Take';
    showToast(error.message);
  }
}

function applyDisplaySettings() {
  const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.dataset.resolvedTheme = state.settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : state.settings.theme;
  document.documentElement.dataset.textSize = state.settings.textSize;
  document.documentElement.dataset.palette = state.settings.palette || 'callout';
  document.documentElement.dataset.feedDensity = state.settings.feedDensity || 'comfortable';
  document.documentElement.dataset.reducedMotion = state.settings.reducedMotion ? 'true' : 'false';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', document.documentElement.dataset.resolvedTheme === 'dark' ? '#151513' : '#ff4713');
}

async function saveAdminPost(event) {
  event.preventDefault();
  if (!sessionUser?.isAdmin) return showToast('Administrator access required.');
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const values = Object.fromEntries(new FormData(form));
  submit.disabled = true; submit.textContent = 'Saving…';
  try {
    const payload = await apiFetch(`/api/admin/posts/${form.dataset.adminPostForm}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: sanitizeInput(values.content), category: values.category, visibility: values.visibility })
    });
    const updated = mapPost(payload.post);
    const index = state.posts.findIndex(post => post.id === updated.id);
    if (index >= 0) state.posts[index] = updated;
    await Promise.all([hydratePosts(), hydrateTrending(), hydrateLeaderboard()]);
    renderRoute(); showToast('Post corrections saved.');
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Save corrections'; showToast(error.message);
  }
}

function previewDisplaySettings() {
  const form = document.querySelector('#settingsForm');
  if (!form) return;
  const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  document.documentElement.dataset.theme = form.elements.theme.value;
  document.documentElement.dataset.resolvedTheme = form.elements.theme.value === 'system' ? (prefersDark ? 'dark' : 'light') : form.elements.theme.value;
  document.documentElement.dataset.textSize = form.elements.textSize.value;
  document.documentElement.dataset.palette = form.elements.palette?.value || state.settings.palette;
  document.documentElement.dataset.feedDensity = form.elements.feedDensity?.value || state.settings.feedDensity;
  document.documentElement.dataset.reducedMotion = form.elements.reducedMotion?.checked ? 'true' : 'false';
}

async function saveSettings(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.settings.theme = formData.get('theme');
  state.settings.textSize = formData.get('textSize');
  state.settings.palette = formData.get('palette');
  state.settings.feedDensity = formData.get('feedDensity');
  state.settings.voteEffect = formData.get('voteEffect');
  state.settings.notificationSound = formData.get('notificationSound');
  state.settings.reducedMotion = formData.has('reducedMotion');
  state.settings.hiddenTopics = sanitizeInput(formData.get('hiddenTopics')).split(',').map(value => value.trim()).filter(Boolean).slice(0, 30);
  state.settings.directMessages = formData.get('directMessages');
  state.settings.notifications = { likes: formData.has('notifyLikes'), comments: formData.has('notifyComments'), guildInvites: formData.has('notifyGuildInvites') };
  state.settings.notificationDelivery = { inApp: formData.has('deliveryInApp'), push: formData.has('deliveryPush'), email: formData.has('deliveryEmail') };
  state.profile = {
    ...state.profile,
    displayName: sanitizeInput(formData.get('displayName')),
    handle: sanitizeInput(formData.get('handle')).toLowerCase().replace(/\s+/g, '_'),
    bio: sanitizeInput(formData.get('bio')),
    tagline: sanitizeInput(formData.get('tagline')),
    location: sanitizeInput(formData.get('location')),
    profileVisibility: { about: formData.get('aboutVisibility') || 'public', activity: formData.get('activityVisibility') || 'public' },
    avatarUrl: formData.get('avatarUrl') || state.profile.avatarUrl,
    bannerUrl: formData.get('bannerUrl') || '',
    themeColor: formData.get('themeColor'),
    avatarFrame: formData.get('avatarFrame'),
    profileEffect: formData.get('profileEffect'),
    profileBackground: formData.get('profileBackground'),
    profileLayout: ['posts', 'guilds', 'heat'],
    showcaseMode: formData.get('showcaseMode'),
    pronouns: sanitizeInput(formData.get('pronouns')),
    status: formData.get('status'),
    socialLinks: {
      twitter: sanitizeInput(formData.get('twitter')), instagram: sanitizeInput(formData.get('instagram')), discord: sanitizeInput(formData.get('discord')),
      youtube: sanitizeInput(formData.get('youtube')), twitch: sanitizeInput(formData.get('twitch')), custom: sanitizeInput(formData.get('custom'))
    }
  };
  if (!state.profile.handle.startsWith('@')) state.profile.handle = `@${state.profile.handle}`;
  state.profile.handle = `@${state.profile.handle.slice(1).replace(/[^a-z0-9_]/g, '').slice(0, 29)}`;
  try {
    if (sessionUser) {
      const payload = await apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify({ displayName: state.profile.displayName, handle: state.profile.handle, avatarUrl: state.profile.avatarUrl, bio: state.profile.bio, tagline: state.profile.tagline, location: state.profile.location, profileVisibility: state.profile.profileVisibility, bannerUrl: state.profile.bannerUrl, themeColor: state.profile.themeColor, avatarFrame: state.profile.avatarFrame, profileEffect: state.profile.profileEffect, profileBackground: state.profile.profileBackground, profileLayout: ['posts', 'guilds', 'heat'], showcaseMode: state.profile.showcaseMode, featuredPosts: state.profile.featuredPosts || [], pinnedGuilds: state.profile.pinnedGuilds || [], socialLinks: state.profile.socialLinks, pronouns: state.profile.pronouns, status: state.profile.status, preferences: { theme: state.settings.theme, palette: state.settings.palette, reducedMotion: state.settings.reducedMotion, feedDensity: state.settings.feedDensity, voteEffect: state.settings.voteEffect, notificationSound: state.settings.notificationSound, widgetOrder: state.settings.widgetOrder, hiddenTopics: state.settings.hiddenTopics, notifications: state.settings.notifications, notificationDelivery: state.settings.notificationDelivery, directMessages: state.settings.directMessages, textSize: state.settings.textSize } }) });
      applySessionUser(payload.user); await hydrateOwnProfile();
    }
    persist(); applyDisplaySettings(); document.querySelector('#headerName').textContent = state.profile.displayName; renderRoute(); showToast('Settings saved.');
  } catch (error) { showToast(error.message); }
}

function unblockUser(user) {
  state.settings.blockedUsers = state.settings.blockedUsers.filter(item => item !== user);
  persist(); renderRoute(); showToast(`${user} unblocked.`);
}

document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  navigate(link.dataset.route);
}));
document.querySelectorAll('[data-route-button]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.routeButton)));
document.querySelectorAll('[data-leaderboard-kind]').forEach(button => button.addEventListener('click', () => {
  state.railLeaderboardKind = button.dataset.leaderboardKind;
  updateAccountChrome();
}));
document.querySelectorAll('[data-leader-period]').forEach(button => button.addEventListener('click', async () => {
  state.settings.leaderboardPeriod = button.dataset.leaderPeriod;
  document.querySelectorAll('[data-leader-period]').forEach(item => item.classList.toggle('active', item === button));
  persist();
  await hydrateLeaderboard();
  if (currentRoute() === 'leaderboards') renderRoute();
}));
document.querySelector('#profileButton').addEventListener('click', () => navigate('profile'));
document.querySelector('#notificationBell').addEventListener('click', () => navigate(sessionUser ? 'notifications' : 'auth'));
document.querySelector('#mobileMenu').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
function openComposerForUser() {
  if (!sessionUser) { navigate('auth'); return showToast('Create an account or sign in to post a take.'); }
  if (!composerRequestId) composerRequestId = crypto.randomUUID();
  const topicSelect = document.querySelector('#takeLiveTopic');
  if (topicSelect) topicSelect.innerHTML = `<option value="">None</option>${state.topics.filter(topic => topic.state === 'live').map(topic => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.title)}</option>`).join('')}`;
  updateComposerPreview();
  composer.showModal();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}

function loadImage(file) {
  return new Promise((resolve, reject) => { const image = new Image(); const url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be read.')); }; image.src = url; });
}

async function prepareImage(file) {
  if (file.type === 'image/gif') {
    if (file.size > 2 * 1024 * 1024) throw new Error('GIF files must be 2 MB or smaller.');
    return { type: 'gif', url: await fileToDataUrl(file), alt: file.name, duration: 0, aspectRatio: 1 };
  }
  const image = await loadImage(file);
  const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return { type: 'image', url: canvas.toDataURL('image/webp', .78), alt: file.name, duration: 0, aspectRatio: canvas.width / canvas.height };
}

function videoMetadata(file) {
  return new Promise((resolve, reject) => { const video = document.createElement('video'); const url = URL.createObjectURL(file); video.preload = 'metadata'; video.onloadedmetadata = () => { const meta = { duration: video.duration, aspectRatio: video.videoWidth / video.videoHeight }; URL.revokeObjectURL(url); resolve(meta); }; video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This video could not be read.')); }; video.src = url; });
}

async function prepareVideo(file) {
  if (file.size > 8 * 1024 * 1024) throw new Error('Short videos must be 8 MB or smaller.');
  const meta = await videoMetadata(file);
  if (!Number.isFinite(meta.duration) || meta.duration > 25) throw new Error('Videos must be 25 seconds or shorter.');
  if (meta.aspectRatio < .95 || meta.aspectRatio > 1.05) throw new Error('Videos must use a square 1:1 aspect ratio.');
  return { type: 'video', url: await fileToDataUrl(file), alt: file.name, duration: Math.round(meta.duration * 10) / 10, aspectRatio: meta.aspectRatio };
}

function renderMediaPreview() {
  const preview = document.querySelector('#mediaPreview');
  preview.hidden = pendingMedia.length === 0;
  preview.innerHTML = pendingMedia.map((item, index) => `<figure>${item.type === 'video' ? `<video src="${escapeHtml(item.url)}" muted></video>` : `<img src="${escapeHtml(item.url)}" alt="" />`}<button type="button" data-remove-media="${index}" aria-label="Remove attachment">×</button>${item.type === 'image' ? `<button class="edit-media" type="button" data-edit-media="${index}">Crop</button>` : ''}<figcaption>${escapeHtml(item.type.toUpperCase())}</figcaption></figure>`).join('');
  preview.querySelectorAll('[data-remove-media]').forEach(button => button.addEventListener('click', () => { pendingMedia.splice(Number(button.dataset.removeMedia), 1); renderMediaPreview(); updateComposerPreview(); }));
  preview.querySelectorAll('[data-edit-media]').forEach(button => button.addEventListener('click', () => openImageEditor(Number(button.dataset.editMedia))));
}

let editingMediaIndex = -1;
let editorImage = null;
let editorOffset = { x: 0, y: 0 };
let editorDrag = null;

function drawImageEditor() {
  if (!editorImage) return;
  const canvas = document.querySelector('#imageEditorCanvas'); const context = canvas.getContext('2d'); const zoom = Number(document.querySelector('#imageZoom').value);
  const base = Math.max(canvas.width / editorImage.naturalWidth, canvas.height / editorImage.naturalHeight); const scale = base * zoom;
  const width = editorImage.naturalWidth * scale; const height = editorImage.naturalHeight * scale;
  const maxX = Math.max(0, (width - canvas.width) / 2); const maxY = Math.max(0, (height - canvas.height) / 2);
  editorOffset.x = Math.max(-maxX, Math.min(maxX, editorOffset.x)); editorOffset.y = Math.max(-maxY, Math.min(maxY, editorOffset.y));
  context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(editorImage, (canvas.width - width) / 2 + editorOffset.x, (canvas.height - height) / 2 + editorOffset.y, width, height);
}

function openImageEditor(index) {
  editingMediaIndex = index; editorOffset = { x: 0, y: 0 }; document.querySelector('#imageZoom').value = '1';
  editorImage = new Image(); editorImage.onload = () => { drawImageEditor(); document.querySelector('#imageEditorDialog').showModal(); }; editorImage.src = pendingMedia[index].url;
}

async function addTakeMedia(files) {
  if (!files.length) return;
  if (pendingMedia.length + files.length > 5) return showToast('A take can contain up to 5 media items.');
  try {
    const prepared = await Promise.all(files.map(file => file.type.startsWith('video/') ? prepareVideo(file) : prepareImage(file)));
    pendingMedia.push(...prepared);
    renderMediaPreview(); updateComposerPreview();
  } catch (error) { renderMediaPreview(); showToast(error.message); }
}

async function handleTakeMedia(event) {
  const files = [...event.target.files]; event.target.value = '';
  await addTakeMedia(files);
}

function composerHasPublishableContent() {
  const text = document.querySelector('#takeText')?.value.trim();
  const pollBuilder = document.querySelector('#pollBuilder');
  const pollQuestion = document.querySelector('#pollQuestion')?.value.trim();
  return Boolean(text || pendingMedia.length || pendingExternalEmbed || (pollBuilder && !pollBuilder.hidden && pollQuestion));
}

function updateComposerSubmitState() {
  const publish = document.querySelector('.publish-button');
  if (!publish) return;
  publish.disabled = composerSubmissionInFlight || !composerHasPublishableContent();
  publish.setAttribute('aria-disabled', String(publish.disabled));
}

function updateComposerCharacterCount(length = document.querySelector('#takeText')?.value.length || 0) {
  const counter = document.querySelector('#charCount');
  if (!counter) return;
  counter.textContent = `${length} / 2000`;
  counter.classList.toggle('near-limit', length >= 1800 && length < 2000);
  counter.classList.toggle('at-limit', length >= 2000);
}

function updateComposerPreview() {
  const text = document.querySelector('#takeText')?.value.trim() || '';
  const category = document.querySelector('#takeCategory')?.value || 'Movies';
  const anonymous = Boolean(document.querySelector('#takeAnonymous')?.checked);
  const audienceControl = document.querySelector('#takeAudience');
  if (anonymous && audienceControl) audienceControl.value = 'public';
  if (audienceControl) audienceControl.disabled = anonymous;
  const profile = sessionUser ? state.profile : defaultState.profile;
  document.querySelector('#previewName').textContent = anonymous ? 'Anonymous' : profile.displayName || 'Callout member';
  document.querySelector('#previewCategory').textContent = anonymous ? `SIGNAL 7A · ${category} · now` : `${category} · now`;
  document.querySelector('#previewAnonTag').hidden = !anonymous;
  document.querySelector('#previewContent').textContent = text || 'Your take will appear here as you type.';
  const avatar = document.querySelector('#previewAvatar');
  avatar.classList.toggle('is-anonymous', anonymous);
  avatar.innerHTML = anonymous ? '◒' : profile.avatarUrl ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="" />` : escapeHtml((profile.displayName || 'C').charAt(0).toUpperCase());
  const media = document.querySelector('#previewMedia');
  media.hidden = pendingMedia.length === 0;
  media.className = `preview-media preview-media-${Math.min(4, pendingMedia.length)}`;
  media.innerHTML = pendingMedia.slice(0, 4).map(item => item.type === 'video' ? `<video src="${escapeHtml(item.url)}" muted></video>` : `<img src="${escapeHtml(item.url)}" alt="" />`).join('');
  const external = document.querySelector('#previewExternalEmbed');
  external.hidden = !pendingExternalEmbed;
  external.innerHTML = pendingExternalEmbed ? externalEmbedMarkup(pendingExternalEmbed, true) : '';
  updateComposerCharacterCount();
  updateComposerSubmitState();
}

function closeExternalAttachTool(clear = false) {
  document.querySelector('#externalAttachComposer').hidden = true;
  if (clear) {
    pendingExternalEmbed = null;
    document.querySelector('#externalPostUrl').value = '';
    document.querySelector('#takeEmbed').value = '';
    updateComposerPreview();
  }
}

async function previewExternalPost() {
  const input = document.querySelector('#externalPostUrl');
  const button = document.querySelector('#previewExternalPost');
  const url = input.value.trim();
  if (!url) return showToast('Paste an X, Reddit, or Bluesky post link first.');
  button.disabled = true; button.textContent = 'Building...';
  try {
    const payload = await apiFetch('/api/embeds/preview', { method: 'POST', body: JSON.stringify({ url }) });
    pendingExternalEmbed = payload.embed;
    document.querySelector('#takeEmbed').value = payload.embed.url;
    updateComposerPreview(); closeExternalAttachTool(false);
    showToast(`${{ x: 'X', reddit: 'Reddit', bluesky: 'Bluesky' }[payload.embed.platform]} post attached.`);
  } catch (error) { showToast(error.message); }
  finally { button.disabled = false; button.textContent = 'Build preview'; }
}

function setComposerBusy(busy, draft = false) {
  composerSubmissionInFlight = busy;
  const publish = document.querySelector('.publish-button');
  const draftButton = document.querySelector('#saveDraft');
  const closeButton = document.querySelector('[data-close-composer]');
  publish.disabled = busy || !composerHasPublishableContent(); draftButton.disabled = busy; closeButton.disabled = busy;
  publish.setAttribute('aria-disabled', String(publish.disabled));
  publish.textContent = busy && !draft ? 'Posting...' : 'Post Take';
  draftButton.textContent = busy && draft ? 'Saving...' : 'Save draft';
}

function beginPublishing(draft = false) {
  const overlay = document.querySelector('#publishingOverlay');
  const progress = document.querySelector('#publishingProgress');
  const status = document.querySelector('#publishingStatus');
  document.querySelector('#publishingTitle').textContent = draft ? 'Saving your draft' : 'Publishing your take';
  document.querySelector('#publishingEstimate').textContent = draft ? 'This normally takes only a few seconds.' : 'Usually ready in 2-8 seconds. Please keep this tab open.';
  overlay.hidden = false; progress.style.width = '12%'; status.textContent = draft ? 'Preparing your draft...' : 'Securing your post...';
  let value = 12; let tick = 0;
  clearInterval(publishingTimer);
  publishingTimer = setInterval(() => {
    value = Math.min(90, value + Math.max(2, Math.round((92 - value) * .13)));
    progress.style.width = `${value}%`; tick += 1;
    status.textContent = tick > 5 ? 'Almost there...' : tick > 2 ? 'Updating the Callout feed...' : 'Uploading your content...';
  }, 650);
}

async function finishPublishing(success, message = 'Your take is live.') {
  clearInterval(publishingTimer); publishingTimer = null;
  const overlay = document.querySelector('#publishingOverlay');
  if (!success) { overlay.hidden = true; return; }
  document.querySelector('#publishingProgress').style.width = '100%';
  document.querySelector('#publishingStatus').textContent = message;
  await new Promise(resolve => setTimeout(resolve, 180));
  overlay.hidden = true;
}

document.querySelector('#openComposer').addEventListener('click', openComposerForUser);
document.querySelector('[data-close-composer]').addEventListener('click', () => composer.close());
document.querySelector('#takeMedia').addEventListener('change', handleTakeMedia);
document.querySelector('#toggleExternalAttach').addEventListener('click', () => { const panel = document.querySelector('#externalAttachComposer'); panel.hidden = !panel.hidden; if (!panel.hidden) document.querySelector('#externalPostUrl').focus(); });
document.querySelector('#closeExternalAttach').addEventListener('click', () => closeExternalAttachTool(Boolean(pendingExternalEmbed)));
document.querySelector('#previewExternalPost').addEventListener('click', previewExternalPost);
document.querySelector('#externalPostUrl').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); previewExternalPost(); } });
const composerDropZone = document.querySelector('#composerDropZone');
['dragenter', 'dragover'].forEach(type => composerDropZone.addEventListener(type, event => { event.preventDefault(); if (!composerSubmissionInFlight) composerDropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach(type => composerDropZone.addEventListener(type, event => { event.preventDefault(); composerDropZone.classList.remove('is-dragging'); }));
composerDropZone.addEventListener('drop', event => { if (!composerSubmissionInFlight) addTakeMedia([...event.dataTransfer.files].filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))); });
composerDropZone.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target === composerDropZone) { event.preventDefault(); document.querySelector('#takeMedia').click(); } });
document.querySelector('[data-close-image-editor]').addEventListener('click', () => document.querySelector('#imageEditorDialog').close());
document.querySelector('#imageZoom').addEventListener('input', drawImageEditor);
document.querySelector('#imageEditorCanvas').addEventListener('pointerdown', event => { editorDrag = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); });
document.querySelector('#imageEditorCanvas').addEventListener('pointermove', event => { if (!editorDrag) return; editorOffset.x += event.clientX - editorDrag.x; editorOffset.y += event.clientY - editorDrag.y; editorDrag = { x: event.clientX, y: event.clientY }; drawImageEditor(); });
document.querySelector('#imageEditorCanvas').addEventListener('pointerup', () => { editorDrag = null; });
document.querySelector('#imageEditorForm').addEventListener('submit', event => { event.preventDefault(); if (editingMediaIndex < 0) return; const source = document.querySelector('#imageEditorCanvas'); const output = document.createElement('canvas'); output.width = 1200; output.height = 1200; output.getContext('2d').drawImage(source, 0, 0, output.width, output.height); pendingMedia[editingMediaIndex] = { ...pendingMedia[editingMediaIndex], url: output.toDataURL('image/webp', .82), aspectRatio: 1 }; document.querySelector('#imageEditorDialog').close(); renderMediaPreview(); updateComposerPreview(); showToast('Crop applied.'); });
document.querySelector('#addGifUrl').addEventListener('click', () => { const input = document.querySelector('#gifUrlInput'); input.hidden = !input.hidden; if (!input.hidden) input.focus(); });
document.querySelectorAll('#postEmojiTray button').forEach(button => button.addEventListener('click', () => { const input = document.querySelector('#takeText'); input.value += button.textContent; input.dispatchEvent(new Event('input')); input.focus(); }));
document.querySelector('[data-close-guild]').addEventListener('click', () => guildComposer.close());
document.querySelector('#takeText').addEventListener('input', event => { updateComposerCharacterCount(event.target.value.length); updateComposerPreview(); });
document.querySelector('#takeCategory').addEventListener('change', updateComposerPreview);
document.querySelector('#takeAudience').addEventListener('change', updateComposerPreview);
document.querySelector('#takeAnonymous').addEventListener('change', updateComposerPreview);
document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => {
  const input = document.querySelector('#takeText');
  const wrappers = { bold: ['**', '**'], italic: ['*', '*'], spoiler: ['||', '||'] };
  const [before, after] = wrappers[button.dataset.format]; const start = input.selectionStart; const end = input.selectionEnd;
  input.setRangeText(`${before}${input.value.slice(start, end) || 'text'}${after}`, start, end, 'end'); input.dispatchEvent(new Event('input')); input.focus();
}));
document.querySelector('#togglePoll').addEventListener('click', () => { const builder = document.querySelector('#pollBuilder'); builder.hidden = !builder.hidden; });
document.querySelector('#addPollOption').addEventListener('click', () => { const options = document.querySelector('#pollOptions'); if (options.children.length >= 6) return showToast('Polls support up to 6 choices.'); const input = document.createElement('input'); input.maxLength = 100; input.placeholder = `Option ${options.children.length + 1}`; options.appendChild(input); });

async function submitComposer(draft = false) {
  if (composerSubmissionInFlight) return;
  if (!sessionUser) { composer.close(); navigate('auth'); return showToast('Sign in to publish a take.'); }
  const input = document.querySelector('#takeText');
  const text = sanitizeInput(input.value);
  const pollBuilder = document.querySelector('#pollBuilder');
  const pollOptions = [...document.querySelectorAll('#pollOptions input')].map(option => sanitizeInput(option.value)).filter(Boolean);
  const poll = pollBuilder.hidden ? null : { question: sanitizeInput(document.querySelector('#pollQuestion').value), options: pollOptions.map(option => ({ text: option })), closesAt: null };
  if (!draft && !text && !pendingMedia.length && !poll && !pendingExternalEmbed) return showToast('Add text, media, or an attached post first.');
  if (poll && (!poll.question || pollOptions.length < 2)) return showToast('A poll needs a question and at least 2 options.');
  const validationError = text ? postTextError(text) : ''; if (validationError) return showToast(validationError);
  const category = document.querySelector('#takeCategory').value;
  const gifUrl = document.querySelector('#gifUrlInput').value.trim();
  const media = gifUrl ? [...pendingMedia, { type: 'gif', url: gifUrl, alt: 'GIF attachment', duration: 0, aspectRatio: 1 }] : [...pendingMedia];
  if (media.length > 5) return showToast('A take can contain up to 5 media items.');
  const scheduledValue = document.querySelector('#takeSchedule').value;
  const payload = {
    clientRequestId: composerRequestId || (composerRequestId = crypto.randomUUID()), content: text, category, media, draft, poll, contentType: poll ? 'poll' : media[0]?.type || 'text',
    visibility: document.querySelector('#takeAudience').value,
    anonymous: Boolean(document.querySelector('#takeAnonymous')?.checked),
    topic: document.querySelector('#takeLiveTopic')?.value || null,
    topics: document.querySelector('#takeTopics').value.split(',').map(value => sanitizeInput(value)).filter(Boolean).slice(0, 5),
    contentWarning: sanitizeInput(document.querySelector('#takeWarning').value), reactionSet: document.querySelector('#takeReactionSet').value,
    embedUrl: pendingExternalEmbed?.url || document.querySelector('#takeEmbed').value.trim(), externalEmbed: pendingExternalEmbed, scheduledPublishedAt: scheduledValue ? new Date(scheduledValue).toISOString() : null
  };
  const instantPublish = !draft && !scheduledValue;
  const temporaryId = instantPublish ? `pending-${composerRequestId}` : '';
  if (instantPublish) {
    const pendingPost = mapPost({
      ...payload, id: temporaryId, publishing: true, createdAt: new Date().toISOString(), commentCount: 0,
      anonymousCode: payload.anonymous ? 'SIGNAL' : '',
      author: payload.anonymous
        ? { id: '', displayName: 'Anonymous', handle: '', avatarUrl: '' }
        : { id: currentUserId(), displayName: state.profile.displayName, handle: state.profile.handle, avatarUrl: state.profile.avatarUrl }
    });
    if (payload.anonymous) state.anonymousPosts = [pendingPost, ...state.anonymousPosts.filter(post => post.id !== temporaryId)];
    else state.posts = [pendingPost, ...state.posts.filter(post => post.id !== temporaryId)];
    setComposerBusy(true, false); composer.close(); navigate(`take/${temporaryId}`);
    showToast('Publishing in the background...');
  } else {
    setComposerBusy(true, draft); beginPublishing(draft);
  }
  let createdPost = null;
  try {
    const result = await apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(payload) });
    createdPost = result?.post || null;
    if (!draft) trackEvent('create_post', { content_type: payload.contentType, audience: payload.visibility, anonymous: payload.anonymous, scheduled: Boolean(payload.scheduledPublishedAt) });
  } catch (error) {
    if (instantPublish) {
      state.posts = state.posts.filter(post => post.id !== temporaryId); state.anonymousPosts = state.anonymousPosts.filter(post => post.id !== temporaryId); persist(); navigate('home'); setComposerBusy(false); composer.showModal(); updateComposerPreview();
    } else await finishPublishing(false);
    setComposerBusy(false); return showToast(`Publishing failed: ${error.message}`);
  }
  const createdId = String(createdPost?.id || createdPost?._id || '');
  if (!draft && createdId) {
    const optimisticPost = mapPost({
      ...createdPost,
      author: payload.anonymous
        ? { id: '', displayName: 'Anonymous', handle: '', avatarUrl: '' }
        : { id: currentUserId(), displayName: state.profile.displayName, handle: state.profile.handle, avatarUrl: state.profile.avatarUrl },
      commentCount: 0
    });
    if (payload.anonymous) state.anonymousPosts = [optimisticPost, ...state.anonymousPosts.filter(post => post.id !== optimisticPost.id && post.id !== temporaryId)];
    else state.posts = [optimisticPost, ...state.posts.filter(post => post.id !== optimisticPost.id && post.id !== temporaryId)];
  }
  if (!instantPublish) await finishPublishing(true, draft ? 'Draft saved.' : scheduledValue ? 'Take scheduled.' : 'Your take is live.');
  persist();
  input.value = '';
  pendingMedia = []; pendingExternalEmbed = null; renderMediaPreview(); document.querySelector('#gifUrlInput').value = ''; document.querySelector('#gifUrlInput').hidden = true; document.querySelector('#externalPostUrl').value = ''; document.querySelector('#externalAttachComposer').hidden = true;
  updateComposerCharacterCount(0);
  document.querySelector('#composerForm').reset(); document.querySelector('#pollBuilder').hidden = true;
  composerRequestId = ''; setComposerBusy(false); updateComposerPreview();
  composer.close();
  if (!draft) {
    if (instantPublish && createdId && decodeURIComponent(location.hash.split('/')[1] || '') === temporaryId) {
      history.replaceState(null, '', `#take/${encodeURIComponent(createdId)}`); renderRoute();
    } else navigate(createdId && !scheduledValue ? `take/${createdId}` : 'home');
    Promise.allSettled([hydratePosts(), hydrateBigPatch(), hydrateSession(), hydrateLeaderboard(), hydrateTrending()]).then(() => {
      if (currentRoute() === 'take' || currentRoute() === 'home') renderRoute();
    });
  }
  showToast(draft ? 'Draft saved.' : scheduledValue ? 'Take scheduled.' : 'Your take is live.');
}

document.querySelector('#composerForm').addEventListener('submit', async event => {
  event.preventDefault();
  await submitComposer(false);
});
document.querySelector('#saveDraft').addEventListener('click', () => submitComposer(true));
document.querySelector('#guildForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = sanitizeInput(document.querySelector('#guildName').value);
  const description = sanitizeInput(document.querySelector('#guildDescription').value);
  if (!name || !description) return;
  if (!sessionUser) { guildComposer.close(); navigate('auth'); return showToast('Sign in to create a guild.'); }
  try { await apiFetch('/api/guilds', { method: 'POST', body: JSON.stringify({ name, description, privacy: document.querySelector('#guildPrivacy').value }) }); trackEvent('create_guild', { privacy: document.querySelector('#guildPrivacy').value }); await hydrateGuilds(); }
  catch (error) { return showToast(error.message); }
  form.reset();
  guildComposer.close();
  navigate('guilds');
  renderRoute();
  showToast('Guild created.');
});
let searchTimer;
document.querySelector('#globalSearch').addEventListener('input', event => {
  clearTimeout(searchTimer);
  const query = event.target.value.trim();
  const panel = document.querySelector('#globalSearchResults');
  if (query.length < 2) { panel.hidden = true; panel.innerHTML = ''; return; }
  searchTimer = setTimeout(async () => {
    try {
      const result = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`, {}, false);
      const users = (result.users || []).map(user => `<button type="button" data-search-profile="${user.id}"><span class="avatar">${user.avatarUrl ? `<img src="${escapeHtml(user.avatarUrl)}" alt="" />` : escapeHtml((user.displayName || 'C').charAt(0))}</span><span><strong>${escapeHtml(user.displayName)}</strong><small>${escapeHtml(user.handle || '')}</small></span></button>`).join('');
      const posts = (result.posts || []).map(post => `<button type="button" data-search-take="${escapeHtml(post.id)}"><span>↗</span><span><strong>${escapeHtml(post.content)}</strong><small>Take</small></span></button>`).join('');
      const guilds = (result.guilds || []).map(guild => `<button type="button" data-search-guild><span>⚔</span><span><strong>${escapeHtml(guild.name)}</strong><small>Guild</small></span></button>`).join('');
      panel.innerHTML = users || posts || guilds ? `${users}${posts}${guilds}` : '<p>No people, takes, or guilds found.</p>';
      panel.hidden = false;
      panel.querySelectorAll('[data-search-take]').forEach(button => button.addEventListener('click', () => { panel.hidden = true; navigate(`take/${button.dataset.searchTake}`); }));
      panel.querySelectorAll('[data-search-guild]').forEach(button => button.addEventListener('click', () => { panel.hidden = true; navigate('guilds'); }));
      panel.querySelectorAll('[data-search-profile]').forEach(button => button.addEventListener('click', () => { panel.hidden = true; navigate(`user/${button.dataset.searchProfile}`); }));
    } catch (error) { showToast(error.message); }
  }, 220);
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#globalSearch').focus();
  }
});
if (window.matchMedia) {
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => { if (state.settings.theme === 'system') applyDisplaySettings(); };
  if (themeMedia.addEventListener) themeMedia.addEventListener('change', handleSystemThemeChange);
  else if (themeMedia.addListener) themeMedia.addListener(handleSystemThemeChange);
}
window.addEventListener('hashchange', async () => {
  renderRoute();
  if (currentRoute() === 'take') { await hydrateTake(activeTake()); renderRoute(); }
  if (currentRoute() === 'trending') { await hydrateTrending(); renderRoute(); }
  if (currentRoute() === 'guilds') { await hydrateGuilds(); renderRoute(); }
  if (currentRoute() === 'notifications' || currentRoute() === 'messages') { await hydrateAccountData(); renderRoute(); }
  if (currentRoute() === 'saved') { await hydrateSavedPosts(); renderRoute(); }
  if (currentRoute() === 'guild') { await hydrateGuildDetail(); renderRoute(); }
  if (currentRoute() === 'user') { await hydratePublicProfile(); renderRoute(); }
  if (currentRoute() === 'profile') { await hydrateOwnProfile(); renderRoute(); }
  if (currentRoute() === 'analytics') { await hydrateAnalytics(); renderRoute(); }
  if (currentRoute() === 'admin') { await hydrateAdminControl(); renderRoute(); }
  if (['topics', 'battles', 'about'].includes(currentRoute())) { await hydrateBigPatch(); renderRoute(); }
});

setInterval(async () => {
  if (document.activeElement?.matches('textarea,input')) return;
  if (currentRoute() === 'messages' && sessionUser) { await hydrateAccountData(); renderRoute(); }
  if (currentRoute() === 'guild' && location.hash.split('/')[2] === 'chat' && sessionUser) { await hydrateGuildDetail(); renderRoute(); }
  if (currentRoute() === 'guild' && location.hash.split('/')[2] === 'pinboard' && sessionUser) { await hydrateGuildDetail(); renderRoute(); }
}, 4000);

updateHeaderProfile();
applyDisplaySettings();
if (!location.hash) history.replaceState(null, '', '#home');
loadGoogleAnalytics();
initializePrivacyChoices();
renderRoute();
hydrateApp().finally(loadProductionAds);
