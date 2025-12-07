function getCookies(callback) {
  chrome.cookies.getAll({ url: "https://www.facebook.com" }, function (cookies) {
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    callback(cookieString);
  });
}
 
function convert(ck) {
  const now = new Date().toISOString();

  const cookies = ck
    .split("; ")
    .filter((data) => data.includes("="))
    .map((cookie) => {
      const [key, ...rest] = cookie.split("=");
      return {
        key,
        value: rest.join("="),
        domain: "facebook.com",
        path: "/",
        hostOnly: false,
        creation: now,
        lastAccessed: now,
      };
    });

  return cookies;
}

// Utility: get all FB cookies
async function getFacebookCookies() {
  return await chrome.cookies.getAll({ domain: "facebook.com" });
}

// Utility: map cookies to UFC format
function mapCookies(cookies) {
  const now = new Date().toISOString();
  return cookies.map((v) => ({
    key: v.name,
    value: v.value,
    domain: "facebook.com",
    path: v.path,
    hostOnly: v.hostOnly,
    creation: now,
    lastAccessed: now,
  }));
}

// Export UFC data
async function exportUFC(type = "json", encryptKey) {
  const cookies = await getFacebookCookies();
  let state = JSON.stringify(mapCookies(cookies), null, "\t");

  if (encryptKey) {
    const te = new TextEncoder();
    const keyRaw = new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(encryptKey)));
    const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-CTR', false, ['encrypt']);
    const crypted = await crypto.subtle.encrypt({
      name: "AES-CTR",
      counter: new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]),
      length: 128
    }, key, te.encode(state));
    state = Array.from(new Uint8Array(crypted)).map(v => v.toString(16).padStart(2, '0')).join('');
  }

  if (type === "base64") state = btoa(state);

  document.querySelector("#ufc-data").value = state;
}

// Import UFC data
async function importUFC(value) {
  let parsedUFC;
  // Try JSON
  try {
    parsedUFC = JSON.parse(value);
  } catch {
    // Try base64
    try {
      parsedUFC = JSON.parse(atob(value));
    } catch {
      // Try encrypted hex
      if (/^[0-9a-fA-F]+$/.test(value) && !(value.length % 2)) {
        const encryptKey = prompt("Enter password to decrypt UFC data:");
        if (!encryptKey) return alert("Cancelled.");
        const te = new TextEncoder();
        const keyRaw = new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(encryptKey)));
        const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-CTR', false, ['decrypt']);
        const e = Uint8Array.from((value.match(/.{2}/g) ?? []).map(v => parseInt(v, 16)));
        try {
          const decrypted = await crypto.subtle.decrypt({
            name: "AES-CTR",
            counter: new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]),
            length: 128
          }, key, e);
          parsedUFC = JSON.parse(new TextDecoder().decode(decrypted));
        } catch {
          alert("Invalid password.");
          return;
        }
      } else {
        alert("Invalid UFC data input.");
        return;
      }
    }
  }

  if (!parsedUFC || !Array.isArray(parsedUFC)) {
    alert("Invalid UFC data input.");
    return;
  }

  // Remove existing FB cookies
  const cookies = await getFacebookCookies();
  for (let c of cookies) {
    await chrome.cookies.remove({
      url: `https://facebook.com${c.path}`,
      name: c.name
    });
  }

  // Set new cookies
  for (let cookie of parsedUFC) {
    if (cookie.domain.endsWith("facebook.com")) {
      await chrome.cookies.set({
        url: "https://facebook.com" + cookie.path,
        name: cookie.key,
        value: cookie.value,
        expirationDate: (Date.now() / 1000) + (84600 * 365),
        domain: ".facebook.com"
      });
    }
  }

  alert("UFC data imported!");
}

// Clipboard copy
function copyToClipboard() {
  const text = document.querySelector("#ufc-data").value;
  navigator.clipboard.writeText(text);
  alert("Copied to clipboard!");
}

// Save to file
function saveToFile() {
  const value = document.querySelector("#ufc-data").value;
  const blob = new Blob([value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ufc-facebook.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Clear textarea
function clearData() {
  document.querySelector("#ufc-data").value = '';
}

// Paste from clipboard
async function pasteFromClipboard() {
  document.querySelector("#ufc-data").value = await navigator.clipboard.readText();
}

// Bind UI events (adapt selectors to your popup.html)
document.querySelector("#export-json").onclick = () => exportUFC("json");
document.querySelector("#export-base64").onclick = () => exportUFC("base64");
document.querySelector("#export-encrypted").onclick = async () => {
  const key = prompt("Enter password to encrypt UFC data:");
  if (key) await exportUFC("json", key);
};
document.querySelector("#import-button").onclick = async () => {
  const value = document.querySelector("#ufc-data").value;
  await importUFC(value);
};
document.querySelector("#copy-button").onclick = copyToClipboard;
document.querySelector("#save-button").onclick = saveToFile;
document.querySelector("#clear-button").onclick = clearData;
document.querySelector("#paste-button").onclick = pasteFromClipboard;

// Initial export (optional)
exportUFC("json");
