let cart = {};

function addToCart(name, price) {
    if (cart[name]) {
        cart[name].quantity += 1;
    } else {
        cart[name] = { price: price, quantity: 1 };
    }
    updateCartUI();
}

function removeFromCart(name) {
    if (cart[name]) {
        cart[name].quantity -= 1;
        if (cart[name].quantity <= 0) {
            delete cart[name];
        }
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItemsList = document.getElementById("cartItems");
    cartItemsList.innerHTML = "";
    let total = 0;

    for (let name in cart) {
        const item = cart[name];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const li = document.createElement("li");
        li.innerHTML = `
            ${name} — ${item.price.toLocaleString()} ×
            <span class="quantity">${item.quantity}</span>
            = ${itemTotal.toLocaleString()} сум
        `;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        removeBtn.className = "remove-btn";
        removeBtn.onclick = () => removeFromCart(name);

        li.appendChild(removeBtn);
        cartItemsList.appendChild(li);
    }

    document.getElementById("total").textContent = total.toLocaleString();
}

/* ===== Хранилище "заказов" (регистраций) для админ-панели ===== */
const ORDERS_KEY = "orders";
const ADMIN_PASSWORD = "957";

function getOrders() {
    try {
        return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveOrder(order) {
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getCurrentUserData() {
    try {
        return JSON.parse(localStorage.getItem("userData")) || null;
    } catch (e) {
        return null;
    }
}

function isSameDay(dateStringA, dateStringB) {
    const a = new Date(dateStringA);
    const b = new Date(dateStringB);
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}

// Удаляет заказы, которые были сделаны не сегодня — панель "Заказы" каждый день обновляется заново
function cleanOldOrders() {
    const now = new Date().toISOString();
    const orders = getOrders();
    const freshOrders = orders.filter((order) => order.date && isSameDay(order.date, now));

    if (freshOrders.length !== orders.length) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(freshOrders));
    }
}

function formatOrderTime(dateString) {
    try {
        const d = new Date(dateString);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    } catch (e) {
        return "";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Удаляем заказы прошлых дней при каждом открытии сайта
    cleanOldOrders();

    const footerBottom = document.querySelector(".footer-bottom p");
    if (footerBottom) {
        const currentYear = new Date().getFullYear();
        footerBottom.innerHTML = `&copy; ${currentYear} Чистый Дом. Барча ҳуқуқлар ҳимояланган.`;
    }

    // ===== Мобильное бургер-меню =====
    const burgerBtn = document.getElementById("burgerBtn");
    const navMenu = document.getElementById("navMenu");
    const navOverlay = document.getElementById("navOverlay");

    function openMenu() {
        navMenu.classList.add("open");
        burgerBtn.classList.add("open");
        navOverlay.classList.add("show");
        burgerBtn.setAttribute("aria-expanded", "true");
        document.body.classList.add("menu-open");
    }

    function closeMenu() {
        navMenu.classList.remove("open");
        burgerBtn.classList.remove("open");
        navOverlay.classList.remove("show");
        burgerBtn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
    }

    if (burgerBtn && navMenu && navOverlay) {
        burgerBtn.addEventListener("click", () => {
            if (navMenu.classList.contains("open")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        navOverlay.addEventListener("click", closeMenu);
    }

    const navLinks = document.querySelectorAll(".poyiskavik a, .footer-links a, .footer-links1 a");
    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href");
            if (targetId && targetId.startsWith("#") && targetId.length > 1) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: "smooth" });
                }
            }
            closeMenu();
        });
    });

    // Закрыть меню при увеличении окна обратно до десктопа
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });

    // ===== Регистрационное окно при первом входе =====
    const REG_STORAGE_KEY = "siteRegistered";
    const regOverlay = document.getElementById("regOverlay");
    const regForm = document.getElementById("regForm");
    const regFormStep = document.getElementById("regFormStep");
    const regSuccessStep = document.getElementById("regSuccessStep");

    if (regOverlay && regForm) {
        const alreadyRegistered = localStorage.getItem(REG_STORAGE_KEY);
        if (!alreadyRegistered) {
            regOverlay.classList.add("active");
        }

        function validateRegField(inputEl, fieldEl, checkFn) {
            const valid = checkFn(inputEl.value.trim());
            if (valid) {
                inputEl.classList.remove("invalid");
                fieldEl.classList.remove("has-error");
            } else {
                inputEl.classList.add("invalid");
                fieldEl.classList.add("has-error");
            }
            return valid;
        }

        regForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("regName");
            const phoneInput = document.getElementById("regPhone");
            const addressInput = document.getElementById("regAddress");

            const nameValid = validateRegField(nameInput, document.getElementById("regNameField"), v => v.length >= 2);
            const phoneValid = validateRegField(phoneInput, document.getElementById("regPhoneField"), v => /^[+0-9\s\-()]{7,20}$/.test(v));
            const addressValid = validateRegField(addressInput, document.getElementById("regAddressField"), v => v.length >= 5);

            if (!nameValid || !phoneValid || !addressValid) return;

            const userData = {
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                address: addressInput.value.trim(),
                date: new Date().toISOString()
            };

            // Сохраняем данные (в реальном проекте здесь можно отправить запрос на сервер)
            localStorage.setItem(REG_STORAGE_KEY, "true");
            localStorage.setItem("userData", JSON.stringify(userData));

            // Также добавляем эту регистрацию в общий список "заказов" для админ-панели
            saveOrder(userData);

            regFormStep.style.display = "none";
            regSuccessStep.style.display = "block";

            setTimeout(() => {
                regOverlay.classList.remove("active");
            }, 1500);
        });
    }

    // ===== Кнопка "Выйти из аккаунта" =====
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem(REG_STORAGE_KEY);
            localStorage.removeItem("userData");
            window.location.reload();
        });
    }

    // ===== Админ-панель =====
    const adminBtns = document.querySelectorAll(".admin-trigger");
    const adminOverlay = document.getElementById("adminOverlay");
    const adminPassStep = document.getElementById("adminPassStep");
    const adminOrdersStep = document.getElementById("adminOrdersStep");
    const adminPassInput = document.getElementById("adminPassInput");
    const adminPassField = document.getElementById("adminPassField");
    const adminPassSubmit = document.getElementById("adminPassSubmit");
    const adminPassCancel = document.getElementById("adminPassCancel");
    const adminCloseBtn = document.getElementById("adminCloseBtn");
    const adminOrdersList = document.getElementById("adminOrdersList");

    function resetAdminModal() {
        adminPassInput.value = "";
        adminPassInput.classList.remove("invalid");
        adminPassField.classList.remove("has-error");
        adminPassStep.style.display = "block";
        adminOrdersStep.style.display = "none";
    }

    function openAdminOverlay() {
        resetAdminModal();
        adminOverlay.classList.add("active");
        adminPassInput.focus();
    }

    function closeAdminOverlay() {
        adminOverlay.classList.remove("active");
    }

    function renderOrders() {
        cleanOldOrders();
        const orders = getOrders();
        adminOrdersList.innerHTML = "";

        if (orders.length === 0) {
            adminOrdersList.innerHTML = `<p class="order-empty">Заказов пока нет</p>`;
            return;
        }

        orders.forEach((order) => {
            const card = document.createElement("div");
            card.className = "order-card";

            let itemsHtml = "";
            if (order.items && order.items.length > 0) {
                const itemsList = order.items.map((item, i) => `
                    <div class="order-item">
                        <div class="oi-name">${i + 1}. ${escapeHtml(item.name)}</div>
                        <div class="oi-calc">
                            <span>${item.quantity} × ${item.price.toLocaleString()}</span>
                            <strong>${(item.price * item.quantity).toLocaleString()} сум</strong>
                        </div>
                    </div>
                `).join("");
                itemsHtml = `
                    <div class="order-products">
                        <p><strong>Товары (${order.items.length}):</strong></p>
                        <div class="order-items">${itemsList}</div>
                    </div>
                    <div class="order-total">
                        <span>Итого</span>
                        <strong>${order.total.toLocaleString()} сум</strong>
                    </div>
                `;
            }

            card.innerHTML = `
                <p><strong>Имя:</strong> ${order.name}</p>
                <p><strong>Телефон номер:</strong> ${order.phone}</p>
                <p><strong>Адрис:</strong> ${order.address}</p>
                ${itemsHtml}
            `;
            adminOrdersList.appendChild(card);

            if (order.date) {
                const time = document.createElement("div");
                time.style.textAlign = "right";
                time.style.fontSize = "12px";
                time.style.color = "#8a6b6d";
                time.style.margin = "-12px 4px 12px 0";
                time.textContent = formatOrderTime(order.date);
                adminOrdersList.appendChild(time);
            }
        });
    }

    function checkAdminPassword() {
        const value = adminPassInput.value.trim();
        if (value === ADMIN_PASSWORD) {
            adminPassStep.style.display = "none";
            adminOrdersStep.style.display = "block";
            renderOrders();
        } else {
            adminPassInput.classList.add("invalid");
            adminPassField.classList.add("has-error");
        }
    }

    if (adminBtns.length > 0 && adminOverlay) {
        adminBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                openAdminOverlay();
                closeMenu();
            });
        });

        adminPassSubmit.addEventListener("click", checkAdminPassword);

        adminPassInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                checkAdminPassword();
            }
        });

        adminPassCancel.addEventListener("click", closeAdminOverlay);
        adminCloseBtn.addEventListener("click", closeAdminOverlay);

        adminOverlay.addEventListener("click", (e) => {
            if (e.target === adminOverlay) closeAdminOverlay();
        });
    }

    // ===== Кнопка "Купить" в тележке =====
    const buyBtn = document.getElementById("buyBtn");
    const buyMessage = document.getElementById("buyMessage");

    if (buyBtn) {
        buyBtn.addEventListener("click", () => {
            const cartKeys = Object.keys(cart);

            if (cartKeys.length === 0) {
                buyMessage.textContent = "Тележка пуста — добавьте товары перед покупкой";
                buyMessage.className = "buy-message error";
                buyMessage.style.display = "block";
                return;
            }

            const user = getCurrentUserData();
            const items = cartKeys.map((name) => ({
                name: name,
                price: cart[name].price,
                quantity: cart[name].quantity
            }));
            const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            const order = {
                name: user ? user.name : "Гость",
                phone: user ? user.phone : "",
                address: user ? user.address : "",
                items: items,
                total: total,
                date: new Date().toISOString()
            };

            saveOrder(order);

            // Очищаем тележку после покупки
            cart = {};
            updateCartUI();

            buyMessage.textContent = "Заказ оформлен! Спасибо за покупку.";
            buyMessage.className = "buy-message";
            buyMessage.style.display = "block";

            setTimeout(() => {
                buyMessage.style.display = "none";
            }, 4000);
        });
    }
});


