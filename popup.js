function getCookies(callback) {
  chrome.cookies.getAll({ url: "https://www.facebook.com" }, function (cookies) {
    if (!cookies || cookies.length === 0) {
      // Essayer avec le domaine générique
      chrome.cookies.getAll({ url: "https://facebook.com" }, function (altCookies) {
        if (!altCookies || altCookies.length === 0) {
          console.warn("Aucun cookie Facebook trouvé.");
          callback(""); // Aucun cookie trouvé
        } else {
          const cookieString = altCookies.map((c) => `${c.name}=${c.value}`).join("; ");
          console.log("Cookies trouvés (alt):", cookieString);
          callback(cookieString);
        }
      });
    } else {
      const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      console.log("Cookies trouvés:", cookieString);
      callback(cookieString);
    }
  });
}
 
function convert(ck) {
  const now = new Date();
  const nowISO = now.toISOString();

  // Parse cookies string into array of {key, value}
  const parsedCookies = ck
    .split("; ")
    .filter((data) => data && data.includes("="))
    .map((cookie) => {
      const [key, ...rest] = cookie.split("=");
      return { key, value: rest.join("=") };
    });

  // Build the array, starting with the /login/device-based/ cookie if c_user exists
  let cookies = [];

  // If c_user exists, add dbln first (simulate as in your example)
  const cUser = parsedCookies.find(c => c.key === "c_user");
  if (cUser) {
    cookies.push({
      key: "dbln",
      value: encodeURIComponent(`{"${cUser.value}":"vp50HcQG"}`), // valeur simulée
      domain: "facebook.com",
      path: "/login/device-based/",
      hostOnly: false,
      creation: nowISO,
      lastAccessed: nowISO,
    });
  }

  // Add all other cookies
  parsedCookies.forEach(({ key, value }) => {
    cookies.push({
      key,
      value,
      domain: "facebook.com",
      path: "/",
      hostOnly: false,
      creation: nowISO,
      lastAccessed: nowISO,
    });
  });

  return cookies;
}

function updateCookies() {
  getCookies((cookieString) => {
    const cookiesElem = document.querySelector("#cookies");
    const fbstateElem = document.querySelector("#fbstate");
    if (cookiesElem) {
      cookiesElem.textContent = cookieString ? cookieString : "Not Logged Into Facebook!";
    }
    if (fbstateElem) {
      const fbstate = convert(cookieString);
      fbstateElem.textContent = JSON.stringify(fbstate, null, 2);
    }
  });
}

function refreshAppState() {
  updateCookies();
}

function copyJSONToClipboard() {
  const fbstateElem = document.querySelector("#fbstate");
  if (!fbstateElem) return;
  const jsonText = fbstateElem.textContent;
  const textArea = document.createElement("textarea");
  textArea.value = jsonText;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
  alert("FBState copied to clipboard!");
}

function downloadJSONFile() {
  const fbstateElem = document.querySelector("#fbstate");
  if (!fbstateElem) return;
  const jsonText = fbstateElem.textContent;
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `fbstate_${Math.random()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert("Success");
}

// Ajout de vérification d'existence avant d'ajouter les listeners
document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.querySelector("#download-button");
  const copyBtn = document.querySelector("#copy-button");
  const exportBtn = document.querySelector("#export-button");
  if (downloadBtn) downloadBtn.addEventListener("click", downloadJSONFile);
  if (copyBtn) copyBtn.addEventListener("click", copyJSONToClipboard);
  if (exportBtn) exportBtn.addEventListener("click", refreshAppState);
  updateCookies();
});