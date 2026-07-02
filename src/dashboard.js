// QuizYou Dashboard & Highscore/Ranking Module
import { appState } from './state.js';

export function saveExamToHistory(examResult) {
  if (!appState.currentUser) return;
  const storageKey = `quizyou_history_${appState.currentUser.id}`;
  let history = [];
  
  const savedHistory = localStorage.getItem(storageKey);
  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
    } catch (e) {
      history = [];
    }
  }

  history.unshift(examResult); // Add to beginning
  localStorage.setItem(storageKey, JSON.stringify(history));
}

export function renderDashboard() {
  if (!appState.currentUser) return;
  
  const storageKey = `quizyou_history_${appState.currentUser.id}`;
  let history = [];
  
  const savedHistory = localStorage.getItem(storageKey);
  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
    } catch (e) {
      history = [];
    }
  }

  // Update metrics
  const examsCount = history.length;
  document.getElementById('dash-exams-count').textContent = examsCount;

  if (examsCount > 0) {
    const totalPercentage = history.reduce((sum, item) => sum + item.percentage, 0);
    const avg = Math.round(totalPercentage / examsCount);
    document.getElementById('dash-avg-score').textContent = `${avg}%`;
  } else {
    document.getElementById('dash-avg-score').textContent = '--';
  }

  // Update list
  const historyList = document.getElementById('dash-history-list');
  historyList.innerHTML = '';

  if (examsCount === 0) {
    historyList.innerHTML = `<div class="history-item" style="color: var(--text-dim);">No exams taken yet. Start a new exam to log metrics!</div>`;
  } else {
    // Show last 5
    const recent = history.slice(0, 5);
    recent.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      
      const badgeStyle = item.percentage >= 80 ? 'color: var(--success);' : item.percentage >= 50 ? 'color: var(--warning);' : 'color: var(--error);';
      
      el.innerHTML = `
        <span>${item.subject} <span class="history-date">(${item.date})</span></span>
        <span class="history-score" style="${badgeStyle}">${item.score} (${item.percentage}%)</span>
      `;
      historyList.appendChild(el);
    });
  }
}

export function updateRankings(data, subjectId, studentId, newScore) {
  // Find the subject
  const subject = data.subjects.find(s => s.subjectId === subjectId);

  if (!subject) {
    console.error("Subject not found.");
    return;
  }

  // Find the student
  const student = subject.students.find(s => s.studentId === studentId);

  if (!student) {
    console.error("Student not found. Id: " + studentId);
    return;
  }

  // Update only if the new score is higher
  if (newScore > student.highestQuizScore || student.highestQuizScore == null) {
    student.highestQuizScore = newScore;
  }

  // Sort by highest score
  subject.students.sort((a, b) => b.highestQuizScore - a.highestQuizScore);

  // Assign ranks
  let currentRank = 1;

  subject.students.forEach((student, index) => {
    if (
      index > 0 &&
      student.highestQuizScore <
      subject.students[index - 1].highestQuizScore
    ) {
      currentRank = index + 1;
    }

    student.rank = currentRank;
  });
}

export function getStudentRank(data, subjectId, studentId) {
  // Find the subject
  const subject = data.subjects.find(s => s.subjectId === subjectId);

  if (!subject) {
    return null; // Subject not found
  }

  // Find the student
  const student = subject.students.find(s => s.studentId === studentId);

  if (!student) {
    return null; // Student not found
  }

  return student.rank;
}
