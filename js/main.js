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

const CART_KEY = 'travnik-cart';
const CART_MAX_QTY = 99;
const cartPanel = document.getElementById('cart');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartList = document.getElementById('cart-list');
const cartEmpty = document.getElementById('cart-empty');
const cartFooter = document.getElementById('cart-footer');
const cartTotal = document.getElementById('cart-total');
const cartStatus = document.getElementById('cart-status');
const cartClose = document.querySelector('.cart-close');
const cartToggles = document.querySelectorAll('.cart-toggle');
let cart = [];
let cartTrigger = null;
let cartStorageOk = true;

function normalizeCartItem(item) {
    const price = Number(item && item.price);
    const qty = Math.floor(Number(item && item.qty));

    if (!item || typeof item.id !== 'string' || !item.id || !isFinite(price) || price < 0 || !isFinite(qty) || qty < 1) {
        return null;
    }

    return {
        id: item.id,
        name: String(item.name || 'Травяной сбор'),
        note: String(item.note || ''),
        price: price,
        image: String(item.image || ''),
        weight: String(item.weight || '50 г'),
        qty: Math.min(qty, CART_MAX_QTY)
    };
}

function loadCart() {
    try {
        const data = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        const seen = {};

        cart = (Array.isArray(data) ? data : []).map(normalizeCartItem).filter(function (item) {
            if (!item || seen[item.id]) {
                return false;
            }

            seen[item.id] = true;
            return true;
        });
    } catch (error) {
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        cartStorageOk = true;
    } catch (error) {
        cartStorageOk = false;
    }

    renderCart();
}

function cartQty() {
    return cart.reduce(function (sum, item) {
        return sum + item.qty;
    }, 0);
}

function cartItem(id) {
    return cart.filter(function (item) {
        return item.id === id;
    })[0];
}

function setCartQty(id, qty) {
    const next = [];

    cart.forEach(function (item) {
        if (item.id !== id) {
            next.push(item);
            return;
        }

        item.qty = Math.min(qty, CART_MAX_QTY);

        if (item.qty > 0) {
            next.push(item);
        }
    });

    cart = next;
    saveCart();
}

function formatPrice(value) {
    return (Math.round(value * 100) / 100) + ' BYN';
}

function announceCart(message) {
    if (!cartStatus) {
        return;
    }

    cartStatus.textContent = '';
    setTimeout(function () {
        cartStatus.textContent = message;
    }, 50);
}

function isCartOpen() {
    return Boolean(cartPanel && cartPanel.classList.contains('is-open'));
}

function updateCartToggles() {
    const count = cartQty();
    const open = isCartOpen();

    cartToggles.forEach(function (button) {
        const badge = button.querySelector('.cart-toggle-count');

        button.setAttribute('aria-expanded', String(open));
        button.setAttribute(
            'aria-label',
            (open ? 'Закрыть корзину' : 'Открыть корзину') + (count ? ', товаров: ' + count : ', пусто')
        );

        if (badge) {
            badge.hidden = count === 0;
            badge.textContent = count > CART_MAX_QTY ? CART_MAX_QTY + '+' : String(count);
        }
    });
}

function setCartPanel(open) {
    cartPanel.classList.toggle('is-open', open);
    cartPanel.setAttribute('aria-hidden', String(!open));

    if (cartBackdrop) {
        cartBackdrop.hidden = !open;
    }

    document.body.classList.toggle('cart-open', open);
    updateCartToggles();
}

function openCart() {
    if (!cartPanel || isCartOpen()) {
        return;
    }

    closeMenu();
    cartTrigger = document.activeElement;
    setCartPanel(true);

    if (cartClose) {
        cartClose.focus({ preventScroll: true });
    }
}

function closeCart() {
    if (!isCartOpen()) {
        return false;
    }

    const focusInside = cartPanel.contains(document.activeElement);

    setCartPanel(false);

    if (focusInside && cartTrigger && cartTrigger.isConnected) {
        cartTrigger.focus({ preventScroll: true });
    }

    cartTrigger = null;
    return true;
}

