import { fetchCourses } from './api.js';
import { navigateTo } from './navigation.js';

const BACKEND_URL = '';

export async function populateAdminCourses() {
  const adminCourseDropdown = document.getElementById('admin-config-course');
  if (!adminCourseDropdown) return;
 console.log("Courses seeded!");
  const courses = await fetchCourses();
  adminCourseDropdown.innerHTML = '';

  if (courses.length === 0) {
    adminCourseDropdown.innerHTML = '<option value="">No courses taught</option>';
    return;
  }

  courses.forEach(c => {
    adminCourseDropdown.innerHTML += `<option value="${c._id}">${c.code} - ${c.name} (${c.sectionCode})</option>`;
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

    const formData = new FormData();
    formData.append('excelFile', fileInput.files[0]);

    const token = localStorage.getItem('quizyou_jwt');

    try {
      const url = `${BACKEND_URL}/api/admin/courses/${courseId}/quizzes/upload-excel?title=${encodeURIComponent(title)}&timeLimit=${timeLimit}`;
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
