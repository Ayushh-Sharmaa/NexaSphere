(function () {
  try {
    var stored = localStorage.getItem('nexasphere-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var defaultTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
