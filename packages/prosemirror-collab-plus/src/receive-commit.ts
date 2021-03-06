import type { Schema } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import { Step, Mapping } from "prosemirror-transform";
import { CommitData } from "./network";
import type { PluginState } from "./plugin";
import key from "./plugin-key";
import { rebaseSteps } from "./rebaseable";
import { InflightCommit } from "./inflight-commit";

function applyCommitSteps<S extends Schema>(
  tr: Transaction<S>,
  schema: S,
  data: CommitData
): Mapping {
  const mapping = new Mapping();
  for (const stepJSON of data.steps) {
    const step = Step.fromJSON(schema, stepJSON);
    tr.step(step);
    mapping.appendMap(step.getMap());
  }
  return mapping;
}

const maxVersionMappings = 100;

export function receiveCommitTransaction<S extends Schema>(
  editorState: EditorState<S>,
  commit: CommitData
): Transaction<S> {
  const tr = editorState.tr;
  const state: PluginState<S> = { ...key.getState(editorState) };

  tr.setMeta(key, state);
  tr.setMeta("addToHistory", false);

  // The mapping for this commit from the previous commit
  let commitMapping!: Mapping;

  state.syncedVersion += 1;

  if (state.inflightCommit && commit.ref === state.inflightCommit.ref) {
    // This is a confirmation of our inflight commit. Our document is current, no need to rebase.
    commitMapping = new Mapping(
      state.inflightCommit.steps.map(({ step }) => step.getMap())
    );

    state.inflightCommit = undefined;

    // Set lastSyncedDoc to the doc prior to the local steps
    state.lastSyncedDoc =
      state.localSteps.length > 0 ? state.localSteps[0].priorDoc : tr.doc;
  } else {
    let unsyncedMapping: Mapping = new Mapping();

    state.localSteps = rebaseSteps(tr, state.localSteps, () => {
      if (state.inflightCommit) {
        // We have a commit inflight (this commit is not its confirmation),
        // so we need to rebase the inflight commit over the commit we just received
        const rebasedSteps = rebaseSteps(tr, state.inflightCommit.steps, () => {
          // Apply the steps in the commit we just received
          commitMapping = applyCommitSteps(tr, editorState.schema, commit);
          // Set lastSyncedDoc before redoing the inflight commit
          state.lastSyncedDoc = tr.doc;
        });

        // Because the commit is still unsynced, we need to add its mapping to the unsyncedMapping
        for (const { step } of rebasedSteps)
          unsyncedMapping.appendMap(step.getMap());

        state.inflightCommit = new InflightCommit(
          rebasedSteps,
          state.syncedVersion,
          state.inflightCommit.ref
        );
      } else {
        // Super simple if we don't have a commit inflight, just apply the steps in this commit
        commitMapping = applyCommitSteps(tr, editorState.schema, commit);
        state.lastSyncedDoc = tr.doc;
      }
    });

    for (const { step } of state.localSteps)
      unsyncedMapping.appendMap(step.getMap());

    state.unsyncedMapping = unsyncedMapping;
  }

  state.versionMappings = state.versionMappings.slice(
    0,
    maxVersionMappings - 1
  );
  state.versionMappings.unshift(commitMapping);

  return tr;
}
