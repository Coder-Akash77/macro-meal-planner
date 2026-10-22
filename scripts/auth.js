roleOptions.forEach(function (option) {
    option.addEventListener("click", function () {
        selectedRole = option.dataset.role;

        roleOptions.forEach(function (roleOption) {
            roleOption.classList.toggle("active", roleOption === option);
        });

        selectedRoleLabel.textContent =
            selectedRole === "admin" ? "Admin" : "User";

        loginError.textContent = "";

        if (selectedRole === "admin") {
            document.getElementById("show-signup").style.display = "none";
        } else {
            document.getElementById("show-signup").style.display = "inline";
        }
    });
});


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

signupForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;

    signupError.textContent = "";

    if (password !== confirmPassword) {
        signupError.textContent = "Passwords do not match.";
        if (username.length < 3) { signupError.textContent = "Username must be at least 3 characters."; return; }
        if (password.length < 4) { signupError.textContent = "Password must be at least 4 characters."; return; }
        return;
    }

    const users = getUsers();

    const existingUser = users.find(function (user) {
        return user.username.toLowerCase() === username.toLowerCase();
    });

    if (existingUser) {
        signupError.textContent = "Username already exists.";
        return;
    }

    users.push({
        username: username,
        password: password,
        role: "user"
    });

    saveUsers(users);

    alert("Account created successfully. You can now log in.");

    signupForm.reset();

    document.getElementById("signup-view").classList.add("hidden");
    document.getElementById("login-view").classList.remove("hidden");
});



loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    loginError.textContent = "";

    if (!username || !password) {
        loginError.textContent = "Enter your username and password.";
        return;
    }

    if (selectedRole === "admin") {
        if (username !== "admin" || password !== "admin123") {
            loginError.textContent = "Use the demo admin credentials shown below.";
            return;
        }
        localStorage.setItem(LOGIN_KEY, JSON.stringify({ loggedIn: true, role: "admin", username: "admin" }));
        showApp("admin", "admin");
        return;
    }

    const users = getUsers();
    const validUser = users.find(function (user) {
        return user.username === username && user.password === password;
    });

    if (!validUser) {
        loginError.textContent = "Invalid username or password.";
        return;
    }

    localStorage.setItem(LOGIN_KEY, JSON.stringify({ loggedIn: true, role: "user", username: validUser.username }));
    showApp("user", validUser.username);
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

document.getElementById("logout-btn").addEventListener("click", function () {
    localStorage.removeItem(LOGIN_KEY);
    location.reload();
});