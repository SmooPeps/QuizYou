import { fetchCourses, fetchQuizzesForCourse } from './api.js';
import { navigateTo } from './navigation.js';

const BACKEND_URL = '';

export async function populateAdminCourses() {
  const adminCourseDropdown = document.getElementById('admin-config-course');
  if (!adminCourseDropdown) return;
 console.log("Courses seeded!");
  const courses = await fetchCourses();
  adminCourseDropdown.innerHTML = '<option value="">Select Target Course</option>';

  if (courses.length === 0) {
    adminCourseDropdown.innerHTML = '<option value="">No courses taught</option>';
    return;
  }

  courses.forEach(c => {
    adminCourseDropdown.innerHTML += `<option value="${c._id}">${c.code} - ${c.name} (${c.sectionCode || 'All'})</option>`;
  });
  
  // Add listener for course change
  adminCourseDropdown.addEventListener('change', async (e) => {
    const courseId = e.target.value;
    if (courseId) {
      await loadQuizzesForCourse(courseId);
    } else {
      document.getElementById('prof-quizzes-list').innerHTML = '';
    }
  });
}

async function loadQuizzesForCourse(courseId) {
  const list = document.getElementById('prof-quizzes-list');
  list.innerHTML = '<p style="color: var(--text-dim);">Loading quizzes...</p>';
  const quizzes = await fetchQuizzesForCourse(courseId);
  
  let courseSections = [];
  try {
    const token = localStorage.getItem('quizyou_jwt');
    const res = await fetch(`${BACKEND_URL}/api/courses/${courseId}/sections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      courseSections = await res.json();
    }
  } catch (err) {
    console.error("Failed to load sections", err);
  }
  
  renderQuizzes(quizzes, courseId, courseSections);
}

function renderQuizzes(quizzes, courseId, courseSections) {
  const list = document.getElementById('prof-quizzes-list');
  list.innerHTML = '';
  
  if (quizzes.length === 0) {
    list.innerHTML = '<p style="color: var(--text-dim);">No quizzes found for this course.</p>';
    return;
  }
  
  quizzes.forEach(q => {
    const div = document.createElement('div');
    div.className = 'quiz-list-item';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '0.5rem';
    div.style.padding = '0.75rem';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    
    let sectionsHtml = '<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.25rem; font-size: 0.85rem;">';
    if (courseSections.length === 0) {
      sectionsHtml += '<span style="color: var(--text-dim);">No sections available</span>';
    } else {
      courseSections.forEach(sec => {
        const isChecked = (q.visibleToSections || []).includes(sec._id);
        sectionsHtml += `
          <label style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
            <input type="checkbox" class="quiz-section-checkbox" data-quiz="${q._id}" data-section="${sec._id}" ${isChecked ? 'checked' : ''}>
            ${sec.sectionCode}
          </label>
        `;
      });
    }
    sectionsHtml += '</div>';

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span><strong>${q.title}</strong> (${q.timeLimit} mins)</span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-tertiary btn-edit-quiz" data-id="${q._id}" data-title="${q.title}" data-time="${q.timeLimit}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #4dabf7; border-color: #4dabf7;">Edit</button>
          <button class="btn btn-tertiary btn-delete-quiz" data-id="${q._id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #ff6b6b; border-color: #ff6b6b;">Delete</button>
        </div>
      </div>
      <div>
        <strong style="font-size: 0.85rem; color: var(--primary);">Visible to Sections:</strong>
        ${sectionsHtml}
      </div>
    `;
    list.appendChild(div);
  });
  
  // Section toggle listeners
  document.querySelectorAll('.quiz-section-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const quizId = e.target.getAttribute('data-quiz');
      
      const container = e.target.closest('div');
      const checkedBoxes = Array.from(container.querySelectorAll('.quiz-section-checkbox:checked'));
      const visibleToSections = checkedBoxes.map(b => b.getAttribute('data-section'));
      
      try {
        const token = localStorage.getItem('quizyou_jwt');
        const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ visibleToSections })
        });
        if (!res.ok) {
          e.target.checked = !e.target.checked;
          alert('Failed to update quiz visibility.');
        }
      } catch (err) {
        e.target.checked = !e.target.checked;
        alert('Error updating visibility.');
      }
    });
  });
  
  // Delete listeners
  document.querySelectorAll('.btn-delete-quiz').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (confirm('Are you sure you want to delete this quiz?')) {
        const quizId = e.target.getAttribute('data-id');
        try {
          const token = localStorage.getItem('quizyou_jwt');
          const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            loadQuizzesForCourse(courseId);
          } else {
            alert('Failed to delete quiz.');
          }
        } catch (err) {
          alert('Error deleting quiz.');
        }
      }
    });
  });

  // Edit listeners
  document.querySelectorAll('.btn-edit-quiz').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const quizId = e.target.getAttribute('data-id');
      const currentTitle = e.target.getAttribute('data-title');
      const currentTime = e.target.getAttribute('data-time');

      const newTitle = prompt("Enter new quiz title:", currentTitle);
      if (newTitle === null) return;
      const newTimeStr = prompt("Enter new time limit (minutes):", currentTime);
      if (newTimeStr === null) return;
      const newTime = parseInt(newTimeStr);
      if (isNaN(newTime) || newTime < 1) {
        alert("Invalid time limit");
        return;
      }

      try {
        const token = localStorage.getItem('quizyou_jwt');
        const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: newTitle, timeLimit: newTime })
        });
        if (res.ok) {
          loadQuizzesForCourse(courseId);
        } else {
          alert('Failed to update quiz.');
        }
      } catch (err) {
        alert('Error updating quiz.');
      }
    });
  });
}

export function setupAdminPanel() {
  const form = document.getElementById('admin-upload-form');
  const fileInput = document.getElementById('excel-file-input');
  
  if (!form || !fileInput) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files.length) {
      alert("Please select an Excel file first!");
      return;
    }

    const courseId = document.getElementById('admin-config-course').value;
    const title = document.getElementById('admin-quiz-title').value.trim();
    const timeLimit = document.getElementById('admin-quiz-time').value;

    if (!courseId) {
      alert("Please select a target course!");
      return;
    }

    const targetSections = Array.from(document.querySelectorAll('input[name="targetSections"]:checked')).map(cb => cb.value);

    const formData = new FormData();
    formData.append('excelFile', fileInput.files[0]);
    formData.append('title', title);
    formData.append('timeLimit', timeLimit);
    formData.append('visibleToSections', JSON.stringify(targetSections));

    const token = localStorage.getItem('quizyou_jwt');

    try {
      const url = `${BACKEND_URL}/api/admin/courses/${courseId}/quizzes/upload-excel`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Excel upload failed');

      alert(data.message || 'Quiz created successfully from Excel sheet!');
      form.reset();
      navigateTo('config');
    } catch (err) {
      alert(`Error uploading Excel: ${err.message}`);
    }
  });

  // Wire up back button
  const backBtn = document.getElementById('btn-admin-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      navigateTo('config');
    });
  }
}
