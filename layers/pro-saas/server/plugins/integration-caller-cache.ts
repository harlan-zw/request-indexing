// Per ADR-0001 the Caller cache is request-scoped (event.context). When an
// integration is linked/unlinked, the next request reads fresh state via
// getCaller. This listener exists to make the contract explicit and to host
// any future global cache invalidation.

export default defineProListeners([
  defineProListener('pro:integration:linked', ({ userId, kind }) => {
    // TODO(layer-hook): if a cross-request Caller cache lands (KV-backed
    // or similar), bust the entry for `userId` here.
    void userId
    void kind
  }),
  defineProListener('pro:integration:unlinked', ({ userId, kind }) => {
    // TODO(layer-hook): see linked listener above.
    void userId
    void kind
  }),
])
