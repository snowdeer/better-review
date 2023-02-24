import { defaultSettings } from "./content/monaco/settings";

const injectScript = (url: string) => {
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", url);
  document.head.appendChild(script);
};

const injectCss = (url: string) => {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  link.setAttribute("href", url);
  document.head.appendChild(link);
};

(async () => {
  document.head.dataset.monacoEditorPublicPath =
    chrome.runtime.getURL("/dist/");
  const settings = defaultSettings;
  document.head.dataset.monacoEditorSettings = JSON.stringify(settings);

  injectScript(chrome.runtime.getURL("/dist/main.js"));
  injectCss(chrome.runtime.getURL("/dist/styles.css"));
})();
