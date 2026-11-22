// Bộ ký tự dùng để tạo mật khẩu
const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?"
};

function randomInt(max) {
  const buf = new Uint32Array(1);
  let value;
  const limit = 0xFFFFFFFF - (0xFFFFFFFF % max);
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

function generatePassword(length, options) {
  let pool = "";
  const required = [];

  for (const key of ["lower", "upper", "digits", "symbols"]) {
    if (options[key]) {
      pool += CHARSETS[key];
      required.push(CHARSETS[key]);
    }
  }
  if (pool === "") throw new Error(I18N_ERROR_NO_TYPE);
  if (length < required.length) throw new Error("Độ dài quá ngắn");

  const chars = [];
  for (const set of required) {
    chars.push(set[randomInt(set.length)]);
  }
  while (chars.length < length) {
    chars.push(pool[randomInt(pool.length)]);
  }
  // Xáo trộn mảng để các ký tự bắt buộc không nằm cố định ở đầu
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const I18N_ERROR_NO_TYPE = "Phải chọn ít nhất một loại ký tự";

// Tính entropy và đánh giá độ mạnh mật khẩu
function estimateEntropy(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32;
  return pool ? pw.length * Math.log2(pool) : 0;
}

function evaluate(pw) {
  const common = ["123456", "password", "qwerty", "111111", "abc123"];
  if (!pw) return { key: "", color: "#e5e7eb", width: 0 };
  if (common.some(c => pw.toLowerCase().includes(c)))
    return { key: "veryWeak", color: "#dc2626", width: 15 };
  const bits = estimateEntropy(pw);
  if (bits < 40) return { key: "weak", color: "#f97316", width: 35 };
  if (bits < 60) return { key: "medium", color: "#eab308", width: 65 };
  return { key: "strong", color: "#16a34a", width: 100 };
}

// Từ điển đa ngôn ngữ (Việt / Anh)
const I18N = {
  vi: {
    subtitle: "Công cụ tạo và kiểm tra độ mạnh mật khẩu",
    lengthLabel: "Độ dài",
    lower: "Chữ thường (a-z)",
    upper: "Chữ hoa (A-Z)",
    digits: "Số (0-9)",
    symbols: "Ký tự đặc biệt",
    generate: "Tạo mật khẩu mới",
    copy: "Sao chép",
    checkTitle: "Kiểm tra mật khẩu của bạn",
    checkPlaceholder: "Nhập mật khẩu để kiểm tra",
    checkPlaceholderResult: "Nhập mật khẩu để xem đánh giá",
    passwordPlaceholder: "Mật khẩu sẽ hiện ở đây",
    historyTitle: "Lịch sử (tối đa 100 mật khẩu)",
    veryWeak: "Rất yếu: chứa mẫu phổ biến",
    weak: "Yếu",
    medium: "Trung bình",
    strong: "Mạnh",
    tipLength: "Dùng ít nhất 12 ký tự",
    tipLower: "Thêm chữ thường (a-z)",
    tipUpper: "Thêm chữ hoa (A-Z)",
    tipDigits: "Thêm số (0-9)",
    tipSymbols: "Thêm ký tự đặc biệt (!@#$...)",
    tipCommon: "Tránh các cụm từ phổ biến và dễ đoán",
    tipGood: "Mật khẩu đã đủ tốt",
  },
  en: {
    subtitle: "A tool to generate and check password strength",
    lengthLabel: "Length",
    lower: "Lowercase (a-z)",
    upper: "Uppercase (A-Z)",
    digits: "Digits (0-9)",
    symbols: "Symbols",
    generate: "Generate new password",
    copy: "Copy",
    checkTitle: "Check your password",
    checkPlaceholder: "Enter a password to check",
    checkPlaceholderResult: "Enter a password to see the rating",
    passwordPlaceholder: "Your password will appear here",
    historyTitle: "History (up to 100 passwords)  ",
    veryWeak: "Very weak: contains a common pattern",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    tipLength: "Use at least 12 characters",
    tipLower: "Add lowercase letters (a-z)",
    tipUpper: "Add uppercase letters (A-Z)",
    tipDigits: "Add digits (0-9)",
    tipSymbols: "Add symbols (!@#$...)",
    tipCommon: "Avoid common or predictable words",
    tipGood: "This password is strong enough",
  }
};

let currentLang = "vi";
const $ = id => document.getElementById(id);
const t = key => I18N[currentLang][key];

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = I18N[lang][el.dataset.i18n];
  });
  $("generateBtn").textContent = t("generate");
  $("copyBtn").textContent = t("copy");
  $("copyBtn").title = t("copy");
  $("checkInput").placeholder = t("checkPlaceholder");
  $("password").placeholder = t("passwordPlaceholder");
  $("langBtn").textContent = lang === "vi" ? "Tiếng Việt" : "English";
  
  // Render lại text độ mạnh sau khi đổi ngôn ngữ
  showStrength(currentPw);
  showCheckResult($("checkInput").value);
  showSuggestions($("checkInput").value);
}