function addToCart(product) {
    const item = normalizeCartItem({
        id: product && product.id,
        name: product && product.name,
        note: product && product.note,
        price: product && product.price,
        image: product && product.image,
        weight: product && product.weight,
        qty: 1
    });

    if (!item) {
        return;
    }

    const found = cartItem(item.id);

    if (found) {
        if (found.qty >= CART_MAX_QTY) {
            announceCart('В корзине уже максимум: ' + CART_MAX_QTY + ' шт. «' + found.name + '»');
            return;
        }

        found.qty += 1;
    } else {
        cart.push(item);
    }

    saveCart();
    announceCart('«' + product.name + '» добавлен в корзину. Товаров: ' + cartQty());
    cartToggles.forEach(function (button) {
        button.classList.remove('is-pulse');
        void button.offsetWidth;
        button.classList.add('is-pulse');
    });
}

function cartButton(className, label, text, action, id) {
    const button = createElement('button', className, text);
    button.type = 'button';
    button.dataset.action = action;
    button.dataset.id = id;
    button.setAttribute('aria-label', label);
    return button;
}

function renderCart() {
    updateCartToggles();

    if (!cartList) {
        return;
    }

    const active = document.activeElement;
    const focusAction = active && cartList.contains(active) ? active.dataset.action : null;
    const focusId = focusAction ? active.dataset.id : null;
    const focusIndex = focusAction
        ? Array.prototype.indexOf.call(cartList.children, active.closest('.cart-item'))
        : -1;

    cartList.replaceChildren();

    cart.forEach(function (item) {
        const row = createElement('li', 'cart-item');
        const img = createElement('img');
        const info = document.createElement('div');
        const qtyBox = createElement('div', 'cart-qty');
        const plus = cartButton('', 'Увеличить количество «' + item.name + '»', '+', 'plus', item.id);
        const priceLabel = item.qty > 1
            ? item.price + ' × ' + item.qty + ' = ' + formatPrice(item.price * item.qty)
            : formatPrice(item.price);

        img.src = item.image;
        img.alt = '';
        plus.disabled = item.qty >= CART_MAX_QTY;
        qtyBox.setAttribute('role', 'group');
        qtyBox.setAttribute('aria-label', 'Количество «' + item.name + '»');
        qtyBox.appendChild(cartButton('', 'Уменьшить количество «' + item.name + '»', '−', 'minus', item.id));
        qtyBox.appendChild(createElement('span', '', String(item.qty)));
        qtyBox.appendChild(plus);
        info.appendChild(createElement('b', '', item.name));
        info.appendChild(createElement('span', '', item.weight + ' · ' + priceLabel));
        info.appendChild(qtyBox);
        row.appendChild(img);
        row.appendChild(info);
        row.appendChild(cartButton('cart-remove', 'Удалить «' + item.name + '» из корзины', '×', 'remove', item.id));
        cartList.appendChild(row);
    });

    if (focusAction) {
        restoreCartFocus(focusAction, focusId, focusIndex);
    }

    if (cartEmpty) {
        cartEmpty.hidden = cart.length > 0;
    }

    if (cartFooter) {
        cartFooter.hidden = cart.length === 0;
    }

    if (cartTotal) {
        cartTotal.textContent = formatPrice(cart.reduce(function (sum, item) {
            return sum + item.price * item.qty;
        }, 0));
    }
}

function cartControl(selector, id, action) {
    return Array.prototype.filter.call(cartList.querySelectorAll(selector), function (button) {
        return button.dataset.id === id && (!action || button.dataset.action === action) && !button.disabled;
    })[0];
}

function restoreCartFocus(action, id, index) {
    const rows = cartList.children;
    const row = rows[Math.min(index, rows.length - 1)];
    const target = cartControl('button', id, action)
        || cartControl('.cart-remove', id)
        || (row && row.querySelector('.cart-remove'))
        || cartClose;

    if (target) {
        target.focus({ preventScroll: true });
    }
}

