// QuizYou Quiz Engine Module
import { appState } from './state.js';
import { navigateTo } from './navigation.js';
import { saveExamToHistory, updateRankings, getStudentRank } from './dashboard.js';

export function getSubjectLabel(sub) {
  switch (sub) {
    case 'all': return 'All Subjects';
    case 'Testing': return 'Testing & QA';
    case 'Agile': return 'Agile Scrum';
    case 'Design Patterns': return 'Design Patterns';
    case 'Git': return 'Version Control (Git)';
    default: return sub;
  }
}

export function setupQuiz() {
  const subject = document.getElementById('config-subject').value;
  const numQuestionsInput = parseInt(document.getElementById('config-questions').value);
  const minutesInput = parseInt(document.getElementById('config-time').value);

  appState.activeSubject = subject;
  appState.totalTimeLimit = minutesInput;

  // Filter questions pool by subject
  let pool = [...appState.allQuestions];
  if (subject !== 'all') {
    pool = pool.filter(q => q.subject === subject);
  }

  // Shuffle pool using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Cap quantity
  const limit = Math.min(numQuestionsInput, pool.length);
  appState.quizQuestions = pool.slice(0, limit);

  if (appState.quizQuestions.length === 0) {
    alert("No questions found for the selected subject. Please add questions to questions.json first!");
    return;
  }

  // Reset quiz states
  appState.currentQuestionIdx = 0;
  appState.selectedAnswers = {};
  appState.timerSecondsLeft = minutesInput * 60;

  // Render first question
  renderQuestion();
  navigateTo('quiz');

  // Start countdown timer
  startTimer();
}

export function startTimer() {
  clearInterval(appState.timerInterval);
  updateTimerUI();
  
  appState.timerInterval = setInterval(() => {
    appState.timerSecondsLeft--;
    updateTimerUI();

    if (appState.timerSecondsLeft <= 0) {
      clearInterval(appState.timerInterval);
      alert("Time is up! Your exam will be submitted automatically.");
      finishQuiz();
    }
  }, 1000);
}

export function updateTimerUI() {
  const timerText = document.getElementById('quiz-timer-text');
  const timerContainer = document.querySelector('.quiz-timer');
  
  const min = Math.floor(appState.timerSecondsLeft / 60);
  const sec = appState.timerSecondsLeft % 60;
  timerText.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  // Color changing timer warning indicators
  if (appState.timerSecondsLeft <= 30) {
    timerContainer.className = 'quiz-timer danger';
  } else if (appState.timerSecondsLeft <= 120) {
    timerContainer.className = 'quiz-timer warning';
  } else {
    timerContainer.className = 'quiz-timer';
  }
}

export function renderQuestion() {
  const total = appState.quizQuestions.length;
  const current = appState.currentQuestionIdx;
  const question = appState.quizQuestions[current];

  // Update headers
  document.getElementById('quiz-current-num').textContent = current + 1;
  document.getElementById('quiz-total-num').textContent = total;

  // Update progress bar
  const progressPercent = ((current) / total) * 100;
  document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

  // Render question text
  document.getElementById('quiz-question-text').textContent = question.question;

  // Render options list
  const optionsList = document.getElementById('quiz-options-list');
  optionsList.innerHTML = '';

  question.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (appState.selectedAnswers[current] === idx) {
      btn.classList.add('selected');
    }

    const indexLabel = String.fromCharCode(65 + idx); // A, B, C, D...
    btn.innerHTML = `<span style="display: flex; align-items: center;"><span class="option-index">${indexLabel}</span><span>${option}</span></span>`;
    
    btn.addEventListener('click', () => {
      selectOption(idx);
    });

    optionsList.appendChild(btn);
  });

  // Update bottom controls
  const prevBtn = document.getElementById('btn-quiz-prev');
  const nextBtn = document.getElementById('btn-quiz-next');

  if (current === 0) {
    prevBtn.style.visibility = 'hidden';
  } else {
    prevBtn.style.visibility = 'visible';
  }

  if (current === total - 1) {
    nextBtn.textContent = 'Submit Exam';
  } else {
    nextBtn.textContent = 'Next Question';
  }
}

export function selectOption(optionIndex) {
  appState.selectedAnswers[appState.currentQuestionIdx] = optionIndex;
  
  // Highlight selection immediately
  const options = document.querySelectorAll('.option-btn');
  options.forEach((btn, idx) => {
    if (idx === optionIndex) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

export async function finishQuiz() {
  clearInterval(appState.timerInterval);

  let correctCount = 0;
  const totalQuestions = appState.quizQuestions.length;

  appState.quizQuestions.forEach((q, idx) => {
    if (appState.selectedAnswers[idx] === q.correctAnswer) {
      correctCount++;
    }
  });

  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const timeTakenSec = (appState.totalTimeLimit * 60) - appState.timerSecondsLeft;
  const timeTakenMin = Math.floor(timeTakenSec / 60);
  const timeTakenRemainderSec = timeTakenSec % 60;

  const timeTakenFormatted = `${String(timeTakenMin).padStart(2, '0')}:${String(timeTakenRemainderSec).padStart(2, '0')}`;

  let rankData = [];

  try {
    const res = await fetch('highscores.json');
    if (!res.ok) throw new Error('Not found');
    rankData = await res.json();
    appState.students = rankData;
  } catch (err) {
    console.warn("Rank Data not found", err);
  }

  updateRankings(
    rankData,
    appState.activeSubject,
    appState.currentUserid,
    percentage
  );

  const masteryRanking = getStudentRank(
    rankData,
    appState.activeSubject,
    appState.currentUserid
  );

  document.getElementById('results-welcome-message').textContent = `Excellent effort, ${appState.currentUser.firstName}! Here is your scorecard:`;
  document.getElementById('results-subject').textContent = getSubjectLabel(appState.activeSubject);
  document.getElementById('results-raw').textContent = `${correctCount} / ${totalQuestions}`;
  document.getElementById('results-percent').textContent = `${percentage}%`;
  document.getElementById('results-rank').textContent = masteryRanking || '--';
  document.getElementById('results-time-taken').textContent = timeTakenFormatted;

  saveExamToHistory({
    subject: getSubjectLabel(appState.activeSubject),
    score: `${correctCount}/${totalQuestions}`,
    percentage: percentage,
    date: new Date().toLocaleDateString()
  });

  navigateTo('results');
}
