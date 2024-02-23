<script lang="ts" setup>
// const isSyncLoading = ref(false)
// function sync() {
//   callFnSyncToggleRef(forceRefresh, isSyncLoading)
// }
</script>

<template>
  <UContainer>
    <div class="py-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:gap-10">
          <div class="mb-3 md:mb-0">
            <h2 class="text-2xl font-bold mb-1 flex items-center gap-2">
              <UIcon name="i-heroicons-circle-stack" />
              <span>Backups</span>
            </h2>
            <p class="text-gray-400 text-sm">
              View and download your backed up data.
            </p>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
