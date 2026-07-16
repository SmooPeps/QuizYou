# QA Testing Guide: Professor Portal & Security Updates

This document outlines the new features, architecture changes, and UI updates introduced in the latest release. It provides step-by-step verification instructions for the QA and Testing team to identify bugs and validate functionality.

---

## 1. Feature: Professor Portal - Content Management & Section-Level Visibility
**Functionality:**
Professors now have a dedicated portal to upload quizzes via Excel. Additionally, quizzes are no longer globally visible by default. When a professor creates a quiz, they can dynamically fetch the sections associated with a course and use checkboxes to assign visibility exclusively to specific sections.

**Steps to Verify:**
1. **Setup:** Log in as a User with the `Professor` role (e.g., `abhikoka-prof`).
2. **Access Portal:** Click on **Configure New Exam** and navigate to the **Professor Portal**. Ensure the "Content Management" tab is active.
3. **Course Selection:** Select a "Target Course" from the dropdown. 
    - *Expected Behavior:* The UI should immediately fetch and render checkboxes for all sections belonging to that course.
4. **Upload Quiz:** Fill in the Quiz Title, Time Limit, select an Excel file, and check ONLY ONE section (e.g., "Section A1"). Click **Upload & Create Quiz**.
5. **Verify Positive Case:** Log out and log in as a student enrolled in "Section A1". Check the dropdown in the configuration screen.
    - *Expected Behavior:* The newly created quiz should appear in the student's dropdown.
6. **Verify Negative Case:** Log out and log in as a student enrolled in a DIFFERENT section (e.g., "Section B2"). 
    - *Expected Behavior:* The quiz should NOT appear in their dropdown.

---

## 2. Feature: Professor Portal - Course Settings
**Functionality:**
Professors can toggle real-time settings for a specific course, specifically the `Leaderboard` and `Timer` features. 

**Steps to Verify:**
1. Log in as a `Professor` and navigate to the **Professor Portal -> Course Settings** tab.
2. Select a course from the dropdown.
3. Uncheck the **Enable Quiz Timer** toggle and click **Save Course Settings**.
4. Log out and log in as a `Student` enrolled in that course.
5. Start a quiz for that course.
    - *Expected Behavior:* The countdown timer UI at the top of the quiz screen should be completely hidden, and the quiz should not auto-submit based on time.
6. **Revert:** Log back in as a Professor, re-check the **Enable Quiz Timer** box, and save. Verify the student now sees the timer again.

---

## 3. Feature: Deep Analytics Engine
**Functionality:**
The backend now records exactly which options a student selects for every question (rather than just saving a final percentage). The Analytics tab uses a MongoDB Aggregation Pipeline to calculate real-time success rates for every question in a course.

**Steps to Verify:**
1. Log in as a `Student` and take a quiz. Intentionally get some questions right and some wrong.
2. Log out and log in as a `Professor`.
3. Navigate to **Professor Portal -> Analytics** tab.
4. Select the course the student just took the quiz for.
    - *Expected Behavior:* The dashboard should display a list of Question IDs with their exact Success Rates, Total Attempts, and Correct Counts.
    - *Expected Behavior:* Any question with a success rate below 50% should be highlighted in red text.

---

## 4. Feature: Secure Registration Patch (Vulnerability Fix)
**Functionality:**
A critical security vulnerability was patched. Previously, the public registration endpoint allowed users to define their own roles (e.g., Admin or Professor). The public endpoint now strictly forces all new registrations to the `student` role.

**Steps to Verify:**
1. **UI Verification:** Go to the public Landing Page and click **Register**.
    - *Expected Behavior:* The "Register As" dropdown (Student/Professor/Admin) should no longer exist on the form.
2. **API Verification (Postman/Curl):** Attempt to bypass the UI by sending a raw `POST` request to `/api/auth/register` containing `"role": "admin"` in the JSON body.
3. **Validate:** Log in with the newly created account.
    - *Expected Behavior:* The account should only have standard student privileges (i.e., they should not see the "Professor Portal" or "Registration Management" buttons on the configuration screen).

---

## 5. Feature: Header Dropdown UI
**Functionality:**
The user badge in the top-right corner of the application is now interactive, acting as a dropdown menu for session management.

**Steps to Verify:**
1. Load the application in a logged-out state.
    - *Expected Behavior:* The top right corner should say "Guest Mode" and NOT display a dropdown arrow (`▼`). Clicking it should do nothing.
2. Log in to the application.
    - *Expected Behavior:* The badge should update to the user's name and display a small downward arrow (`▼`).
3. Click the badge.
    - *Expected Behavior:* A glassmorphism dropdown menu containing a "Log Out" button should smoothly appear.
4. Click anywhere else on the screen (outside the menu).
    - *Expected Behavior:* The menu should close automatically.
5. Open the menu again and click **Log Out**.
    - *Expected Behavior:* The user should be successfully logged out and returned to the Landing Page.

---

## 6. Feature: Admin Registration Management & User Search
**Functionality:**
The Admin portal includes a Registration Management module allowing admins to manage user accounts and assign students to course rosters. This includes a new real-time search functionality to easily find existing students, and a checkbox-based interface for assigning rosters (replacing the old multi-select dropdown).

**Steps to Verify:**
1. Log in as an `Admin`.
2. On the configuration screen, click the **Registration Management** button.
3. Use the new search bar to search for a specific student by name or ID.
    - *Expected Behavior:* The list of students should filter in real-time.
4. Select a student and assign them to a course section using the new checkbox interface.
    - *Expected Behavior:* The checkbox UI should be intuitive, and saving the roster should accurately update the student's enrolled sections.

---

## 7. Feature: UI Fix - Configuration Box Overflow
**Functionality:**
Fixed a CSS layout issue where the configuration box on the dashboard was cutting off buttons at the bottom of the screen because it did not expand properly.

**Steps to Verify:**
1. Log in as any user.
2. Navigate to the main Configuration screen (where you select a Course and Quiz).
3. Resize the window or view the box normally.
    - *Expected Behavior:* The box should dynamically expand to fit all content, and all buttons (Start Exam, View Dashboard, View Leaderboards, etc.) should be fully visible and accessible without being cut off.
