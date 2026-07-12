// QuizYou Dashboard & Highscore/Ranking Module
import { appState } from './state.js';
import { fetchHistory } from './api.js';

export function saveExamToHistory(examResult) {
  // Keeping signature for backward compatibility
  console.log("Results are now saved directly in MongoDB");
}

export async function renderDashboard() {
  if (!appState.currentUser) return;
  
  const history = await fetchHistory();

  // Update metrics
  const examsCount = history.length;
  document.getElementById('dash-exams-count').textContent = examsCount;

  if (examsCount > 0) {
    const totalPercentage = history.reduce((sum, item) => sum + (item.percentage || 0), 0);
    const avg = Math.round(totalPercentage / examsCount);
    document.getElementById('dash-avg-score').textContent = `${avg}%`;
  } else {
    document.getElementById('dash-avg-score').textContent = '--';
  }

  // Update list
  const historyList = document.getElementById('dash-history-list');
  if (!historyList) return;
  historyList.innerHTML = '';

  if (examsCount === 0) {
    historyList.innerHTML = `<div class="history-item" style="color: var(--text-dim);">No exams taken yet. Start a new exam to log metrics!</div>`;
  } else {
    // Show last 5
    const recent = history.slice(0, 5);
    recent.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      
      const percentage = item.percentage || 0;
      const badgeStyle = percentage >= 80 ? 'color: var(--success);' : percentage >= 50 ? 'color: var(--warning);' : 'color: var(--error);';
      const formattedDate = new Date(item.date).toLocaleDateString();
      const subjectLabel = item.quiz ? `${item.quiz.course ? item.quiz.course.code : ''}: ${item.quiz.title}` : item.subject;

      el.innerHTML = `
        <span>${subjectLabel} <span class="history-date">(${formattedDate})</span></span>
        <span class="history-score" style="${badgeStyle}">${item.score} (${percentage}%)</span>
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

export async function loadLeaderboards() {
    const response = await fetch("highscores.json");

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}

let currentSubjectIndex = 0;

export function renderLeaderboards(containerId, data) {
  const tabsContainer = document.getElementById("leaderboard-tabs");
  const content = document.getElementById("leaderboard-content");

  tabsContainer.innerHTML = "";
  content.innerHTML = "";

  // Build tabs
  data.subjects.forEach((subject, index) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = subject.subjectName;

    if (index === currentSubjectIndex) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      currentSubjectIndex = index;
      renderLeaderboards(containerId, data);
    });

    tabsContainer.appendChild(btn);
  });

  // Render selected subject
  const subject = data.subjects[currentSubjectIndex];
  const students = [...subject.students];

  students.sort((a, b) =>
    (b.highestQuizScore ?? -1) - (a.highestQuizScore ?? -1)
  );

  const highest = Math.max(
    ...students.map(s => s.highestQuizScore ?? 0),
    1
  );

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `<h2>${subject.subjectName}</h2>`;

  students.forEach((student, index) => {
    const hasScore = student.highestQuizScore !== null && student.highestQuizScore !== undefined;
    const score = hasScore ? student.highestQuizScore : 0;

    let medal = index + 1;
    let highlightClass = "";

    // Only award medals and colored backgrounds if the student has a score
    if (hasScore) {
      if (index === 0) {
        medal = "🥇";
        highlightClass = "gold";
      } else if (index === 1) {
        medal = "🥈";
        highlightClass = "silver";
      } else if (index === 2) {
        medal = "🥉";
        highlightClass = "bronze";
      }
    } else {
      medal = "-"; // Display dash if no score is logged
    }

    const row = document.createElement("div");
    row.className = `student ${highlightClass}`.trim();

    row.innerHTML = `
      <div class="rank">${medal}</div>

      <div class="name">
        <strong>${student.studentName}</strong>
        <div class="bar">
          <div class="fill" style="width:${hasScore ? (score / highest) * 100 : 0}%"></div>
        </div>
      </div>

      <div class="score">
        ${hasScore ? `${student.highestQuizScore}%` : "No Score"}
      </div>
    `;

    card.appendChild(row);
  });

  content.appendChild(card);
}
