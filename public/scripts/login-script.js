function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                document.cookie = `token=${data.token}; path=/;`;
                window.location.href = "/";
            } else {
                alert(data.message);
            }
        })
        .catch(err => console.error("Login error:", err));
}