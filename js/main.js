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

function herbPacks(herbs) {
    const packs = [];

    herbs.forEach(function (item) {
        packs.push({
            id: item.id + '-50',
            category: item.category,
            name: item.name,
            text: item.text,
            image: item.image,
            alt: item.alt,
            weight: '50 г',
            price: item.price
        });
    });

    herbs.forEach(function (item) {
        packs.push({
            id: item.id + '-100',
            category: item.category,
            name: item.name,
            text: item.stockText,
            image: item.image,
            alt: item.alt,
            weight: '100 г',
            price: item.price === 10 ? 20 : 15
        });
    });

    return packs;
}

const catalogProducts = [
    {
        id: 'blend-morning',
        category: 'blends',
        name: 'Спокойное утро',
        text: 'Лист вишни, лист винограда, мята, чабрец и ромашка.',
        image: 'assets/images/blend-morning.png',
        alt: 'Сбор «Спокойное утро»: листья вишни и винограда, мята, чабрец и ромашка',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-stomach',
        category: 'blends',
        name: 'Желудочный комфорт',
        text: 'Лист чёрной смородины, ягоды чёрной смородины, душица, чабрец и мята.',
        image: 'assets/images/blend-stomach.png',
        alt: 'Сбор «Желудочный комфорт»: лист и ягоды чёрной смородины, душица, чабрец и мята',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-cold',
        category: 'blends',
        name: 'Простуда-стоп!',
        text: 'Лист малины, лист облепихи, эхинацея, душица и чабрец.',
        image: 'assets/images/blend-cold.png',
        alt: 'Сбор «Простуда-стоп!»: лист малины, лист облепихи, эхинацея, душица и чабрец',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-summer',
        category: 'blends',
        name: 'Летнее настроение',
        text: 'Лист чёрной смородины, лист вишни, ягоды чёрной смородины, лаванда и ромашка.',
        image: 'assets/images/blend-summer.png',
        alt: 'Сбор «Летнее настроение»: лист смородины, лист вишни, ягоды смородины, лаванда и ромашка',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-garden-silence',
        category: 'blends',
        name: 'Садовая тишина',
        text: 'Лист винограда, ромашка и мята.',
        image: 'assets/images/blend-garden-silence.png',
        alt: 'Сбор «Садовая тишина»: листья винограда, ромашка и мята',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-garden-shield',
        category: 'blends',
        name: 'Щит сада',
        text: 'Лист винограда, эхинацея и лаванда.',
        image: 'assets/images/blend-garden-shield.png',
        alt: 'Сбор «Щит сада»: листья винограда, эхинацея и лаванда',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-cherry-evening',
        category: 'blends',
        name: 'Вишнёвый вечер',
        text: 'Лист вишни, ромашка и лаванда.',
        image: 'assets/images/blend-cherry-evening.png',
        alt: 'Сбор «Вишнёвый вечер»: листья вишни, ромашка и лаванда',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-warm-slope',
        category: 'blends',
        name: 'Тёплый склон',
        text: 'Лист вишни, чабрец и мята.',
        image: 'assets/images/blend-warm-slope.png',
        alt: 'Сбор «Тёплый склон»: листья вишни, чабрец и мята',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-double-currant',
        category: 'blends',
        name: 'Смородина вдвойне',
        text: 'Лист чёрной смородины, ягоды чёрной смородины и душица.',
        image: 'assets/images/blend-double-currant.png',
        alt: 'Сбор «Смородина вдвойне»: лист и ягоды смородины с душицей',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-amber-garden',
        category: 'blends',
        name: 'Янтарный сад',
        text: 'Лист чёрной смородины, лист облепихи и мята.',
        image: 'assets/images/blend-amber-garden.png',
        alt: 'Сбор «Янтарный сад»: лист смородины, лист облепихи и мята',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-raspberry-shield',
        category: 'blends',
        name: 'Малиновый щит',
        text: 'Лист малины, эхинацея и лаванда.',
        image: 'assets/images/blend-raspberry-shield.png',
        alt: 'Сбор «Малиновый щит»: лист малины, эхинацея и лаванда',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-berry-rest',
        category: 'blends',
        name: 'Ягодный покой',
        text: 'Лист малины, ромашка и ягоды чёрной смородины.',
        image: 'assets/images/blend-berry-rest.png',
        alt: 'Сбор «Ягодный покой»: лист малины, ромашка и ягоды смородины',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-field-bouquet',
        category: 'blends',
        name: 'Полевой букет',
        text: 'Лист винограда, душица и лаванда.',
        image: 'assets/images/blend-field-bouquet.png',
        alt: 'Сбор «Полевой букет»: лист винограда, душица и лаванда',
        weight: '50 г',
        price: 10
    },
    {
        id: 'blend-sunny-cherry',
        category: 'blends',
        name: 'Солнечная вишня',
        text: 'Лист вишни, лист облепихи и ягоды чёрной смородины.',
        image: 'assets/images/blend-sunny-cherry.png',
        alt: 'Сбор «Солнечная вишня»: лист вишни, лист облепихи и ягоды смородины',
        weight: '50 г',
        price: 10
    }
].concat(herbPacks([
    {
        id: 'grape',
        category: 'base',
        name: 'Листья винограда',
        text: 'База сбора. Две части на чайник — мягкая терпкая основа.',
        stockText: 'База на запас. Мягкой терпкой основы хватит на несколько недель.',
        image: 'assets/images/grape-leaves.png',
        alt: 'Свежие и сушёные листья винограда',
        price: 10
    },
    {
        id: 'cherry',
        category: 'base',
        name: 'Листья вишни',
        text: 'База сбора. Две части дают тёплый фруктовый тон.',
        stockText: 'База на запас. Тёплого фруктового тона хватит на много заварок.',
        image: 'assets/images/cherry-leaves.png',
        alt: 'Свежие и сушёные листья вишни',
        price: 10
    },
    {
        id: 'currant-leaf',
        category: 'base',
        name: 'Листья смородины',
        text: 'База сбора. Две части — насыщенный садовый вкус.',
        stockText: 'База на запас. Насыщенный садовый вкус в большой пачке.',
        image: 'assets/images/currant-leaves.png',
        alt: 'Свежие и сушёные листья чёрной смородины',
        price: 10
    },
    {
        id: 'raspberry-leaf',
        category: 'base',
        name: 'Листья малины',
        text: 'База сбора. Две части мягкой ягодной основы.',
        stockText: 'База на запас. Мягкая ягодная основа на много чашек.',
        image: 'assets/images/raspberry-leaves.png',
        alt: 'Свежие и сушёные листья малины',
        price: 10
    },
    {
        id: 'chamomile',
        category: 'action',
        name: 'Ромашка',
        text: 'Целебная трава. Одна часть успокаивает и смягчает сбор.',
        stockText: 'Целебная трава на запас. Одна часть по-прежнему успокаивает сбор.',
        image: 'assets/images/chamomile.png',
        alt: 'Свежие и сушёные цветки ромашки',
        price: 10
    },
    {
        id: 'echinacea',
        category: 'action',
        name: 'Эхинацея',
        text: 'Целебная трава. Одна часть для поддержки иммунитета.',
        stockText: 'Целебная трава на запас. Для поддержки в сезон простуд.',
        image: 'assets/images/echinacea.png',
        alt: 'Свежие и сушёные цветки эхинацеи',
        price: 10
    },
    {
        id: 'seabuckthorn',
        category: 'action',
        name: 'Облепиха',
        text: 'Целебная ягода. Одна часть даёт витаминную яркость.',
        stockText: 'Целебная ягода на запас. Витаминная яркость облепихи на много чашек.',
        image: 'assets/images/seabuckthorn-leaves.png',
        alt: 'Свежие и сушёные листья облепихи',
        price: 10
    },
    {
        id: 'oregano',
        category: 'action',
        name: 'Душица',
        text: 'Целебная трава. Одна часть согревает и помогает дыханию.',
        stockText: 'Целебная трава на запас. Тёплая душица для дыхания — на много заварок.',
        image: 'assets/images/oregano.png',
        alt: 'Свежая и сушёная душица',
        price: 10
    },
    {
        id: 'thyme',
        category: 'action',
        name: 'Чабрец',
        text: 'Целебная трава. Одна часть задаёт сильный согревающий вкус.',
        stockText: 'Целебная трава на запас. Согревающий чабрец, одна часть на чайник.',
        image: 'assets/images/thyme.png',
        alt: 'Свежий и сушёный чабрец',
        price: 10
    },
    {
        id: 'mint',
        category: 'aroma',
        name: 'Мята',
        text: 'Аромат. Только щепотка — иначе перебьёт всю базу.',
        stockText: 'Аромат на запас. На чайник всё равно только щепотка мяты.',
        image: 'assets/images/mint.png',
        alt: 'Свежая и сушёная мята',
        price: 10
    },
    {
        id: 'lavender',
        category: 'aroma',
        name: 'Лаванда',
        text: 'Аромат Hidcote. Щепотка цветочного покоя на чайник.',
        stockText: 'Ароматная лаванда. Больше щепотки на чайник не нужно.',
        image: 'assets/images/lavender.png',
        alt: 'Свежая и сушёная лаванда',
        price: 10
    },
    {
        id: 'currant-berry',
        category: 'aroma',
        name: 'Ягоды смородины',
        text: 'Аромат. Щепотка сухих ягод в финале сбора.',
        stockText: 'Аромат на запас. Щепотка сухих ягод в финале каждого сбора.',
        image: 'assets/images/currant-berries.png',
        alt: 'Свежие и сушёные ягоды чёрной смородины',
        price: 10
    }
]));

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = product.alt;

    const body = document.createElement('div');
    body.className = 'product-card-body';

    const title = document.createElement('h3');
    title.textContent = product.name;

    const text = document.createElement('p');
    text.textContent = product.text;

    const meta = document.createElement('div');
    meta.className = 'product-card-meta';

    const weight = document.createElement('span');
    weight.className = 'product-card-weight';
    weight.textContent = product.weight;

    const price = document.createElement('span');
    price.className = 'product-card-price';
    price.textContent = product.price + ' BYN';

    const button = document.createElement('button');
    button.className = 'btn btn-primary product-card-cart';
    button.type = 'button';
    button.textContent = 'В корзину';

    meta.appendChild(weight);
    meta.appendChild(price);
    body.appendChild(title);
    body.appendChild(text);
    body.appendChild(meta);
    body.appendChild(button);
    card.appendChild(img);
    card.appendChild(body);
    return card;
}

