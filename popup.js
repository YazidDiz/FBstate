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

function updateCookies() {
  getCookies((cookieString) => {
    document.querySelector("#cookies").innerHTML = cookieString ? cookieString : "Not Logged Into Facebook!";
    const fbstate = convert(cookieString);
    document.querySelector("#fbstate").innerHTML = JSON.stringify(fbstate, null, 2);
  });
}

function refreshAppState() {
  updateCookies();
}

function copyJSONToClipboard() {
  const jsonText = document.querySelector("#fbstate").textContent;
  const textArea = document.createElement("textarea");
  textArea.value = jsonText;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
  alert("FBState copied to clipboard!");
}

function downloadJSONFile() {
  const jsonText = document.querySelector("#fbstate").textContent;
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `fbstate_${Math.random()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert("Success");
}

document.querySelector("#download-button").addEventListener("click", downloadJSONFile);
document.querySelector("#copy-button").addEventListener("click", copyJSONToClipboard);
document.querySelector("#export-button").addEventListener("click", refreshAppState);
updateCookies();
