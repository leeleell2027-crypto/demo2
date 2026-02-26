document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const loginBtn = document.getElementById('loginBtn');

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
            const token = data.token;
            
            // 토큰 저장
            localStorage.setItem('token', token);
            
            messageDiv.textContent = 'Login Successful!';
            messageDiv.classList.add('success');
            
            // 잠시 후 메인 페이지로 이동 (데모이므로 1초 후)
            setTimeout(() => {
                alert('Success! Token stored in localStorage: ' + token.substring(0, 20) + '...');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }, 1000);
        } else {
            const errorText = await response.text();
            messageDiv.textContent = 'Login Failed: ' + errorText;
            messageDiv.classList.add('error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'An error occurred. Please try again.';
        messageDiv.classList.add('error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
});