const catalog = document.querySelector('.catalog');

if (catalog) {
    const tabs = catalog.querySelectorAll('.catalog-tab');
    const grid = catalog.querySelector('.catalog-grid');
    const moreButton = catalog.querySelector('.catalog-more');
    const pageSize = 8;
    let activeCategory = 'blends';
    let visibleCount = 0;

    function categoryProducts() {
        return catalogProducts.filter(function (product) {
            return product.category === activeCategory;
        });
    }

    function renderCatalog(reset) {
        if (!grid) {
            return;
        }

        const products = categoryProducts();

        if (reset) {
            visibleCount = 0;
            grid.replaceChildren();
        }

        products.slice(visibleCount, visibleCount + pageSize).forEach(function (product) {
            grid.appendChild(createProductCard(product));
        });

        visibleCount = Math.min(visibleCount + pageSize, products.length);

        if (moreButton) {
            const hasMore = visibleCount < products.length;
            moreButton.hidden = !hasMore;
            moreButton.textContent = hasMore
                ? 'Показать ещё ' + Math.min(pageSize, products.length - visibleCount)
                : 'Показать ещё';
        }

        tabs.forEach(function (tab) {
            const isActive = tab.dataset.category === activeCategory;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-pressed', String(isActive));
        });
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            if (tab.dataset.category === activeCategory) {
                return;
            }

            activeCategory = tab.dataset.category;
            renderCatalog(true);
        });
    });

    if (moreButton) {
        moreButton.addEventListener('click', function () {
            renderCatalog(false);
        });
    }

    renderCatalog(true);
}
