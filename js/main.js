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

const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');

function closeMenu() {
    if (!burger || !nav) {
        return;
    }

    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
}

if (burger && nav) {
    burger.addEventListener('click', function () {
        const isOpen = nav.classList.toggle('is-open');
        burger.classList.toggle('is-open', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
        burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
        document.body.classList.toggle('menu-open', isOpen);
    });

    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && nav.classList.contains('is-open')) {
            closeMenu();
        }
    });
}

const slider = document.querySelector('.slider');

const sliderData = [
    {
        image: 'assets/images/blend-stomach.png',
        alt: 'Чашка чая на столе',
        eyebrow: 'Полезный сбор',
        title: 'Желудочный комфорт',
        text: 'Листья и ягоды чёрной смородины, душица, чабрец и мята. Применяется после еды или при тяжести в животе. Помогает пищеварению, убирает вздутие,\n' +
            'обладает спазмолитическим действием.',
        weight: '50 г',
        price: '10 BYN'
    },
    {
        image: 'assets/images/blend-summer.png',
        alt: 'Чашка лавандового чая на столе',
        eyebrow: 'Вечерний сбор',
        title: 'Летнее настроение',
        text: 'Мягкий чай из листьев и ягод черной смородины, листьев вишни, цветков ромашки и лаванды. Помогает замедлиться после дня.\n' +
            'Лёгкий антидепрессивный эффект. Улучшает сон, но не вызывает сонливости, поэтому можно пить в любое время.',
        weight: '50 г',
        price: '10 BYN'
    },
    {
        image: 'assets/images/blend-morning.png',
        alt: 'Чашка чая на столе',
        eyebrow: 'Утренний сбор',
        title: 'Спокойное утро',
        text: 'Травяной чай из листьев вишни, листьев винограда, цветов чабреца, мяты и ромашки. Чай для мягкого пробуждения и ясной головы.\n' +
            'Подходит для неторопливого утра, помогает проснуться без кофе.',
        weight: '50 г',
        price: '10 BYN'
    }
];

function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (text) {
        el.textContent = text;
    }
    return el;
}

function createSlide(item) {
    const slide = createElement('article', 'slider-slide');

    const imageBox = createElement('div', 'slider-image');
    const img = createElement('img');
    img.src = item.image;
    img.alt = item.alt;
    imageBox.appendChild(img);

    const body = createElement('div', 'slider-body');
    const meta = createElement('div', 'slider-meta');
    meta.appendChild(createElement('span', '', item.weight));
    meta.appendChild(createElement('span', '', item.price));

    const link = createElement('a', 'btn btn-primary', 'Смотреть в каталоге');
    link.href = 'catalog.html';

    body.appendChild(createElement('p', 'eyebrow', item.eyebrow));
    body.appendChild(createElement('h3', '', item.title));
    body.appendChild(createElement('p', '', item.text));
    body.appendChild(meta);
    body.appendChild(link);

    slide.appendChild(imageBox);
    slide.appendChild(body);
    return slide;
}

if (slider) {
    const track = slider.querySelector('.slider-track');
    const slides = sliderData.map(createSlide);
    slides.forEach(function (slide) {
        track.appendChild(slide);
    });
    const prev = slider.querySelector('.slider-prev');
    const next = slider.querySelector('.slider-next');
    const dotsBox = slider.querySelector('.slider-dots');
    const count = slides.length;
    const duration = 500;
    let index = 0;
    let position = 1;
    let isAnimating = false;
    let fallbackTimer = null;

    if (count < 2) {
        prev.hidden = true;
        next.hidden = true;
    } else {
        const lastClone = slides[count - 1].cloneNode(true);
        const firstClone = slides[0].cloneNode(true);

        [lastClone, firstClone].forEach(function (clone) {
            clone.setAttribute('aria-hidden', 'true');
            clone.querySelectorAll('a, button').forEach(function (el) {
                el.tabIndex = -1;
            });
        });

        track.insertBefore(lastClone, track.firstChild);
        track.appendChild(firstClone);
    }

    const dots = slides.map(function (slide, slideIndex) {
        const dot = document.createElement('button');
        dot.className = 'slider-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Слайд ' + (slideIndex + 1) + ' из ' + count);
        dot.addEventListener('click', function () {
            goTo(slideIndex + 1);
        });
        dotsBox.appendChild(dot);
        return dot;
    });

    dotsBox.hidden = count < 2;

    function setPosition(animate) {
        track.style.transition = animate ? 'transform ' + duration + 'ms ease' : 'none';
        track.style.transform = 'translateX(-' + (count < 2 ? 0 : position) * 100 + '%)';

        if (!animate) {
            void track.offsetWidth;
        }
    }

    function update() {
        index = ((position - 1) % count + count) % count;

        dots.forEach(function (dot, dotIndex) {
            const isActive = dotIndex === index;
            dot.classList.toggle('is-active', isActive);
            if (isActive) {
                dot.setAttribute('aria-current', 'true');
            } else {
                dot.removeAttribute('aria-current');
            }
        });

        slides.forEach(function (slide, slideIndex) {
            slide.setAttribute('aria-hidden', String(slideIndex !== index));
        });
    }

    function finish() {
        if (!isAnimating) {
            return;
        }

        clearTimeout(fallbackTimer);
        isAnimating = false;

        if (position < 1 || position > count) {
            position = index + 1;
            setPosition(false);
        }
    }

    function goTo(target) {
        if (isAnimating || count < 2 || target === position) {
            return;
        }

        isAnimating = true;
        position = target;
        setPosition(true);
        update();
        fallbackTimer = setTimeout(finish, duration + 100);
    }

    track.addEventListener('transitionend', function (event) {
        if (event.target === track && event.propertyName === 'transform') {
            finish();
        }
    });

    prev.addEventListener('click', function () {
        goTo(position - 1);
    });

    next.addEventListener('click', function () {
        goTo(position + 1);
    });

    window.addEventListener('resize', function () {
        finish();
        setPosition(false);
    });

    slider.tabIndex = 0;
    slider.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowLeft') {
            goTo(position - 1);
        } else if (event.key === 'ArrowRight') {
            goTo(position + 1);
        } else {
            return;
        }
        event.preventDefault();
    });

    setPosition(false);
    update();
}
