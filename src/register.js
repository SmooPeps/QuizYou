import { navigateTo } from './navigation.js';

const BACKEND_URL = '';

function initRegister() {
    const form = document.getElementById("registrationForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const role = document.getElementById("role").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password, role })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            alert(`Registration Successful!\nWelcome, ${firstName}! Please log in.`);
            form.reset();
            navigateTo('auth');
        } catch (err) {
            alert(`Registration Error: ${err.message}`);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initRegister);
} else {
    initRegister();
}