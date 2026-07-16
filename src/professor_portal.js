import { appState } from './state.js';
import { navigateTo } from './navigation.js';

let allCourses = [];
let allQuizzes = [];

export async function initProfessorPortal() {
  setupProfessorTabs();

  // Setup Back Button
  document.getElementById('btn-admin-back').onclick = () => {
    navigateTo('config');
  };

  await fetchProfessorData();

  // Settings form submission
  document.getElementById('prof-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('prof-settings-course').value;
    const isLeaderboardEnabled = document.getElementById('prof-toggle-leaderboard').checked;
    const isTimerEnabled = document.getElementById('prof-toggle-timer').checked;

    try {
      const res = await fetch(`/api/courses/${courseId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('quizyou_jwt')}`
        },
        body: JSON.stringify({ isLeaderboardEnabled, isTimerEnabled })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      alert('Course settings saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  });

  // Settings course selection change to load current toggles
  document.getElementById('prof-settings-course').addEventListener('change', (e) => {
    const courseId = e.target.value;
    const course = allCourses.find(c => c._id === courseId);
    if (course) {
      document.getElementById('prof-toggle-leaderboard').checked = course.isLeaderboardEnabled;
      document.getElementById('prof-toggle-timer').checked = course.isTimerEnabled;
    }
  });

  // Content course selection change to load sections
  document.getElementById('admin-config-course').addEventListener('change', async (e) => {
    const courseId = e.target.value;
    const container = document.getElementById('admin-quiz-sections');
    container.innerHTML = '';
    
    if (!courseId) {
      container.innerHTML = '<span style="color: var(--text-dim); font-size: 0.9rem;">Select a course to view sections</span>';
      return;
    }
    
    try {
      const res = await fetch(`/api/courses/${courseId}/sections`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('quizyou_jwt')}` }
      });
      const sections = await res.json();
      
      if (sections.length === 0) {
        container.innerHTML = '<span style="color: var(--text-dim); font-size: 0.9rem;">No sections found for this course.</span>';
        return;
      }
      
      sections.forEach(sec => {
        const lbl = document.createElement('label');
        lbl.style.display = 'flex';
        lbl.style.alignItems = 'center';
        lbl.style.gap = '0.5rem';
        lbl.style.cursor = 'pointer';
        lbl.innerHTML = `<input type="checkbox" name="targetSections" value="${sec._id}"> ${sec.sectionCode}`;
        container.appendChild(lbl);
      });
    } catch (err) {
      container.innerHTML = `<span style="color: #ff6b6b;">Error: ${err.message}</span>`;
    }
  });

  // Analytics course selection change
  document.getElementById('prof-analytics-course').addEventListener('change', async (e) => {
    const courseId = e.target.value;
    const dash = document.getElementById('prof-analytics-dashboard');
    if (!courseId) {
      dash.innerHTML = '<p style="color: var(--text-dim);">Select a course to view analytics.</p>';
      return;
    }

    dash.innerHTML = '<p style="color: var(--text-dim);">Loading analytics...</p>';
    
    try {
      const res = await fetch(`/api/analytics/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('quizyou_jwt')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      renderAnalytics(data);
    } catch (err) {
      dash.innerHTML = `<p style="color: #ff6b6b;">Error: ${err.message}</p>`;
    }
  });
}

function setupProfessorTabs() {
  const tabs = document.querySelectorAll('#screen-admin .tab-btn');
  const contents = document.querySelectorAll('#screen-admin .admin-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).style.display = 'block';
    });
  });
}

async function fetchProfessorData() {
  try {
    const courseRes = await fetch('/api/courses', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('quizyou_jwt')}` }
    });
    if (!courseRes.ok) throw new Error('Failed to fetch courses');
    allCourses = await courseRes.json();
    
    const courseSelects = [
      document.getElementById('admin-config-course'),
      document.getElementById('prof-settings-course'),
      document.getElementById('prof-analytics-course')
    ];

    courseSelects.forEach(select => {
      // Keep the first option
      const first = select.options[0];
      select.innerHTML = '';
      select.appendChild(first);
      
      allCourses.forEach(c => {
        if (!c.sectionCode || c.sectionCode === 'All Sections') {
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = `${c.code} - ${c.name}`;
          select.appendChild(opt);
        }
      });
    });

  } catch (err) {
    console.error('Professor Portal Data Error:', err);
  }
}

function renderAnalytics(data) {
  const dash = document.getElementById('prof-analytics-dashboard');
  dash.innerHTML = '';

  if (!data.stats || data.stats.length === 0) {
    dash.innerHTML = '<p style="color: var(--text-dim);">No analytics data available yet. Students need to take quizzes first.</p>';
    return;
  }

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '1rem';

  data.stats.forEach(stat => {
    const percentage = Math.round(stat.successRate * 100);
    let color = 'var(--accent)';
    if (percentage < 50) color = '#ff6b6b';
    if (percentage >= 80) color = '#51cf66';

    const item = document.createElement('div');
    item.style.padding = '1rem';
    item.style.background = 'rgba(255,255,255,0.05)';
    item.style.borderRadius = '8px';
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>Question ID: ${stat.questionId}</span>
        <strong style="color: ${color}">${percentage}% Success Rate</strong>
      </div>
      <div style="font-size: 0.9rem; color: var(--text-dim);">
        Attempts: ${stat.totalAttempts} | Correct: ${stat.correctCount}
      </div>
    `;
    list.appendChild(item);
  });

  dash.appendChild(list);
}
