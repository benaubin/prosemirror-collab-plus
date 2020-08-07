# prosemirror-collab-plus

Robust collaborative editing with ProseMirror.

```
yarn add prosemirror-collab-plus
```

Improvements over prosemirror-collab:

- Expects server-side rebasing, which drastically reduces network round-trips
- Steps are queued and sent as commits, reducing overhead
- When possible, steps are merged prior to network transport
- Uses network adapters to make integration with server-side frameworks easy (see [rails-collab]) 
- Seamlessly handles network interruptions, out-of-order delivery and duplicate delivery
- Supports syncing the client's selection (*experimental*)

[rails-collab]: https://github.com/benaubin/rails-collab