if (cartList) {
    cartList.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-action]');

        if (!button || button.disabled) {
            return;
        }

        const item = cartItem(button.dataset.id);
        const qty = item ? item.qty : 0;

        if (button.dataset.action === 'plus') {
            setCartQty(button.dataset.id, qty + 1);
        } else if (button.dataset.action === 'minus') {
            setCartQty(button.dataset.id, qty - 1);
        } else if (button.dataset.action === 'remove') {
            setCartQty(button.dataset.id, 0);
        }
    });
}

if (cartPanel) {
    cartPanel.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab' || !isCartOpen()) {
            return;
        }

        const focusable = Array.prototype.filter.call(
            cartPanel.querySelectorAll('button:not([disabled]), a[href]'),
            function (el) {
                return el.offsetParent !== null;
            }
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!first) {
            return;
        }

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

window.addEventListener('storage', function (event) {
    if (cartStorageOk && (event.key === CART_KEY || event.key === null)) {
        loadCart();
        renderCart();
    }
});

cartToggles.forEach(function (button) {
    button.addEventListener('click', function () {
        if (isCartOpen()) {
            closeCart();
        } else {
            openCart();
        }
    });
});

if (cartBackdrop) {
    cartBackdrop.addEventListener('click', closeCart);
}

if (cartClose) {
    cartClose.addEventListener('click', closeCart);
}

let closeProductModal = function () {
    return false;
};

let openProductModal = function () {};

document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
        return;
    }

    if (closeProductModal()) {
        event.stopImmediatePropagation();
        return;
    }

    closeCart();
});

loadCart();
renderCart();

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

