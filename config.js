// ============================================================
// НАСТРОЙКА: вставьте сюда URL вашего Google Apps Script Web App
// (получите его, следуя инструкции в README.md, раздел 1)
// ============================================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyMbPUeOtAJhGF8o2VPMFO4zu3Q3o3an6nFEL5X83NKw-xycMj8RJUcj5Z1W26_LxkAbQ/exec";

// ============================================================
// НАСТРОЙКА: Stripe Payment Links (оплата после регистрации)
// ============================================================
// Для каждого платного билета создайте отдельную Payment Link в Stripe
// (Dashboard → Payment Links → создать) и вставьте её URL сюда — ключ
// должен ТОЧНО совпадать со значением value= у соответствующего билета
// в index.html. Оставьте пустой строкой "", если ссылка ещё не готова —
// тогда кнопка оплаты на финальном экране просто не покажется для
// этого билета (регистрация всё равно пройдёт).
const TICKET_PAYMENT_LINKS = {
  "1-Day Delegate — €200": "",
  "1-Day Delegate + Gala Dinner — €260": "",
  "2-Day Delegate — €340": "",
  "2-Day Delegate + Gala Dinner — €400": "",
  "Online — €99": "",
  "Student — €100": "",
  "Industry Delegate + Gala Dinner — €600": "",
  "ScalprumPro Wet Lab — €2600": "",
};
