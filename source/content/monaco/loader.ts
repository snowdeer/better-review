import type * as monaco from "monaco-editor";

export type Monaco = typeof monaco;

export const getMonaco = (): Monaco => require("monaco-editor");
