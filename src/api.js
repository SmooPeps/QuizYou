import { appState } from './state.js';

const BACKEND_URL = '';

function getHeaders() {
  const token = localStorage.getItem('quizyou_jwt');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function loadData() {
  // Empty mock placeholder as fetching is now dynamic based on login state
  console.log("QuizYou APIs connected to backend.");
}

export async function fetchCourses() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/courses`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch courses");
    return await res.json();
  } catch (err) {
    console.error("API Course Fetch Error:", err);
    return [];
  }
}

export async function fetchQuizzesForCourse(courseId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/courses/${courseId}/quizzes`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch quizzes");
    return await res.json();
  } catch (err) {
    console.error("API Quiz Fetch Error:", err);
    return [];
  }
}

export async function fetchQuizDetails(quizId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/quizzes/${quizId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch quiz details");
    return await res.json();
  } catch (err) {
    console.error("API Quiz Details Fetch Error:", err);
    return null;
  }
}

export async function submitQuizResult(quizId, score, percentage, timeTaken) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/results`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quizId, score, percentage, timeTaken })
    });
    if (!res.ok) throw new Error("Failed to save result");
    return await res.json();
  } catch (err) {
    console.error("API Save Result Error:", err);
    return null;
  }
}

export async function fetchHistory() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/results/history`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch history");
    return await res.json();
  } catch (err) {
    console.error("API History Fetch Error:", err);
    return [];
  }
}
