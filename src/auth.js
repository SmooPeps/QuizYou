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

export function restoreSession() {
  const savedUser = localStorage.getItem('quizyou_user');
  const savedId = localStorage.getItem('quizyou_userid');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      appState.currentUserid = JSON.parse(savedId);
      updateHeaderStatus(true);
      navigateTo('config');
    } catch (e) {
      localStorage.removeItem('quizyou_user');
      localStorage.removeItem('quizyou_userid');
    }
  }
}

export function handleLogin(inputId, inputPw) {
  const alertBox = document.getElementById('auth-alert');
  
  const student = appState.students.find(s => 
    (s.id.toLowerCase() === inputId || s.email.split('@')[0].toLowerCase() === inputId) &&
    s.password === inputPw
  );
  
  if (student) {
    alertBox.style.display = 'none';
    appState.currentUser = student;
    appState.currentUserid = inputId;
    localStorage.setItem('quizyou_user', JSON.stringify(student));
    localStorage.setItem('quizyou_userid', JSON.stringify(inputId));
    updateHeaderStatus(true);
    navigateTo('config');
    return true;
  } else {
    alertBox.textContent = "Invalid ID or Password.";
    alertBox.style.display = 'block';
    return false;
  }
}

export function handleLogout() {
  localStorage.removeItem('quizyou_user');
  localStorage.removeItem('quizyou_userid');
  appState.currentUser = null;
  appState.currentUserid = null;
  updateHeaderStatus(false);
  document.getElementById('student-id').value = '';
  document.getElementById('student-pw').value = '';
  resetNavigationHistory();
  navigateTo('landing');
}
