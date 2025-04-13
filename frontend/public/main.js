// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", function () {
    // Optional: Clear localStorage/session
    window.location.href = "login.html";
});

// View Full Profile functionality
document.getElementById("viewProfileBtn").addEventListener("click", function () {
    window.location.href = "profile.html"; // or another future profile page
});
