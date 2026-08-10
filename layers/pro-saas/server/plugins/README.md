Runtime-wiring Nitro plugins for the pro-saas layer.

`pro:*` event listeners live alongside other plugins under the `listener.*.ts` filename convention. Each file default-exports a Nitro plugin built from `defineProListener` (or `defineProListeners` when one file owns several related hooks, e.g. `listener.billing.persist.ts`). Filename: `listener.<event>.<reaction>.ts`.

See `server/utils/dispatch.ts` for the typed event dispatcher and `server/utils/hooks.ts` for the event payload contract + listener helpers.
