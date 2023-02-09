import { html } from './lib/arrow.js'
import { Filters } from './Filters.js'
import { Jobs } from './Jobs.js'

const filters = new Filters()
const jobs = new Jobs(filters)

html`

${filters.render()}
${jobs.render()}

`(document.body)