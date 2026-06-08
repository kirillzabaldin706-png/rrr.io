import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, setDoc, getDoc, getDocs, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTFlu-JMdXx2oICi4dDANWdMtWJW8zNJ8",
  authDomain: "home-cooking52.firebaseapp.com",
  projectId: "home-cooking52",
  storageBucket: "home-cooking52.firebasestorage.app",
  messagingSenderId: "635298788932",
  appId: "1:635298788932:web:62d03ae8c22c70a5756e11",
  measurementId: "G-FS1W2B7C23"
};

let db = null;
let ready = false;
try {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  ready = true;
} catch (e) {
  console.warn("Firebase error:", e.message);
}

export const isReady = () => ready;

export async function saveOrder(data) {
  if (!ready) throw new Error("Firebase не настроен");
  return addDoc(collection(db, "orders"), { ...data, status: "new", createdAt: serverTimestamp() });
}

export function listenOrders(cb) {
  if (!ready) return;
  return onSnapshot(collection(db, "orders"), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function deleteOrder(id) {
  if (!ready) return;
  await deleteDoc(doc(db, "orders", id));
}

export async function saveBooking(data) {
  if (!ready) throw new Error("Firebase не настроен");
  return addDoc(collection(db, "bookings"), { ...data, status: "new", createdAt: serverTimestamp() });
}

export function listenBookings(cb) {
  if (!ready) return;
  return onSnapshot(collection(db, "bookings"), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function deleteBooking(id) {
  if (!ready) return;
  await deleteDoc(doc(db, "bookings", id));
}

export async function saveMenuToCloud(menuData) {
  if (!ready) return;
  await setDoc(doc(db, "menu", "main"), {
    categories: menuData.categories,
    items: menuData.items,
    updatedAt: serverTimestamp()
  });
  localStorage.setItem("toni_menu", JSON.stringify(menuData));
}

export async function getMenuFromCloud() {
  if (!ready) return null;
  try {
    const snap = await getDoc(doc(db, "menu", "main"));
    if (snap.exists()) {
      const d = snap.data();
      const menu = { categories: d.categories, items: d.items };
      localStorage.setItem("toni_menu", JSON.stringify(menu));
      return menu;
    }
  } catch (e) {
    console.warn("menu load error", e);
  }
  const s = localStorage.getItem("toni_menu");
  return s ? JSON.parse(s) : null;
}

export function listenMenu(cb) {
  if (!ready) return;
  return onSnapshot(doc(db, "menu", "main"), snap => {
    if (snap.exists()) {
      const d = snap.data();
      const menu = { categories: d.categories, items: d.items };
      localStorage.setItem("toni_menu", JSON.stringify(menu));
      cb(menu);
    }
  });
}

const ADMIN_DOC = "admin_toni";
const DEFAULT_ADMIN_HASH = "cbe466bd3a800a88b631b83fbb20501ad3398acfe000db9bafa3faef289f6156";

export async function savePassword(hash) {
  if (!ready) return;
  await setDoc(doc(db, "settings", ADMIN_DOC), { passwordHash: hash, updatedAt: serverTimestamp() });
}

export async function loadPassword() {
  if (!ready) return null;
  try {
    const snap = await getDoc(doc(db, "settings", ADMIN_DOC));
    if (snap.exists()) return snap.data().passwordHash;
    await setDoc(doc(db, "settings", ADMIN_DOC), {
      passwordHash: DEFAULT_ADMIN_HASH,
      updatedAt: serverTimestamp()
    });
    return DEFAULT_ADMIN_HASH;
  } catch (e) {
    return null;
  }
}

const IMGBB_KEY = "7211b469b211fbe8eddf7285042eb17d";
export async function uploadPhoto(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("https://api.imgbb.com/1/upload?key=" + IMGBB_KEY, { method: "POST", body: fd });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || "Ошибка загрузки");
  return json.data.url;
}