/* ===== extras.js — подключать ПОСЛЕ app.js ===== */

// ---------- НАСТРОЙКИ ----------
// Ваш username в Telegram БЕЗ @ (например "chistydom_uz"). Пусто = кнопки Telegram скрыты.
const TELEGRAM_USERNAME = "";

// Слайды баннера — меняйте тексты как хотите
const BANNER_SLIDES = [
    { title: "Чистый Дом", text: "Всё для чистоты дома и офиса в одном месте" },
    { title: "Более 80 товаров", text: "Гели, мыло, губки, салфетки, перчатки и многое другое" },
    { title: "Есть вопросы?", text: "Звоните: +998 (97) 709-37-73" }
];

const CART_STORAGE_KEY = "cartData";

// ---------- Вспомогательные ----------
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

let toastEl, toastTimer;
function showToast(message) {
    if (!toastEl) {
        toastEl = el("div", "toast");
        document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function cartCount() {
    let n = 0;
    for (const name in cart) n += cart[name].quantity;
    return n;
}

// ---------- Защита: экранируем данные заказа перед сохранением ----------
// (админ-панель выводит их через innerHTML, поэтому HTML в имени/адресе не должен работать)
const _origSaveOrder = window.saveOrder;
window.saveOrder = function (order) {
    ["name", "phone", "address"].forEach((k) => {
        if (typeof order[k] === "string") order[k] = escapeHtml(order[k]);
    });
    _origSaveOrder(order);
};

// ---------- Корзина: + / −, сохранение, значок ----------
window.changeQty = function (name, delta) {
    if (!cart[name]) return;
    cart[name].quantity += delta;
    if (cart[name].quantity <= 0) delete cart[name];
    updateCartUI();
};

window.updateCartUI = function () {
    const list = document.getElementById("cartItems");
    list.innerHTML = "";
    let total = 0;

    for (const name in cart) {
        const item = cart[name];
        const sum = item.price * item.quantity;
        total += sum;

        const li = document.createElement("li");
        li.appendChild(el("span", "ci-name", name));

        const controls = el("div", "ci-controls");
        const minus = el("button", "qty-btn", "−");
        minus.setAttribute("aria-label", "Уменьшить");
        minus.onclick = () => changeQty(name, -1);
        const qty = el("span", "quantity", String(item.quantity));
        const plus = el("button", "qty-btn", "+");
        plus.setAttribute("aria-label", "Увеличить");
        plus.onclick = () => changeQty(name, 1);
        controls.append(minus, qty, plus);

        li.appendChild(controls);
        li.appendChild(el("span", "ci-sum", `${item.price.toLocaleString()} × ${item.quantity} = ${sum.toLocaleString()} сум`));

        const del = el("button", "remove-btn", "✕");
        del.setAttribute("aria-label", "Удалить товар");
        del.onclick = () => { delete cart[name]; updateCartUI(); };
        li.appendChild(del);

        list.appendChild(li);
    }

    document.getElementById("total").textContent = total.toLocaleString();

    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}

    const badge = document.getElementById("fabBadge");
    if (badge) {
        const n = cartCount();
        badge.textContent = n;
        badge.style.display = n > 0 ? "flex" : "none";
    }
};

const _origAddToCart = window.addToCart;
window.addToCart = function (name, price) {
    _origAddToCart(name, price);
    showToast("Добавлено в корзину: " + name.trim());
    const badge = document.getElementById("fabBadge");
    if (badge) {
        badge.classList.remove("bump");
        void badge.offsetWidth; // перезапуск анимации
        badge.classList.add("bump");
    }
};

// ---------- Всё остальное — после загрузки страницы ----------
document.addEventListener("DOMContentLoaded", () => {

    // Восстановить корзину после обновления страницы
    try {
        const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
        if (saved && typeof saved === "object") {
            for (const name in saved) {
                const it = saved[name];
                if (it && Number(it.price) > 0 && Number(it.quantity) > 0) {
                    cart[name] = { price: Number(it.price), quantity: Number(it.quantity) };
                }
            }
        }
    } catch (e) {}

    // Картинки: ленивая загрузка + серая заглушка
    document.querySelectorAll(".product img").forEach((img) => {
        img.loading = "lazy";
        img.decoding = "async";
        if (!img.complete) {
            img.classList.add("img-loading");
            const done = () => img.classList.remove("img-loading");
            img.addEventListener("load", done);
            img.addEventListener("error", done);
        }
    });

    // Баннер
    const firstSection = document.getElementById("home1");
    const banner = el("div", "hero-banner");
    const dots = el("div", "hero-dots");
    BANNER_SLIDES.forEach((s, i) => {
        const slide = el("div", "hero-slide" + (i === 0 ? " active" : ""));
        slide.append(el("h2", "", s.title), el("p", "", s.text));
        banner.appendChild(slide);
        const dot = el("button", i === 0 ? "active" : "");
        dot.setAttribute("aria-label", "Слайд " + (i + 1));
        dot.onclick = () => { show(i); restart(); };
        dots.appendChild(dot);
    });
    banner.appendChild(dots);

    let current = 0, timer;
    function show(i) {
        current = i;
        banner.querySelectorAll(".hero-slide").forEach((n, k) => n.classList.toggle("active", k === i));
        dots.querySelectorAll("button").forEach((n, k) => n.classList.toggle("active", k === i));
    }
    function restart() {
        clearInterval(timer);
        timer = setInterval(() => show((current + 1) % BANNER_SLIDES.length), 5000);
    }
    restart();

    firstSection.before(banner);

    // Плавающие кнопки
    const fabCart = el("button", "fab fab-cart", "🛒");
    fabCart.setAttribute("aria-label", "Открыть корзину");
    const badge = el("span", "fab-badge", "0");
    badge.id = "fabBadge";
    badge.style.display = "none";
    fabCart.appendChild(badge);
    fabCart.onclick = () => document.getElementById("cart").scrollIntoView({ behavior: "smooth" });

    const fabTop = el("button", "fab fab-top", "↑");
    fabTop.setAttribute("aria-label", "Наверх");
    fabTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

    document.body.append(fabCart, fabTop);

    if (TELEGRAM_USERNAME) {
        const fabTg = el("a", "fab fab-tg", "✈");
        fabTg.href = "https://t.me/" + TELEGRAM_USERNAME;
        fabTg.target = "_blank";
        fabTg.rel = "noopener";
        fabTg.setAttribute("aria-label", "Написать в Telegram");
        document.body.appendChild(fabTg);
    }

    window.addEventListener("scroll", () => {
        fabTop.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });

    // Корзина: заказ в Telegram
    const buyBtn = document.getElementById("buyBtn");

    if (TELEGRAM_USERNAME) {
        const tgBtn = el("button", "tg-order-btn", "Заказать через Telegram");
        tgBtn.type = "button";
        buyBtn.after(tgBtn);

        tgBtn.addEventListener("click", () => {
            const keys = Object.keys(cart);
            if (keys.length === 0) {
                showToast("Корзина пуста");
                return;
            }
            const user = getCurrentUserData() || {};
            let total = 0;
            const lines = keys.map((name, i) => {
                const it = cart[name];
                const sum = it.price * it.quantity;
                total += sum;
                return `${i + 1}. ${name.trim()} × ${it.quantity} = ${sum.toLocaleString()} сум`;
            });
            const text = [
                "Заказ — Чистый Дом",
                `Имя: ${user.name || "—"}`,
                `Телефон: ${user.phone || "—"}`,
                `Адрес: ${user.address || "—"}`,
                "",
                ...lines,
                "",
                `Итого: ${total.toLocaleString()} сум`
            ].filter((l, i, a) => l !== "" || (i > 0 && a[i - 1] !== "")).join("\n");

            buyBtn.click(); // сохраняет заказ и очищает корзину (логика из app.js)
            window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`, "_blank");
        });
    }

    updateCartUI();
});