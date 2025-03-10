function register() {
    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password })
    })
        .then(res => res.json())
        .then(data => {
            alert("Account created successfully! Redirecting to login...");
            window.location.href = "/login.html";
        })
        .catch(err => console.error("Signup error:", err));
}