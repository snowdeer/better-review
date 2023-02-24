import type { MonacoOptions } from "./monaco/settings";

import { editor } from "monaco-editor";
import { Monaco } from "./monaco/loader";
import { GitHubCompletionController } from "./GitHubCompletionController";
import { GithubApi } from "./GithubApi";

export interface MonacoNode extends HTMLDivElement {
  editorWrapper: EditorWrapper;
}

export const isMonacoNode = (n: unknown): n is MonacoNode => {
  const k: keyof MonacoNode = "editorWrapper";
  return typeof n === "object" && n !== null && k in n;
};

type Theme = "light" | "dark";

export const editorWrapperDivClassName = " editor-wrapper";
export const monacoDivClassName = "monaco-container";

const getGithubTheme = (): Theme => {
  try {
    return (document.body.parentNode as any).dataset.colorMode as any;
  } catch (e) {
    console.warn("Could not read github colorMode");
    return "light";
  }
};

export class EditorWrapper {
  public static wrap(
    textArea: HTMLTextAreaElement,
    monaco: Monaco,
    completionController: GitHubCompletionController,
    api: GithubApi,
    settings: MonacoOptions
  ) {
    if (textArea.editorWrapper) {
      return textArea.editorWrapper;
    }
    return new EditorWrapper(
      textArea,
      monaco,
      completionController,
      getGithubTheme(),
      api,
      settings
    );
  }

  private disposed = false;
  private readonly disposables = new Array<() => any>();

  private readonly editorWrapperDiv = document.createElement("div");
  private readonly monacoDiv = document.createElement("div");
  private readonly editorRoot: HTMLElement;
  private readonly editor: editor.IStandaloneCodeEditor;

  private editorHeight: number = 200;

  private constructor(
    private readonly textArea: HTMLTextAreaElement,
    monaco: Monaco,
    completionController: GitHubCompletionController,
    theme: "light" | "dark",
    private readonly githubApi: GithubApi,
    settings: MonacoOptions
  ) {
    this.editorRoot = textArea.parentNode as HTMLElement;

    this.prepareTextArea();

    this.editorWrapperDiv.className = editorWrapperDivClassName;

    (this.editorWrapperDiv as MonacoNode).editorWrapper = this;
    this.editorRoot.appendChild(this.editorWrapperDiv);
    this.disposables.push(() => {
      this.editorWrapperDiv.remove();
    });

    this.handleEditorFocusChanged(false);

    this.monacoDiv.className = monacoDivClassName;
    this.editorWrapperDiv.appendChild(this.monacoDiv);

    const model = monaco.editor.createModel(textArea.value, "markdown");

    const { mentionUrl, issueUrl } = (this.editorRoot as any).dataset;
    completionController.registerUrls(model, { mentionUrl, issueUrl });

    this.editor = monaco.editor.create(this.monacoDiv, {
      ...settings,
      model,
      automaticLayout: true,
      minimap: { enabled: false },
      theme: settings.theme ?? (theme === "dark" ? "vs-dark" : "vs"),
    });

    this.editor.addAction({
      id: "github.submit",
      label: "Submit",
      run: () => {
        const ctrlEnterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          ctrlKey: true,
        });
        textArea.dispatchEvent(ctrlEnterEvent);
      },
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    });

    this.disposables.push(() => this.editor.dispose());
    this.disposables.push(() => model.dispose());

    this.editor.onDidFocusEditorText(() => this.handleEditorFocusChanged(true));
    this.editor.onDidFocusEditorWidget(() =>
      this.handleEditorFocusChanged(true)
    );
    this.editor.onDidBlurEditorText(() => this.handleEditorFocusChanged(false));
    this.editor.onDidBlurEditorWidget(() =>
      this.handleEditorFocusChanged(false)
    );

    const interval = setInterval(() => {
      if (model.getValue() !== textArea.value) {
        model.setValue(textArea.value);
      }
      if (!document.body.contains(textArea)) {
        this.dispose();
      }
    }, 100);
    this.disposables.push(() => clearInterval(interval));

    textArea.addEventListener("change", () => {
      if (model.getValue() !== textArea.value) {
        model.setValue(textArea.value);
      }
    });
    textArea.addEventListener("input", () => {
      if (model.getValue() !== textArea.value) {
        model.setValue(textArea.value);
      }
    });

    this.editor.onDidChangeCursorSelection((e) => {
      const startOffset = model.getOffsetAt(e.selection.getStartPosition());
      const endOffset = model.getOffsetAt(e.selection.getEndPosition());
      textArea.selectionStart = startOffset;
      textArea.selectionEnd = endOffset;
    });

    model.onDidChangeContent((e) => {
      if (e.changes.length === 1 && e.changes[0].text === " ") {
        this.editor.trigger("editor", "hideSuggestWidget", undefined);
      }
      const value = model.getValue();
      textArea.value = value;
      textArea.dispatchEvent(new Event("input"));
    });

    this.editor.onDidContentSizeChange((e) => {
      this.editorHeight = e.contentHeight;
      this.applyState();
    });

    const resizeObserver = new ResizeObserver(() => {
      if (this.editorRoot.offsetHeight > 0) {
        this.editor.layout();
      }
    });
    resizeObserver.observe(this.editorRoot);
    resizeObserver.observe(this.editorWrapperDiv);

    this.disposables.push(() => resizeObserver.disconnect());

    const applyState = () => {
      this.applyState();
    };
    window.addEventListener("resize", applyState);
    this.disposables.push(() => {
      window.removeEventListener("resize", applyState);
    });

    this.applyState();
  }

  private lastText: string = "";

  private handleEditorFocusChanged(isFocused: boolean): void {
    if (isFocused) {
      this.editorWrapperDiv.style.border = "1px solid #4a9eff";
      this.textArea.dispatchEvent(new Event("focus"));
    } else {
      this.editorWrapperDiv.style.border = "1px solid #c3c8cf";
      this.textArea.dispatchEvent(new Event("blur"));
    }
  }

  private prepareTextArea() {
    this.textArea.editorWrapper = this;
    this.textArea.style.display = "none";

    Object.defineProperty(this.textArea, "offsetHeight", {
      get: () => this.editorRoot.offsetHeight,
    });
    Object.defineProperty(this.textArea, "offsetWidth", {
      get: () => this.editorRoot.offsetWidth,
    });

    Object.defineProperty(this.textArea, "focus", {
      value: () => {
        this.editor.focus();
      },
    });
  }

  private applyState() {
    this.monacoDiv.style.height = `${Math.min(
      300,
      Math.max(100, this.editorHeight + 2)
    )}px`;
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const d of this.disposables) {
      d();
    }
  }
}
