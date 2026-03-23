let token = localStorage.getItem("token") || "";

function showLogin() {
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("signupBox").style.display = "none";

  document.getElementById("loginTab").classList.add("active");
  document.getElementById("signupTab").classList.remove("active");

  document.getElementById("loginMsg").innerText = "";
  document.getElementById("signupMsg").innerText = "";
}

function showSignup() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("signupBox").style.display = "block";

  document.getElementById("signupTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");

  document.getElementById("loginMsg").innerText = "";
  document.getElementById("signupMsg").innerText = "";
}

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

async function login() {
  try {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const remember = document.getElementById("rememberMe").checked;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const msgBox = document.getElementById("loginMsg");

    if (!res.ok) {
      const error = await res.text();
      msgBox.innerText = error;
      return;
    }

    const data = await res.json();
    token = data.token;

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPassword", password);

    if (remember) {
      localStorage.setItem("token", token);
    } else {
      sessionStorage.setItem("token", token);
    }

    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("Login error:", err);
  }
}

async function signup() {
  try {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const msgBox = document.getElementById("signupMsg");

    if (res.ok) {
      msgBox.innerText = "✅ User registered successfully!";
      msgBox.classList.remove("error");
      msgBox.classList.add("success");

      setTimeout(() => {
        showLogin();
      }, 1500);

    } else {
      const msg = await res.text();
      msgBox.innerText = msg;
      msgBox.classList.add("error");
    }

  } catch (err) {
    console.error("Signup error:", err);
  }
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "index.html";
}

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

async function uploadFiles() {
  try {
    const files = document.getElementById("files").files;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    for (let file of files) {
      formData.append("files", file);
    }

    const res = await fetch("/api/auth/upload", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + getToken()
      },
      body: formData
    });

    if (!res.ok) return;

    getFiles();

  } catch (err) {
    console.error("Upload error:", err);
  }
}

async function getFiles() {
  try {
    const res = await fetch("/api/auth/files", {
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    });

    if (!res.ok) return;

    const files = await res.json();

    const fileList = document.getElementById("fileList");
    if (!fileList) return;

    fileList.innerHTML = "";

    files.forEach(file => {

      const cleanName = file.filename.includes("-")
        ? file.filename.split("-").slice(1).join("-")
        : file.filename;

      const div = document.createElement("div");
      div.classList.add("file-item");

      div.innerHTML = `
        <div>
          <p><strong>${cleanName}</strong></p>

          ${file.path.match(/\.(jpg|jpeg|png|gif)$/i) 
            ? `<img src="${file.path}" width="100">` 
            : ""}

          ${file.path.endsWith(".pdf") 
            ? `<iframe src="${file.path}" width="200"></iframe>` 
            : ""}
        </div>

        <div>
          <a href="${file.path}" target="_blank">View</a>
          <button onclick="copyLink('${file.path}')">Copy</button>
          <button onclick="deleteFile('${file._id}')">Delete</button>
        </div>
      `;

      fileList.appendChild(div);
    });

  } catch (err) {
    console.error("Fetch files error:", err);
  }
}

async function deleteFile(id) {
  try {
    await fetch(`/api/auth/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    });

    getFiles();

  } catch (err) {
    console.error("Delete error:", err);
  }
}

function copyLink(link) {
  navigator.clipboard.writeText(link);
}

function toggleDropdown() {
  const menu = document.getElementById("dropdownMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

window.onload = () => {

  if (window.location.pathname.includes("dashboard.html")) {
    const token = getToken();

    if (!token) {
      window.location.href = "index.html";
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));

    const email = payload.email || localStorage.getItem("userEmail");

    document.getElementById("userEmail").innerText = "👤 " + email;
    document.getElementById("detailEmail").innerText = "Email: " + email;
    document.getElementById("detailPassword").innerText =
      "Password: " + localStorage.getItem("userPassword");

    getFiles();
  }
};
