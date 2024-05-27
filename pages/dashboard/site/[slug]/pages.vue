<script lang="ts" setup>
defineProps<{ site: any }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
})
</script>

<template>
  <div>
    <UCard>
      <TablePagesNext :site="site" />
    </UCard>
  <!--      <div> -->
  <!--        <div class="text-2xl font-bold flex gap-2 items-center"> -->
  <!--          {{ useHumanFriendlyNumber(pages.periodCount) }}  <span class="font-normal text-sm">Pages</span> -->
  <!--        </div> -->
  <!--        <TrendPercentage :value="pages.periodCount" :prev-value="pages.prevPeriodCount" /> -->
  <!--      </div> -->
  <!--      <div class="grid grid-cols-4"> -->
  <!-- &lt;!&ndash;        <TablePages class="col-span-3" :value="pages?.rows" :site="site" />&ndash;&gt; -->
  <!--      </div> -->
  <!--      <div v-if="pagesDb" class="grid grid-cols-4"> -->
  <!--        <TablePagesNext class="col-span-3" :value="pagesDb?.rows" :site="site" /> -->
  <!--      </div> -->
  </div>
</template>
