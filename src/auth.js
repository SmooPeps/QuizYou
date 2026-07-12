// QuizYou Authentication Module
import { appState } from './state.js';
import { navigateTo, resetNavigationHistory } from './navigation.js';

export function updateHeaderStatus(isLoggedIn) {
  const avatar = document.getElementById('user-status-avatar');
  const statusText = document.getElementById('user-status-text');
  
  if (isLoggedIn && appState.currentUser) {
    avatar.classList.add('logged-in');
    statusText.textContent = `${appState.currentUser.firstName} ${appState.currentUser.lastName}`;
  } else {
    avatar.classList.remove('logged-in');
    statusText.textContent = 'Guest Mode';
  }
}

const BACKEND_URL = '';

export function restoreSession() {
  const savedUser = localStorage.getItem('quizyou_user');
  const savedToken = localStorage.getItem('quizyou_jwt');
  if (savedUser && savedToken) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      appState.currentUserid = appState.currentUser.id;
      updateHeaderStatus(true);
      navigateTo('config');
    } catch (e) {
      localStorage.removeItem('quizyou_user');
      localStorage.removeItem('quizyou_jwt');
    }
  }
}

export async function handleLogin(inputId, inputPw) {
  const alertBox = document.getElementById('auth-alert');
  
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inputId, password: inputPw })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials.');

    alertBox.style.display = 'none';
    appState.currentUser = data.user;
    appState.currentUserid = data.user.id;
    
    localStorage.setItem('quizyou_user', JSON.stringify(data.user));
    localStorage.setItem('quizyou_jwt', data.token);

    updateHeaderStatus(true);
    navigateTo('config');
    return true;
  } catch (err) {
    alertBox.textContent = err.message;
    alertBox.style.display = 'block';
    return false;
  }
}

export function handleLogout() {
  localStorage.removeItem('quizyou_user');
  localStorage.removeItem('quizyou_jwt');
  appState.currentUser = null;
  appState.currentUserid = null;
  updateHeaderStatus(false);
  document.getElementById('student-id').value = '';
  document.getElementById('student-pw').value = '';
  resetNavigationHistory();
  navigateTo('landing');
}