let currentPw = "";
const pwHistory = [];

function readOptions() {
  return {
    lower: $("lower").checked,
    upper: $("upper").checked,
    digits: $("digits").checked,
    symbols: $("symbols").checked
  };
}

function showStrength(pw) {
  const r = evaluate(pw);
  const bar = $("meterBar");
  bar.style.width = r.width + "%";
  bar.style.background = r.color;
  $("strengthText").textContent = r.key ? t(r.key) : "";
}

function getSuggestions(pw) {
  const tips = [];
  if (!pw) return tips;
  const common = ["123456", "password", "qwerty", "111111", "abc123"];
  if (common.some(c => pw.toLowerCase().includes(c))) tips.push(t("tipCommon"));
  if (pw.length < 12) tips.push(t("tipLength"));
  if (!/[a-z]/.test(pw)) tips.push(t("tipLower"));
  if (!/[A-Z]/.test(pw)) tips.push(t("tipUpper"));
  if (!/[0-9]/.test(pw)) tips.push(t("tipDigits"));
  if (!/[^a-zA-Z0-9]/.test(pw)) tips.push(t("tipSymbols"));
  if (tips.length === 0) tips.push(t("tipGood"));
  return tips;
}

function showSuggestions(value) {
  const list = $("suggestions");
  list.innerHTML = "";
  getSuggestions(value).forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

function showCheckResult(value) {
  const r = evaluate(value);
  $("checkResult").textContent = r.key ? t(r.key) : t("checkPlaceholderResult");
}

// Lưu tối đa 100 mật khẩu ngẫu nhiên 
function addToHistory(pw) {
  pwHistory.unshift(pw);
  if (pwHistory.length > 100) pwHistory.pop();
  renderHistory();
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  pwHistory.forEach(pw => {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = pw;
    const btn = document.createElement("button");
    btn.textContent = "⧉";
    btn.addEventListener("click", () => navigator.clipboard.writeText(pw));
    li.append(code, " ", btn);
    list.appendChild(li);
  });
  const box = list.parentElement;
  if (box) box.style.display = pwHistory.length ? "block" : "none";
}

function refresh() {
  try {
    const pw = generatePassword(Number($("length").value), readOptions());
    currentPw = pw;
    $("password").value = pw;
    addToHistory(pw);
    showStrength(pw);
  } catch (e) {
    currentPw = "";
    $("password").value = "";
    $("strengthText").textContent = e.message;
  }
}

$("length").addEventListener("input", () => {
  $("lengthValue").textContent = $("length").value;
});
$("generateBtn").addEventListener("click", refresh);
$("copyBtn").addEventListener("click", () => {
  navigator.clipboard.writeText($("password").value);
});
$("checkInput").addEventListener("input", e => {
  showCheckResult(e.target.value);
  showSuggestions(e.target.value);
});
$("langBtn").addEventListener("click", () => {
  applyLang(currentLang === "vi" ? "en" : "vi");
});

// Chuyển đổi giao diện sáng / tối
function applyTheme(mode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  $("themeBtn").textContent = mode === "dark" ? "🌙" : "☀️";
  localStorage.setItem("theme", mode);
}

$("themeBtn").addEventListener("click", () => {
  const isDark = document.documentElement.classList.contains("dark");
  applyTheme(isDark ? "light" : "dark");
});

const savedTheme = localStorage.getItem("theme")
  || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);

// Khởi tạo trạng thái ban đầu khi tải trang
applyLang("vi");
refresh();