const packPrices = { '50': 10, '100': 20 };
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
        price: packPrices['50'] + ' BYN'
    },
    {
        image: 'assets/images/blend-summer.png',
        alt: 'Чашка лавандового чая на столе',
        eyebrow: 'Вечерний сбор',
        title: 'Летнее настроение',
        text: 'Мягкий чай из листьев и ягод черной смородины, листьев вишни, цветков ромашки и лаванды. Помогает замедлиться после дня.\n' +
            'Лёгкий антидепрессивный эффект. Улучшает сон, но не вызывает сонливости, поэтому можно пить в любое время.',
        weight: '50 г',
        price: packPrices['50'] + ' BYN'
    },
    {
        image: 'assets/images/blend-morning.png',
        alt: 'Чашка чая на столе',
        eyebrow: 'Утренний сбор',
        title: 'Спокойное утро',
        text: 'Травяной чай из листьев вишни, листьев винограда, цветов чабреца, мяты и ромашки. Чай для мягкого пробуждения и ясной головы.\n' +
            'Подходит для неторопливого утра, помогает проснуться без кофе.',
        weight: '50 г',
        price: packPrices['50'] + ' BYN'
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

function catalogProduct(item, size) {
    const isHeavy = size === '100';
    const stockText = item.stockText || item.text + ' Большая пачка — на несколько недель.';

    return {
        id: item.id,
        category: item.category,
        name: item.name,
        lead: item.text,
        stockText: stockText,
        text: isHeavy ? stockText : item.text,
        image: item.image,
        alt: item.alt,
        size: size,
        price: packPrices[size],
        brew: item.category === 'aroma' ? 'cup' : 'teapot'
    };
}

const blendItems = [
    {
        id: 'blend-morning',
        category: 'blends',
        name: 'Спокойное утро',
        text: 'Лист вишни, лист винограда, мята, чабрец и ромашка.',
        image: 'assets/images/blend-morning.png',
        alt: 'Сбор «Спокойное утро»: листья вишни и винограда, мята, чабрец и ромашка'
    },
    {
        id: 'blend-stomach',
        category: 'blends',
        name: 'Желудочный комфорт',
        text: 'Лист чёрной смородины, ягоды чёрной смородины, душица, чабрец и мята.',
        image: 'assets/images/blend-stomach.png',
        alt: 'Сбор «Желудочный комфорт»: лист и ягоды чёрной смородины, душица, чабрец и мята'
    },
    {
        id: 'blend-cold',
        category: 'blends',
        name: 'Простуда-стоп!',
        text: 'Лист малины, лист облепихи, эхинацея, душица и чабрец.',
        image: 'assets/images/blend-cold.png',
        alt: 'Сбор «Простуда-стоп!»: лист малины, лист облепихи, эхинацея, душица и чабрец'
    },
    {
        id: 'blend-summer',
        category: 'blends',
        name: 'Летнее настроение',
        text: 'Лист чёрной смородины, лист вишни, ягоды чёрной смородины, лаванда и ромашка.',
        image: 'assets/images/blend-summer.png',
        alt: 'Сбор «Летнее настроение»: лист смородины, лист вишни, ягоды смородины, лаванда и ромашка'
    },
    {
        id: 'blend-garden-silence',
        category: 'blends',
        name: 'Садовая тишина',
        text: 'Лист винограда, ромашка и мята.',
        image: 'assets/images/blend-garden-silence.png',
        alt: 'Сбор «Садовая тишина»: листья винограда, ромашка и мята'
    },
    {
        id: 'blend-garden-shield',
        category: 'blends',
        name: 'Щит сада',
        text: 'Лист винограда, эхинацея и лаванда.',
        image: 'assets/images/blend-garden-shield.png',
        alt: 'Сбор «Щит сада»: листья винограда, эхинацея и лаванда'
    },
    {
        id: 'blend-cherry-evening',
        category: 'blends',
        name: 'Вишнёвый вечер',
        text: 'Лист вишни, ромашка и лаванда.',
        image: 'assets/images/blend-cherry-evening.png',
        alt: 'Сбор «Вишнёвый вечер»: листья вишни, ромашка и лаванда'
    },
    {
        id: 'blend-warm-slope',
        category: 'blends',
        name: 'Тёплый склон',
        text: 'Лист вишни, чабрец и мята.',
        image: 'assets/images/blend-warm-slope.png',
        alt: 'Сбор «Тёплый склон»: листья вишни, чабрец и мята'
    },
    {
        id: 'blend-double-currant',
        category: 'blends',
        name: 'Смородина вдвойне',
        text: 'Лист чёрной смородины, ягоды чёрной смородины и душица.',
        image: 'assets/images/blend-double-currant.png',
        alt: 'Сбор «Смородина вдвойне»: лист и ягоды смородины с душицей'
    },
    {
        id: 'blend-amber-garden',
        category: 'blends',
        name: 'Янтарный сад',
        text: 'Лист чёрной смородины, лист облепихи и мята.',
        image: 'assets/images/blend-amber-garden.png',
        alt: 'Сбор «Янтарный сад»: лист смородины, лист облепихи и мята'
    },
    {
        id: 'blend-raspberry-shield',
        category: 'blends',
        name: 'Малиновый щит',
        text: 'Лист малины, эхинацея и лаванда.',
        image: 'assets/images/blend-raspberry-shield.png',
        alt: 'Сбор «Малиновый щит»: лист малины, эхинацея и лаванда'
    },
    {
        id: 'blend-berry-rest',
        category: 'blends',
        name: 'Ягодный покой',
        text: 'Лист малины, ромашка и ягоды чёрной смородины.',
        image: 'assets/images/blend-berry-rest.png',
        alt: 'Сбор «Ягодный покой»: лист малины, ромашка и ягоды смородины'
    },
    {
        id: 'blend-field-bouquet',
        category: 'blends',
        name: 'Полевой букет',
        text: 'Лист винограда, душица и лаванда.',
        image: 'assets/images/blend-field-bouquet.png',
        alt: 'Сбор «Полевой букет»: лист винограда, душица и лаванда'
    },
    {
        id: 'blend-sunny-cherry',
        category: 'blends',
        name: 'Солнечная вишня',
        text: 'Лист вишни, лист облепихи и ягоды чёрной смородины.',
        image: 'assets/images/blend-sunny-cherry.png',
        alt: 'Сбор «Солнечная вишня»: лист вишни, лист облепихи и ягоды смородины'
    }
];

const herbItems = [
    {
        id: 'grape',
        category: 'base',
        name: 'Листья винограда',
        text: 'База сбора. Две части на чайник — мягкая терпкая основа.',
        stockText: 'База на запас. Мягкой терпкой основы хватит на несколько недель.',
        image: 'assets/images/grape-leaves.png',
        alt: 'Свежие и сушёные листья винограда'
    },
    {
        id: 'cherry',
        category: 'base',
        name: 'Листья вишни',
        text: 'База сбора. Две части дают тёплый фруктовый тон.',
        stockText: 'База на запас. Тёплого фруктового тона хватит на много заварок.',
        image: 'assets/images/cherry-leaves.png',
        alt: 'Свежие и сушёные листья вишни'
    },
    {
        id: 'currant-leaf',
        category: 'base',
        name: 'Листья смородины',
        text: 'База сбора. Две части — насыщенный садовый вкус.',
        stockText: 'База на запас. Насыщенный садовый вкус в большой пачке.',
        image: 'assets/images/currant-leaves.png',
        alt: 'Свежие и сушёные листья чёрной смородины'
    },
    {
        id: 'raspberry-leaf',
        category: 'base',
        name: 'Листья малины',
        text: 'База сбора. Две части мягкой ягодной основы.',
        stockText: 'База на запас. Мягкая ягодная основа на много чашек.',
        image: 'assets/images/raspberry-leaves.png',
        alt: 'Свежие и сушёные листья малины'
    },
    {
        id: 'chamomile',
        category: 'action',
        name: 'Ромашка',
        text: 'Целебная трава. Одна часть успокаивает и смягчает сбор.',
        stockText: 'Целебная трава на запас. Одна часть по-прежнему успокаивает сбор.',
        image: 'assets/images/chamomile.png',
        alt: 'Свежие и сушёные цветки ромашки'
    },
    {
        id: 'echinacea',
        category: 'action',
        name: 'Эхинацея',
        text: 'Целебная трава. Одна часть для поддержки иммунитета.',
        stockText: 'Целебная трава на запас. Для поддержки в сезон простуд.',
        image: 'assets/images/echinacea.png',
        alt: 'Свежие и сушёные цветки эхинацеи'
    },
    {
        id: 'seabuckthorn',
        category: 'action',
        name: 'Облепиха',
        text: 'Целебная ягода. Одна часть даёт витаминную яркость.',
        stockText: 'Целебная ягода на запас. Витаминная яркость облепихи на много чашек.',
        image: 'assets/images/seabuckthorn-leaves.png',
        alt: 'Свежие и сушёные листья облепихи'
    },
    {
        id: 'oregano',
        category: 'action',
        name: 'Душица',
        text: 'Целебная трава. Одна часть согревает и помогает дыханию.',
        stockText: 'Целебная трава на запас. Тёплая душица для дыхания — на много заварок.',
        image: 'assets/images/oregano.png',
        alt: 'Свежая и сушёная душица'
    },
    {
        id: 'thyme',
        category: 'action',
        name: 'Чабрец',
        text: 'Целебная трава. Одна часть задаёт сильный согревающий вкус.',
        stockText: 'Целебная трава на запас. Согревающий чабрец, одна часть на чайник.',
        image: 'assets/images/thyme.png',
        alt: 'Свежий и сушёный чабрец'
    },
    {
        id: 'mint',
        category: 'aroma',
        name: 'Мята',
        text: 'Аромат. Только щепотка — иначе перебьёт всю базу.',
        stockText: 'Аромат на запас. На чайник всё равно только щепотка мяты.',
        image: 'assets/images/mint.png',
        alt: 'Свежая и сушёная мята'
    },
    {
        id: 'lavender',
        category: 'aroma',
        name: 'Лаванда',
        text: 'Аромат Hidcote. Щепотка цветочного покоя на чайник.',
        stockText: 'Аромат Hidcote на запас. Больше щепотки на чайник не нужно.',
        image: 'assets/images/lavender.png',
        alt: 'Свежая и сушёная лаванда'
    },
    {
        id: 'currant-berry',
        category: 'aroma',
        name: 'Ягоды смородины',
        text: 'Аромат. Щепотка сухих ягод в финале сбора.',
        stockText: 'Аромат на запас. Щепотка сухих ягод в финале каждого сбора.',
        image: 'assets/images/currant-berries.png',
        alt: 'Свежие и сушёные ягоды чёрной смородины'
    }
];

function packsOf(items, size) {
    return items.map(function (item) {
        return catalogProduct(item, size);
    });
}

const catalogProducts = packsOf(blendItems, '50').concat(
    packsOf(herbItems, '50'),
    packsOf(herbItems, '100')
);

const productModal = document.getElementById('product-modal');

if (productModal) {
    const modalImage = document.getElementById('modal-image');
    const modalEyebrow = document.getElementById('modal-eyebrow');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalBrewText = document.getElementById('modal-brew-text');
    const modalPrice = document.getElementById('modal-price');
    const categoryLabels = {
        blends: 'Купаж',
        base: 'База',
        action: 'Действие',
        aroma: 'Аромат'
    };
    const brewNotes = {
        cup: {
            aroma: { text: 'Щепотка на чашку 200 мл, настаивать 5 минут.', tail: 'хватит на много чашек' },
            action: { text: 'Половина чайной ложки на чашку 200 мл, 7–8 минут.', per: 1.5, unit: 'чашек' },
            base: { text: 'Чайная ложка на чашку 200 мл, 6–7 минут.', per: 2, unit: 'чашек' },
            blends: { text: '1–0,5 чайной ложки сбора на чашку 200 мл, 6–8 минут.', per: 2, unit: 'чашек' }
        },
        teapot: {
            aroma: { text: 'Только щепотка на чайник, иначе аромат перебьёт базу.', tail: 'хватит надолго' },
            action: { text: 'Одна часть, около 2 г на чайник 500 мл, 8 минут.', per: 2, unit: 'заварок' },
            base: { text: 'Две части, около 4 г на чайник 500 мл, 7 минут.', per: 4, unit: 'заварок' },
            blends: { text: '1–2 чайные ложки сбора на чайник 500 мл, 7–10 минут.', per: 5, unit: 'заварок' }
        }
    };
    const choiceButtons = productModal.querySelectorAll('[data-weight], [data-brew]');
    const closeButton = productModal.querySelector('.modal-close');
    let activeProduct = null;
    let modalTrigger = null;
    let modalScrollY = 0;
    let selectedWeight = '50';
    let selectedBrew = 'teapot';

    function brewNote() {
        const amount = selectedWeight === '100' ? 100 : 50;
        const note = brewNotes[selectedBrew][activeProduct.category] || brewNotes[selectedBrew].blends;
        const tail = note.tail || 'хватит примерно на ' + Math.max(1, Math.round(amount / note.per)) + ' ' + note.unit;
        return note.text + ' Пачки ' + amount + ' г ' + tail + '.';
    }

    function updateModalDetails() {
        const heavy = selectedWeight === '100';
        modalText.textContent = heavy ? activeProduct.stockText : activeProduct.lead;
        modalBrewText.textContent = brewNote();
        modalPrice.textContent = packPrices[selectedWeight] + ' BYN';
        choiceButtons.forEach(function (button) {
            const isOn = button.dataset.weight
                ? button.dataset.weight === selectedWeight
                : button.dataset.brew === selectedBrew;
            button.classList.toggle('is-active', isOn);
            button.setAttribute('aria-pressed', String(isOn));
        });
    }

    function lockScroll() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        modalScrollY = window.scrollY;
        document.body.style.top = '-' + modalScrollY + 'px';
        document.body.style.paddingRight = scrollbarWidth > 0 ? scrollbarWidth + 'px' : '';
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
    }

    function unlockScroll() {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        document.body.style.paddingRight = '';
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, modalScrollY);
        document.documentElement.style.scrollBehavior = '';
    }

    openProductModal = function (product, trigger) {
        activeProduct = product;
        modalTrigger = trigger || null;
        selectedWeight = product.size;
        selectedBrew = product.brew;
        modalImage.src = product.image;
        modalImage.alt = product.alt;
        modalEyebrow.textContent = categoryLabels[product.category] || 'Каталог';
        modalTitle.textContent = product.name;
        updateModalDetails();
        lockScroll();
        productModal.hidden = false;
        closeButton.focus({ preventScroll: true });
    };

    closeProductModal = function () {
        if (productModal.hidden) {
            return false;
        }
        productModal.hidden = true;
        unlockScroll();
        if (modalTrigger && modalTrigger.isConnected) {
            modalTrigger.focus({ preventScroll: true });
        }
        modalTrigger = null;
        return true;
    };

    productModal.querySelector('.modal-backdrop').addEventListener('click', closeProductModal);
    closeButton.addEventListener('click', closeProductModal);

    productModal.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') {
            return;
        }
        const focusable = productModal.querySelectorAll('button:not([disabled])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    productModal.querySelector('.modal-options').addEventListener('click', function (event) {
        const button = event.target.closest('[data-weight], [data-brew]');
        if (!button || !activeProduct) {
            return;
        }
        if (button.dataset.weight) {
            selectedWeight = button.dataset.weight;
        } else {
            selectedBrew = button.dataset.brew;
        }
        updateModalDetails();
    });
}

