function getCookies(callback) {
  chrome.cookies.getAll({ url: "https://www.facebook.com" }, function (cookies) {
    const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    callback(cookieString);
  });
}
 
function convert(ck) {
  
  const now = new Date().getTime();

  const cookies = ck
    .split("; ")
    .filter((data) => {
      const cookieParts = data.split("=");
      return cookieParts[0];
    })
    .map((cookie) => ({
      key: cookie.split("=")[0],
      value: cookie.split("=")[1],
      domain: "facebook.com",
      path: "/",
      creation: now,
      lastAccessed: now,
    }));

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