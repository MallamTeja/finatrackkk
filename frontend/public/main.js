// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize profile menu
    const profileButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');
    if (profileButton && profileMenu) {
        profileButton.addEventListener('click', () => {
            profileMenu.classList.toggle('hidden');
        });
    }

    // Fetch and display user data if elements exist
    const usernameEl = document.getElementById('username');
    const userEmailEl = document.getElementById('user-email');
    
    if (usernameEl && userEmailEl) {
        fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                usernameEl.textContent = data.name || 'User';
                userEmailEl.textContent = data.email || '';
            })
            .catch(error => {
                console.error('Error fetching user data:', error);
                usernameEl.textContent = 'User';
            });
    }

    // Initialize logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // View Full Profile functionality
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }

    // Theme functions
    function toggleTheme() {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', 
            document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }

    function handleLogout(e) {
        e.preventDefault();
        fetch('/api/logout', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    console.error('Logout failed');
                }
            })
            .catch(error => console.error('Error during logout:', error));
    }
});
