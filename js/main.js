const THEME_KEY = 'travnik-theme';

function getTheme() {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
        const isDark = theme === 'dark';
        button.setAttribute('aria-pressed', String(isDark));
        button.setAttribute(
            'aria-label',
            isDark ? 'Включить светлую тему' : 'Включить тёмную тему'
        );
    });
}

applyTheme(getTheme());

document.querySelectorAll('.theme-toggle').forEach(function (button) {
    button.addEventListener('click', function () {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
});
