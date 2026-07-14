import { appState } from './state.js';

const BACKEND_URL = '';

function getHeaders() {
  const token = localStorage.getItem('quizyou_jwt');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
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
//Dummy data for testing without backend. Remove this when backend is ready.
/*
export async function fetchCourses() {
  return [
  {
    code: "CS591",
    name: "Software Engineering",
    description: "Covers software development methodologies, design patterns, testing strategies, and best practices for building reliable software systems."
  },
  {
    code: "CS501",
    name: "Advanced Programming",
    description: "Explores advanced programming concepts including object-oriented design, algorithms, data structures, and code optimization."
  },
  {
    code: "CS520",
    name: "Database Systems",
    description: "Introduces relational and NoSQL databases, data modeling, indexing, query optimization, and database management techniques."
  },
  {
    code: "CS550",
    name: "Computer Networks",
    description: "Study of networking fundamentals including protocols, network architectures, routing, security, and distributed communication."
  },
  {
    code: "CS560",
    name: "Artificial Intelligence",
    description: "Introduction to AI concepts including machine learning, search algorithms, knowledge representation, and intelligent systems."
  },
  {
    code: "CS580",
    name: "Web Application Development",
    description: "Focuses on modern web development using frontend frameworks, backend services, APIs, authentication, and deployment."
  },
  {
    code: "CS610",
    name: "Cloud Computing",
    description: "Examines cloud platforms, virtualization, distributed systems, cloud architecture, and scalable application deployment."
  },
  {
    code: "CS620",
    name: "Cybersecurity Fundamentals",
    description: "Covers security principles, cryptography, vulnerability analysis, secure programming, and threat mitigation."
  }
]
}
*/
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
