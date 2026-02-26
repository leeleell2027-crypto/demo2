<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
    <!DOCTYPE html>
    <html lang="ko">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login | Demo Project</title>
        <link rel="stylesheet" href="/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    </head>

    <body>
        <div class="login-container">
            <div class="login-box">
                <div id="loginSection">
                    <h1>Welcome Back</h1>
                    <p>Please enter your details to sign in.</p>
                    <form id="loginForm">
                        <div class="input-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" required placeholder="Enter your username">
                        </div>
                        <div class="input-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required
                                placeholder="Enter your password">
                        </div>
                        <button type="submit" id="loginBtn">Sign In</button>
                    </form>
                    <div id="message" class="message"></div>
                </div>

                <div id="profileSection" style="display: none; text-align: center;">
                    <div class="profile-avatar">👤</div>
                    <h1 id="welcomeUser" style="font-size: 1.5rem; margin-bottom: 0.5rem;">User 님</h1>
                    <p style="margin-bottom: 2rem;">반갑습니다! 로그인되었습니다.</p>
                    <button id="logoutBtn">Logout</button>
                </div>
            </div>
        </div>
        <script src="/script.js"></script>
    </body>

    </html>