<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Formatters · Brand Kit' })

const live = ref('12345.6789')

const samples = computed(() => {
  const raw = live.value
  const num = Number(raw)
  return [
    { fmt: 'number', out: formatValue(num, 'number') },
    { fmt: 'number:2', out: formatValue(num, 'number:2') },
    { fmt: 'number:short', out: formatValue(num, 'number:short') },
    { fmt: 'number:short,2', out: formatValue(num, 'number:short,2') },
    { fmt: 'percent', out: formatValue(num / 100, 'percent') },
    { fmt: 'percent:2', out: formatValue(num / 100, 'percent:2') },
    { fmt: 'currency', out: formatValue(num, 'currency') },
    { fmt: 'currency:EUR', out: formatValue(num, 'currency:EUR') },
  ]
})

const dateSamples = [
  { fmt: 'date', out: formatValue(new Date(), 'date') },
  { fmt: 'date:month', out: formatValue(new Date(), 'date:month') },
  { fmt: 'datetime', out: formatValue(new Date(), 'datetime') },
  { fmt: 'time', out: formatValue(new Date(), 'time') },
]

const figureSamples = [
  { input: 12, out: formatFigure(12, 'integer') },
  { input: 12345, out: formatFigure(12345, 'integer') },
  { input: 1_500_000, out: formatFigure(1_500_000, 'integer') },
  { input: 2_400_000_000, out: formatFigure(2_400_000_000, 'integer') },
  { input: 0.0734, out: formatFigure(0.0734, 'percent') },
]

const numberHelpers = [
  { call: 'percentChange(120, 100)', out: percentChange(120, 100) },
  { call: 'percentChange(80, 100)', out: percentChange(80, 100) },
  { call: 'percentChange(50, 0)', out: percentChange(50, 0) },
  { call: 'calcTrendPercent(120, 100)', out: calcTrendPercent(120, 100) },
  { call: 'calcTrendPercent(8, 12, true)', out: calcTrendPercent(8, 12, true) },
  { call: 'clamp(150, 0, 100)', out: clamp(150, 0, 100) },
  { call: 'clamp(-5, [1,2,3,4,5])', out: clamp(-5, [1, 2, 3, 4, 5]) },
]
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Code"
      title="Formatters"
      description="One unified formatValue() handles numbers, percents, currency, dates. Plus number helpers."
    />

    <KitSection
      title="formatValue (live)"
      code="formatValue(input, format)"
      description="Edit the input below and watch every format update."
    >
      <UCard variant="outline">
        <div class="space-y-4">
          <UFormField label="Value">
            <UInput v-model="live" type="number" />
          </UFormField>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default">
                <th class="text-left text-[10px] uppercase tracking-wider text-dimmed font-semibold py-2 w-40">
                  Format
                </th>
                <th class="text-left text-[10px] uppercase tracking-wider text-dimmed font-semibold py-2">
                  Output
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in samples" :key="s.fmt" class="border-b border-default last:border-0">
                <td class="py-2">
                  <code class="font-mono text-xs text-default">{{ s.fmt }}</code>
                </td>
                <td class="py-2 font-mono text-default tabular-nums">
                  {{ s.out }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="Dates & times" code="formatValue(date, ...)">
      <UCard variant="outline">
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="s in dateSamples" :key="s.fmt" class="border-b border-default last:border-0">
              <td class="py-2 w-40">
                <code class="font-mono text-xs text-default">{{ s.fmt }}</code>
              </td>
              <td class="py-2 font-mono text-default">
                {{ s.out }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </KitSection>

    <KitSection
      title="formatFigure (legacy)"
      code="formatFigure(value, type)"
      description="Compact K/M/B/T suffix formatter. Marked deprecated — prefer formatValue('number:short') in new code."
    >
      <UCard variant="outline">
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="s in figureSamples" :key="s.input" class="border-b border-default last:border-0">
              <td class="py-2 w-40 font-mono text-xs text-dimmed">
                {{ s.input }}
              </td>
              <td class="py-2 font-mono text-default tabular-nums">
                {{ s.out }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </KitSection>

    <KitSection title="Number helpers" code="utils/number.ts">
      <UCard variant="outline">
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="(h, i) in numberHelpers" :key="i" class="border-b border-default last:border-0">
              <td class="py-2 w-72">
                <code class="font-mono text-xs text-default">{{ h.call }}</code>
              </td>
              <td class="py-2 font-mono text-default tabular-nums">
                {{ h.out }}
              </td>
            </tr>
          </tbody>
        </table>
      </UCard>
    </KitSection>
  </div>
</template>
