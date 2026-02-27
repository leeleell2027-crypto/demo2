document.addEventListener('DOMContentLoaded', () => {
    console.log('Login script initialized (Cookie-based)');

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

    // 초기 상태 확인 (서버의 /auth/me 활용)
    const checkStatus = async () => {
        try {
            console.log('Checking auth status...');
            const response = await fetch('/auth/me');
            if (response.ok) {
                const data = await response.json();
                console.log('Auth status: logged in as', data.name);
                showProfile(data.name);
            } else {
                console.log('Auth status: not logged in');
                showLogin();
            }
        } catch (error) {
            console.error('Status check error:', error);
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

            if (response.ok) {
                const data = await response.json();
                console.log('Login successful');
                showProfile(data.name);
            } else {
                const errorText = await response.text();
                console.error('Login failed:', errorText);
                messageDiv.textContent = 'Login Failed: ' + (errorText || 'Unknown error');
                messageDiv.classList.add('error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            messageDiv.textContent = 'An error occurred. Check console.';
            messageDiv.classList.add('error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    });

    logoutBtn.addEventListener('click', async () => {
        console.log('Logging out');
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        showLogin();
    });

    checkStatus();
});
