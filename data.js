const MENU_DATA_KEY = "toni_menu";
const CART_KEY = "toni_cart";

const DEFAULT_MENU = {
  categories: [
    { id: "breakfast", name: "Завтраки", emoji: "🌅" },
    { id: "lunch", name: "Обеды", emoji: "🍲" },
    { id: "dinner", name: "Ужины", emoji: "🍽️" },
    { id: "desserts", name: "Десерты", emoji: "🍰" }
  ],
  items: [
    { id: 1, category: "breakfast", name: "Овсянка с ягодами и медом", desc: "Теплая овсянка с свежими ягодами, орехами и натуральным медом", price: 250, image: "images/w.jpg" },
    { id: 2, category: "breakfast", name: "Блины с творогом", desc: "Пышные блины с нежным творогом и сметаной", price: 280, image: "images/bliny.jpg" },
    { id: 3, category: "lunch", name: "Борщ по-домашнему", desc: "Настоящий борщ с говядиной, сметаной и чесночными пампушками", price: 320, image: "images/borsh.jpg" },
    { id: 4, category: "lunch", name: "Пельмени с говядиной", desc: "Домашние пельмени ручной лепки с сочной начинкой", price: 350, image: "images/pelmeni.jpg" },
    { id: 5, category: "dinner", name: "Пирог с мясом", desc: "Сытный домашний пирог с мясной начинкой", price: 380, image: "images/pirog.jpg" },
    { id: 6, category: "desserts", name: "Нью-Йорк чизкейк", desc: "Классический чизкейк с ягодным соусом", price: 290, image: "images/chizkek.jpg" }
  ]
};

function getMenu() {
  try {
    const stored = localStorage.getItem(MENU_DATA_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_MENU;
  } catch {
    return DEFAULT_MENU;
  }
}

async function saveMenu(menuData) {
  localStorage.setItem(MENU_DATA_KEY, JSON.stringify(menuData));
  try {
    const { saveMenuToCloud } = await import("./firebase-db.js");
    await saveMenuToCloud(menuData);
  } catch (e) {
    console.warn("Firebase saveMenu failed:", e);
  }
}

async function loadMenuFromCloud(onLoaded) {
  try {
    const { getMenuFromCloud, listenMenu, saveMenuToCloud } = await import("./firebase-db.js");
    const cloudMenu = await getMenuFromCloud();
    if (cloudMenu && cloudMenu.items && cloudMenu.items.length > 0) {
      localStorage.setItem(MENU_DATA_KEY, JSON.stringify(cloudMenu));
      if (onLoaded) onLoaded(cloudMenu);
    } else {
      await saveMenuToCloud(DEFAULT_MENU);
      if (onLoaded) onLoaded(DEFAULT_MENU);
    }
    listenMenu(menu => {
      localStorage.setItem(MENU_DATA_KEY, JSON.stringify(menu));
      if (onLoaded) onLoaded(menu);
    });
  } catch (e) {
    console.warn("Firebase not configured, using local menu:", e);
    if (onLoaded) onLoaded(getMenu());
  }
}

function getCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(itemId) {
  const menu = getMenu();
  const item = menu.items.find(i => i.id == itemId);
  if (!item) return;
  const cart = getCart();
  const existing = cart.find(c => c.id == itemId);
  if (existing) existing.qty += 1;
  else cart.push({ id: item.id, name: item.name, price: item.price, image: item.image || "", qty: 1 });
  saveCart(cart);
  showCartNotification(item.name);
}

function removeFromCart(itemId) {
  saveCart(getCart().filter(c => c.id != itemId));
}

function updateQty(itemId, delta) {
  const cart = getCart();
  const item = cart.find(c => c.id == itemId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll(".cart-badge, #cart-n, #hdr-count, #nav-cart-count").forEach(b => {
    b.textContent = count;
    if (b.classList.contains("cart-badge")) {
      b.style.display = count > 0 ? "flex" : "none";
    }
  });
}

function showCartNotification(name) {
  const existing = document.getElementById("cart-notify");
  if (existing) existing.remove();
  const n = document.createElement("div");
  n.id = "cart-notify";
  n.innerHTML = `✅ «${name}» добавлен в корзину`;
  n.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#e74c3c,#f39c12);color:white;padding:12px 24px;border-radius:25px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);font-family:Poppins,sans-serif";
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2500);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
