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
  if (pool === "") throw new Error("Phải chọn ít nhất một loại ký tự");
  if (length < required.length) throw new Error("Độ dài quá ngắn");

  const chars = [];
  for (const set of required) {
    chars.push(set[randomInt(set.length)]);
  }
  while (chars.length < length) {
    chars.push(pool[randomInt(pool.length)]);
  }
  // Xáo trộn để các ký tự bắt buộc không luôn nằm đầu
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

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

function showStrength(pw, barEl, textEl) {
  const r = evaluate(pw);
  barEl.style.width = r.width + "%";
  barEl.style.background = r.color;
  textEl.textContent = r.key ? I18N[currentLang][r.key] : "";
}

const $ = id => document.getElementById(id);

function readOptions() {
  return {
    lower: $("lower").checked,
    upper: $("upper").checked,
    digits: $("digits").checked,
    symbols: $("symbols").checked
  };
}

function refresh() {
  try {
    const pw = generatePassword(Number($("length").value), readOptions());
    $("password").value = pw;
    showStrength(pw, $("meterBar"), $("strengthText"));
  } catch (e) {
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
  const r = evaluate(e.target.value);
  $("checkResult").textContent = r.key ? I18N[currentLang][r.key] : I18N[currentLang].checkPlaceholderResult;
});

const I18N = {
  vi: {
    subtitle: "Công cụ tạo và kiểm tra độ mạnh mật khẩu",
    generate: "Tạo mật khẩu mới",
    copy: "Sao chép",
    length: "Độ dài",
    lower: "Chữ thường (a-z)",
    upper: "Chữ hoa (A-Z)",
    digits: "Số (0-9)",
    symbols: "Ký tự đặc biệt",
    checkTitle: "Kiểm tra mật khẩu của bạn",
    lengthLabel: "Độ dài",
    veryWeak: "Rất yếu: chứa mẫu phổ biến", weak: "Yếu", medium: "Trung bình", strong: "Mạnh",
    checkPlaceholderResult: "Nhập mật khẩu để xem đánh giá",
    checkPlaceholder: "Nhập mật khẩu để kiểm tra"
  },
  en: {
    subtitle: "A tool to generate and check password strength",
    generate: "Generate new password",
    copy: "Copy",
    length: "Length",
    lower: "Lowercase (a-z)",
    upper: "Uppercase (A-Z)",
    digits: "Digits (0-9)",
    symbols: "Symbols",
    checkTitle: "Check your password",
    lengthLabel: "Length",
    veryWeak: "Very weak: contains a common pattern", weak: "Weak", medium: "Medium", strong: "Strong",
    checkPlaceholderResult: "Enter a password to see the rating",
    checkPlaceholder: "Enter a password to check"
  }
};

let currentLang = "vi";

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = I18N[lang][el.dataset.i18n];
  });
  $("generateBtn").textContent = I18N[lang].generate;
  $("copyBtn").textContent = I18N[lang].copy;
  $("checkInput").placeholder = I18N[lang].checkPlaceholder;
  $("langBtn").textContent = lang === "vi" ? "Tiếng Việt" : "English";
  $("copyBtn").title = I18N[lang].copy;

    refresh()

}

$("langBtn").addEventListener("click", () => {
  applyLang(currentLang === "vi" ? "en" : "vi");
});
