// Pro Chat layer: AI chat assistant. Owns chat UI, conversation persistence,
// chat-kill criteria, and AI agent tooling. Depends on pro layer for site/GSC
// context but no pro feature depends on chat, chat is a leaf in the dependency
// graph.
//
// This layer opts OUT of contributing to global auto-import. Components and
// composables defined here MUST be imported explicitly (relative paths inside
// the layer, `~~/layers/pro-chat/...` paths from outside). The string-resolved
// site-surface registration was migrated to a direct Component value
// (see app/plugins/site-surface.ts), removing the last need for global
// component registration in this layer.

export default defineNuxtConfig({
  components: [],
  imports: {
    dirs: [],
  },
})
