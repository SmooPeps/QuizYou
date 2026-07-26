import { appState } from './state.js';
import { navigateTo } from './navigation.js';
import { loadQuizzesForCourse } from './admin.js';

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
      
      const updatedCourse = await res.json();
      
      // Update local state
      const cIndex = allCourses.findIndex(c => c._id === courseId);
      if (cIndex !== -1) {
        allCourses[cIndex].isLeaderboardEnabled = updatedCourse.isLeaderboardEnabled;
        allCourses[cIndex].isTimerEnabled = updatedCourse.isTimerEnabled;
      }
      
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
      document.getElementById('prof-quizzes-list').innerHTML = '';
      return;
    }

    // Load existing quizzes for this course
    await loadQuizzesForCourse(courseId);
    
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

export async function fetchProfessorData() {
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

let analyticsCharts = [];

function renderAnalytics(data) {
  const dash = document.getElementById('prof-analytics-dashboard');
  dash.innerHTML = '';
  
  // Destroy existing charts to prevent memory leaks or overlap
  analyticsCharts.forEach(chart => chart.destroy());
  analyticsCharts = [];

  if (!data.avgScores || data.avgScores.length === 0) {
    dash.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 2rem;">No analytics data available yet. Students need to take quizzes first.</p>';
    return;
  }

  // Create the layout
  dash.innerHTML = `
    <div class="analytics-grid">
      <div class="analytics-card">
        <h4>Average Score per Quiz</h4>
        <div style="position: relative; width: 100%; min-height: 300px;">
          <canvas id="chart-avg-scores"></canvas>
        </div>
      </div>
      <div class="analytics-card">
        <h4>Overall Grade Distribution</h4>
        <div style="position: relative; width: 100%; min-height: 300px; display: flex; justify-content: center;">
          <canvas id="chart-grade-dist"></canvas>
        </div>
      </div>
      <div class="analytics-card" style="grid-column: 1 / -1;">
        <h4>Item Analysis: Toughest Question</h4>
        <div class="analytics-metric">
          <span class="analytics-metric-title">Lowest Success Rate</span>
          <span class="analytics-metric-value" style="color: #ff6b6b;">${data.toughestQuestion ? data.toughestQuestion.successRate : 'N/A'}</span>
          <span class="analytics-metric-subtext" style="font-size: 1rem; color: var(--text-color); margin-top: 0.5rem; white-space: normal;">
            ${data.toughestQuestion ? data.toughestQuestion.questionText : 'Not enough data to calculate toughest question yet.'}
          </span>
        </div>
      </div>
    </div>
  `;

  // Render Bar Chart
  const ctxBar = document.getElementById('chart-avg-scores').getContext('2d');
  const barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: data.avgScores.map(a => a.quizTitle),
      datasets: [{
        label: 'Average Score (%)',
        data: data.avgScores.map(a => a.averagePercentage),
        backgroundColor: 'rgba(116, 123, 255, 0.6)',
        borderColor: 'rgba(116, 123, 255, 1)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { color: '#ccc' } },
        x: { ticks: { color: '#ccc' } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
  analyticsCharts.push(barChart);

  // Render Doughnut Chart
  const ctxDoughnut = document.getElementById('chart-grade-dist').getContext('2d');
  const dist = data.distribution;
  const doughnutChart = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
      labels: ['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'],
      datasets: [{
        data: [dist.A, dist.B, dist.C, dist.D, dist.F],
        backgroundColor: [
          '#51cf66', // A: Green
          '#339af0', // B: Blue
          '#fcc419', // C: Yellow
          '#ff922b', // D: Orange
          '#ff6b6b'  // F: Red
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#ccc' } }
      }
    }
  });
  analyticsCharts.push(doughnutChart);
}
