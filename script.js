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