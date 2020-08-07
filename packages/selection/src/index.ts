import type { Schema } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import type { PluginSpec } from "prosemirror-state";
import { mapBackToSyncedVersion } from "prosemirror-collab-plus";

export interface SelectionData {
  v: number;
  head: number;
  anchor: number;
}

export interface PluginState {
  selectionNeedsSending?: boolean;
}

export interface Options {
  /** default: 500ms */
  readonly throttleMs?: number;

  /** Return false to retry sending later */
  sendSelection(data: SelectionData): Promise<void>;
}

export const key = new PluginKey("pmcp-selection");

class CollabSelectionPlugin<S extends Schema = Schema> extends Plugin<
  PluginState,
  S
> {
  constructor({ throttleMs = 500, sendSelection }: Options) {
    super({
      key,
      state: {
        init: () => ({
          selectionNeedsSending: false,
        }),
        apply(tr, val) {
          val = { ...val };

          if (tr.selectionSet) val.selectionNeedsSending = true;

          return val;
        },
      },
      view(view) {
        function getSendableSelection() {
          const pluginState = key.getState(view.state);
          const selection = mapBackToSyncedVersion(
            pluginState,
            view.state.selection
          );

          if (selection) {
            pluginState.selectionNeedsSending = false;
            return {
              v: pluginState.syncedVersion,
              head: selection.head,
              anchor: selection.anchor,
            };
          }
        }

        let selectionInflight = false;

        const syncSelection = () => {
          if (selectionInflight) return;
          selectionInflight = true;

          setTimeout(async () => {
            key.getState(view.state).selectionNeedsSending = false;

            const data = getSendableSelection();
            if (data) await sendSelection(data);

            selectionInflight = false;

            // if the selection changed while inflight
            if (key.getState(view.state).selectionNeedsSending)
              return syncSelection();
          }, throttleMs);
        };

        return {
          update(_) {
            syncSelection();
          },
        };
      },
    } as PluginSpec<PluginState, S>);
  }
}

export function collabSelection<S extends Schema = Schema>(opts: Options) {
  return new CollabSelectionPlugin<S>(opts);
}