function createProductCard(product) {
    const card = createElement('article', 'product-card');

    const img = createElement('img');
    img.src = product.image;
    img.alt = product.alt;
    img.loading = 'lazy';
    img.decoding = 'async';

    const body = createElement('div', 'product-card-body');
    const meta = createElement('div', 'product-card-meta');
    meta.appendChild(createElement('span', 'product-card-weight', product.size + ' г'));
    meta.appendChild(createElement('span', 'product-card-price', product.price + ' BYN'));

    const button = createElement('button', 'btn btn-primary product-card-cart', 'Подробнее');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');

    body.appendChild(createElement('h3', '', product.name));
    body.appendChild(createElement('p', '', product.text));
    body.appendChild(meta);
    body.appendChild(button);
    card.appendChild(img);
    card.appendChild(body);
    return card;
}
const catalog = document.querySelector('.catalog');
const grid = catalog && catalog.querySelector('.catalog-grid');
if (grid) {
    const tabs = catalog.querySelectorAll('.catalog-tab');
    const moreButton = catalog.querySelector('.catalog-more');
    const pageSize = 8;
    const productsByCategory = {};
    const cardProducts = new WeakMap();
    let activeCategory = 'blends';
    let visibleCount = 0;

    catalogProducts.forEach(function (product) {
        (productsByCategory[product.category] = productsByCategory[product.category] || []).push(product);
    });

    function renderCatalog(reset) {
        const products = productsByCategory[activeCategory] || [];
        const fragment = document.createDocumentFragment();
        if (reset) {
            visibleCount = 0;
            grid.replaceChildren();
        }
        products.slice(visibleCount, visibleCount + pageSize).forEach(function (product) {
            const card = createProductCard(product);
            cardProducts.set(card, product);
            fragment.appendChild(card);
        });

        const firstNewButton = fragment.querySelector('.product-card-cart');
        grid.appendChild(fragment);
        visibleCount = Math.min(visibleCount + pageSize, products.length);
        if (moreButton) {
            const hasMore = visibleCount < products.length;
            moreButton.hidden = !hasMore;
            moreButton.textContent = 'Показать ещё ' + Math.min(pageSize, products.length - visibleCount);
        }
        return firstNewButton;
    }

    grid.addEventListener('click', function (event) {
        const card = event.target.closest('.product-card');
        if (card && cardProducts.has(card)) {
            openProductModal(cardProducts.get(card), card.querySelector('.product-card-cart'));
        }
    });

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            if (tab.dataset.category === activeCategory) {
                return;
            }
            activeCategory = tab.dataset.category;
            tabs.forEach(function (item) {
                const isActive = item === tab;
                item.classList.toggle('is-active', isActive);
                item.setAttribute('aria-pressed', String(isActive));
            });
            renderCatalog(true);
        });
    });

    if (moreButton) {
        moreButton.addEventListener('click', function () {
            const firstNewButton = renderCatalog(false);
            if (moreButton.hidden && firstNewButton) {
                firstNewButton.focus();
            }
        });
    }
    renderCatalog(true);
}
