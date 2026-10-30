function showApp(role, username) {
    document.getElementById("login-page").classList.add("hidden");

    document.querySelectorAll(".app-shell").forEach(function (element) {
        element.classList.add("visible");
    });

    adminNavTab.classList.toggle("visible", role === "admin");

    selectedRole = role;

    const roleLabel = role === "admin" ? "Admin" : "User";
    document.getElementById("profile-avatar").textContent = username.charAt(0).toUpperCase();
    document.getElementById("profile-username").textContent = username;
    document.getElementById("profile-role-badge").textContent = roleLabel;
    document.getElementById("profile-info-username").textContent = username;
    document.getElementById("profile-info-role").textContent = roleLabel;
    updateProfileStats();

    switchTab(role === "admin" ? "admin" : "home");
    if (role === "user") loadPersistedMealData();
}

function updateProfileStats() {
    document.getElementById("profile-favorites-count").textContent = getFavorites().length;
    document.getElementById("profile-log-count").textContent = getTodayLog().length;
    document.getElementById("profile-custom-count").textContent = getCustomFoods().length;
}

function getUsers() {
    const storedUsers = localStorage.getItem(USERS_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

showSignupBtn.addEventListener("click", function () {
    document.getElementById("login-view").style.display = "none";
    document.getElementById("signup-view").style.display = "block";
});

showLoginBtn.addEventListener("click", function () {
    document.getElementById("signup-view").style.display = "none";
    document.getElementById("login-view").style.display = "block";
    signupError.textContent = "";
});


signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    signupError.textContent = "";

    if (username.length < 3) {
        signupError.textContent = "Username must be at least 3 characters.";
        return;
    }

    if (password.length < 8) {
        signupError.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        signupError.textContent = "Passwords do not match.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        signupForm.reset();
        document.getElementById("signup-view").style.display = "none";
        document.getElementById("login-view").style.display = "block";
        document.getElementById("login-username").value = email;
        loginError.textContent = "Account created! Please log in.";
    } catch (error) {
        signupError.textContent = error.message || "Could not connect to the server.";
    }
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    loginError.textContent = "";

    if (!email || !password) {
        loginError.textContent = "Enter your email and password.";
        return;
    }

    // Keep the existing demo admin login.
    if (selectedRole === "admin") {
        if (email !== "admin" || password !== "admin123") {
            loginError.textContent = "Use the demo admin credentials shown below.";
            return;
        }

        localStorage.setItem(LOGIN_KEY, JSON.stringify({
            loggedIn: true,
            role: "admin",
            username: "admin"
        }));
        showApp("admin", "admin");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Invalid email or password.");
        }

        if (!data.token) {
            throw new Error("Login succeeded but no token was returned.");
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(LOGIN_KEY, JSON.stringify({
            loggedIn: true,
            role: "user",
            username: data.user.name,
            email: data.user.email
        }));

        showApp("user", data.user.name);
    } catch (error) {
        loginError.textContent = error.message || "Could not connect to the server.";
    }
});

const savedLogin = localStorage.getItem(LOGIN_KEY);

if (savedLogin) {
    try {
        const loginData = JSON.parse(savedLogin);

        if (loginData.loggedIn && loginData.role) {
            showApp(loginData.role, loginData.username);
        }

    } catch (error) {
        localStorage.removeItem(LOGIN_KEY);
    }
}

