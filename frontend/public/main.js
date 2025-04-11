// Combined profile and theme control
function setupProfileControl() {
  // Set initial theme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);

  // Create profile button
  const profileBtn = document.createElement('div');
  profileBtn.className = 'profile-btn';
  profileBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
    <div class="profile-dropdown">
      <div class="profile-info">
        <div class="profile-name">User Profile</div>
        <div class="profile-email">user@example.com</div>
      </div>
      <button class="theme-toggle-btn">
        ${currentTheme === 'light' ? `
          <svg xmlns="http://www.w3.org/200极/svg" width="20" height="20" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          Dark Mode
        ` : `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          Light Mode
        `}
      </button>
      <button class="logout-btn">Log Out</button>
    </div>
  `;
  
  document.body.prepend(profileBtn);

  // Theme toggle functionality
  const themeBtn = profileBtn.querySelector('.theme-toggle-btn');
  themeBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    // Update button text
    themeBtn.innerHTML = currentTheme === 'light' ? `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      Dark Mode
    ` : `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="极"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      Light Mode
    `;
  });

  // Logout functionality
  const logoutBtn = profileBtn.querySelector('.logout-btn');
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
      window.location.href = '/logout';
    }
  });
}

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  setupProfileControl();
  
  // Load financial data and render charts
  loadFinancialData().then(data => {
    renderFinancialCards(data);
    renderCharts(data);
  });

  // Load recent transactions
  loadRecentTransactions();
});

// [Rest of your existing financial functions remain unchanged...]
