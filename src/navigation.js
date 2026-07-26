// QuizYou Navigation / SPA Routing Module

export const screens = {
  landing: document.getElementById('screen-landing'),
  auth: document.getElementById('screen-auth'),
  config: document.getElementById('screen-config'),
  quiz: document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results'),
  dashboard: document.getElementById('screen-dashboard'),
  leaderboard: document.getElementById('screen-leaderboard'),
  register: document.getElementById('screen-register'),
  admin: document.getElementById('screen-admin'),
  'admin-management': document.getElementById('screen-admin-management'),
};

let currentScreen = 'landing';
const history = [];

export function navigateTo(screenKey) {
  if (screenKey === currentScreen) return;

  history.push(currentScreen);
  currentScreen = screenKey;

  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.toggle('active', key === screenKey);
    }
  });

  const mainGlass = document.getElementById('main-glass-container');
  if (mainGlass) {
    if (screenKey === 'admin') {
      mainGlass.style.maxWidth = '900px';
    } else if (screenKey === 'admin-management') {
      mainGlass.style.maxWidth = '800px';
    } else {
      mainGlass.style.maxWidth = '600px';
    }
  }

  if (screenKey === 'config') {
    import('./quiz.js').then(m => m.populateCourseAndQuizzes());
  }
}

export function goBack() {
  if (history.length === 0) return;

  const previousScreen = history.pop();
  currentScreen = previousScreen;

  Object.keys(screens).forEach(key => {
    if (screens[key]) {
      screens[key].classList.toggle('active', key === previousScreen);
    }
  });

  const mainGlass = document.getElementById('main-glass-container');
  if (mainGlass) {
    if (previousScreen === 'admin') {
      mainGlass.style.maxWidth = '900px';
    } else if (previousScreen === 'admin-management') {
      mainGlass.style.maxWidth = '800px';
    } else {
      mainGlass.style.maxWidth = '600px';
    }
  }
}

export function resetNavigationHistory() {
  history.length = 0;
  currentScreen = null;
}
