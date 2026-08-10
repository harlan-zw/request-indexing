<script setup lang="ts">
defineProps<{
  session: any
}>()
</script>

<template>
  <ProCard
    variant="subtle"
    title="AI Assistant Integration"
    description="Add SEO superpowers to Claude Code, Cursor, Windsurf, Gemini CLI, or Codex CLI. Research keywords, analyze SERPs, and generate code directly in your editor."
  >
    <NuxtSeoProMcpConfig />
  </ProCard>
</template>
