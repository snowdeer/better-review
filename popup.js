const clickMeButton = document.getElementById("click-me");

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function showAlert(name) {
  alert(`Hello, ${name}`);
}

clickMeButton.addEventListener("click", async () => {
  const tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showAlert,
    args: ["snowdeer"],
  });
});
