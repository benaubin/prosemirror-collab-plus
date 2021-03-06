import type { Schema } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { PluginState } from "./plugin";
import key from "./plugin-key";
import { compactRebaseable, Rebaseable } from "./rebaseable";
import { CommitData } from "./network";

const maxStepsPerCommit = 10;

export class InflightCommit<S extends Schema> {
  readonly baseVersion: number;
  readonly steps: Rebaseable<S>[];
  readonly ref: string;

  constructor(
    steps: Rebaseable<S>[],
    baseVersion: number,
    ref = InflightCommit.randomRef()
  ) {
    this.baseVersion = baseVersion;
    this.steps = steps;
    this.ref = ref;
  }

  sendable(): CommitData {
    return {
      v: this.baseVersion,
      ref: this.ref,
      steps: this.steps.map((step) => step.step.toJSON()),
    };
  }

  static randomRef() {
    let bytes = new Uint32Array(2);

    if (typeof window !== "undefined") {
      bytes = window.crypto.getRandomValues(bytes);
    } else {
      bytes = require("crypto").randomBytes(bytes.byteLength);
    }

    return bytes.reduce((str, byte) => str + byte.toString(36), "");
  }

  static fromState<S extends Schema>(
    editorState: EditorState<S>
  ): InflightCommit<S> | undefined {
    const state: PluginState<S> = key.getState(editorState);

    // we may only have one inflight commit at a time
    if (state.inflightCommit) return;
    if (state.localSteps.length === 0) return;

    const sendableSteps = compactRebaseable(state.localSteps);
    state.localSteps = sendableSteps.splice(maxStepsPerCommit - 1);

    state.inflightCommit = new InflightCommit(
      sendableSteps,
      state.syncedVersion
    );

    return state.inflightCommit;
  }
}
