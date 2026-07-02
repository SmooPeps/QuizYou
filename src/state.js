// QuizYou Global State Module

export const appState = {
  currentUser: null,      // Object when logged in
  currentUserid: null,    // Current user's student id
  students: [],           // Loaded students list
  allQuestions: [],       // Loaded question pool
  quizQuestions: [],      // Active filtered questions
  currentQuestionIdx: 0,  // Index in quizQuestions
  selectedAnswers: {},    // Map of { questionIndex: optionIndex }
  timerSecondsLeft: 0,    // Timer track
  timerInterval: null,    // Timer reference
  totalTimeLimit: 0,      // Minutes limit
  activeSubject: 'all'
};
