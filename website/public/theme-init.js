(function () {
  try {
    var stored = localStorage.getItem('ns-theme') || localStorage.getItem('nexasphere-theme');
    var theme = stored;
    if (theme !== 'light' && theme !== 'dark') {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }
})();

