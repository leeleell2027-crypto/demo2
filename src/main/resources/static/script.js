document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script initialized');

    const loginSection = document.getElementById('loginSection');
    const profileSection = document.getElementById('profileSection');
    const welcomeUser = document.getElementById('welcomeUser');
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!loginSection || !profileSection || !loginForm) {
        console.error('Essential elements not found in DOM');
        return;
    }

    // 초기 상태 확인
    const checkStatus = () => {
        const token = localStorage.getItem('token');
        const name = localStorage.getItem('userName');
        if (token && name) {
            showProfile(name);
        } else {
            showLogin();
        }
    };

    const showProfile = (name) => {
        loginSection.style.display = 'none';
        profileSection.style.display = 'block';
        welcomeUser.textContent = name + ' 님';
        console.log('Showing profile for', name);
    };

    const showLogin = () => {
        loginSection.style.display = 'block';
        profileSection.style.display = 'none';
        loginForm.reset();
        console.log('Showing login form');
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login attempt started');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        messageDiv.textContent = '';
        messageDiv.className = 'message';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing In...';

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Login response data:', data);

                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.name);

                showProfile(data.name);
            } else {
                const errorText = await response.text();
                console.error('Login failed response:', errorText);
                messageDiv.textContent = 'Login Failed: ' + (errorText || 'Unknown error');
                messageDiv.classList.add('error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            messageDiv.textContent = 'An error occurred. Check console for details.';
            messageDiv.classList.add('error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });

    logoutBtn.addEventListener('click', () => {
        console.log('Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        showLogin();
    });

    checkStatus();
});
