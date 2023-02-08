import { html } from './arrow.js'
import { Filters } from './Filters.js'
import { Jobs } from './Jobs.js'

const filters = new Filters()
const jobs = window.jobs = new Jobs(filters)

const renderFilters = filters.render()
const renderJobs = jobs.render()

html`

${renderFilters}
${renderJobs}

`(document.body)