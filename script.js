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
  if (!pw) return { score: 0, label: "", color: "#e5e7eb", width: 0 };
  if (common.some(c => pw.toLowerCase().includes(c)))
    return { score: 0, label: "Rất yếu: chứa mẫu phổ biến", color: "#dc2626", width: 15 };
  const bits = estimateEntropy(pw);
  if (bits < 40) return { label: "Yếu", color: "#f97316", width: 35 };
  if (bits < 60) return { label: "Trung bình", color: "#eab308", width: 65 };
  return { label: "Mạnh", color: "#16a34a", width: 100 };
}

function showStrength(pw, barEl, textEl) {
  const r = evaluate(pw);
  barEl.style.width = r.width + "%";
  barEl.style.background = r.color;
  textEl.textContent = r.label;
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
  $("checkResult").textContent = r.label || "Nhập mật khẩu để xem đánh giá";
});

refresh();

const history = [];

function addToHistory(pw) {
  history.unshift(pw);
  if (history.length > 5) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  history.forEach(pw => {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = pw;
    const btn = document.createElement("button");
    btn.textContent = "⧉";
    btn.addEventListener("click", () => navigator.clipboard.writeText(pw));
    li.append(code, " ", btn);
    list.appendChild(li);
  });
}