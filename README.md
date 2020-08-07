# prosemirror-collab-plus

Robust collaborative editing with ProseMirror.

```
yarn add prosemirror-collab-plus
```

Improvements over prosemirror-collab:

- Server-side rebasing drastically reduces network round-trips
- Steps are queued and sent as commits, reducing overhead
- When possible, steps are merged prior to network transport
- Uses network adapters to make integration with server-side frameworks easy (see [rails-collab]) 
- Includes `@pmcp/authority`, which handles applying document changes server-side and optionally exposes a simple json-based RPC protocol so that it can be embedded in any backend.
- Seamlessly handles network interruptions, out-of-order delivery and duplicate delivery
- Supports syncing the client's selection (*experimental*)

[rails-collab]: https://github.com/benaubin/rails-collab
