declare let __webpack_public_path__: string;
__webpack_public_path__ = document.head.dataset
  .monacoEditorPublicPath as string;

import type { MonacoOptions } from "./monaco/settings";

import { getMonaco } from "./monaco/loader";
import { GithubApi } from "./GithubApi";
import {
  EditorWrapper,
  editorWrapperDivClassName,
  isMonacoNode,
} from "./EditorWrapper";
import { GitHubCompletionController } from "./GitHubCompletionController";
import { EmojiCompletionController } from "./EmojiCompletionController";

const main = async () => {
  const settings = JSON.parse(
    document.head.dataset.monacoEditorSettings!
  ) as MonacoOptions;

  const githubApi = new GithubApi();
  const monaco = getMonaco();
  const completionController = new GitHubCompletionController(
    monaco,
    githubApi
  );
  const emojiCompletionController = new EmojiCompletionController(monaco);

  const updateDocument = () => {
    for (const textArea of [
      ...(document.getElementsByClassName("comment-form-textarea") as any),
    ]) {
      EditorWrapper.wrap(
        textArea,
        monaco,
        completionController,
        githubApi,
        settings
      );
    }

    for (const div of [
      ...(document.getElementsByClassName(editorWrapperDivClassName) as any),
    ]) {
      if (!isMonacoNode(div)) {
        div.remove();
      }
    }
  };

  let timeout: NodeJS.Timeout | undefined = undefined;
  const mutationObserver = new MutationObserver(() => {
    if (!timeout) {
      timeout = setTimeout(() => {
        updateDocument();
        timeout = undefined;
      }, 50);
    }
  });

  mutationObserver.observe(document.body, {
    subtree: true,
    childList: true,
  });

  updateDocument();
};

main();
