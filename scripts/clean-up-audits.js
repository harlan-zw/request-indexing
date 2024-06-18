// read audits.json
import { readFile, writeFile } from 'node:fs/promises'
async function main() {
  const json = await readFile('audits.json', 'utf8')
  const audits = JSON.parse(json)
  const remapped = Object.fromEntries(Object.entries(audits).map(([key, value]) => {
    /**
     *   "object-alt": {
     *     "id": "object-alt",
     *     "title": "`<object>` elements have alternate text",
     *     "description": "Screen readers cannot translate non-text content. Adding alternate text to `<object>` elements helps screen readers convey meaning to users. [Learn more about alt text for `object` elements](https://dequeuniversity.com/rules/axe/4.9/object-alt).",
     *     "score": null,
     *     "scoreDisplayMode": "notApplicable"
     *   },
     */
    // we just want to keep the id, title and description, drop anything else
    return [key, { id: value.id, title: value.title, description: value.description }]
  }))
  // write to file
  await writeFile('audits-clean.json', JSON.stringify(remapped, null, 2))
}

main()
