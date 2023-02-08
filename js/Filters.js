import { reactive, html } from './arrow.js'

export default class Filters {
    constructor() {
        this.data = reactive({
            filters: []
        })
    }

    render() {
        const reactiveFilters = () => this.renderFilters()
        const onClick = () => this.clear()

        return html`

        <section class="filters">
            <h2 class="visually-hidden">Jobs Filters</h2>

            <ul class="filters__list">${reactiveFilters}</ul>

            <button class="filters__clear" @click="${onClick}" aria-controls="jobs">
                Clear
                <span class="visually-hidden">filters</span>
            </button>
        </section>
    
        `
    }

    renderFilters() {
        return this.data.filters.map(filter => {
            const onClick = () => this.toggle(filter)

            return html`
    
            <li class="filter">
                <span>${filter}</span>
                <button class="filter__btn" @click="${onClick}" aria-controls="jobs">
                    <span class="visually-hidden">Remove filter</span>
                </button>
            </li>
    
            `
        })
    }

    get() {
        return this.data.filters
    }

    toggle(filter) {
        const { filters } = this.data
        const index = filters.indexOf(filter)
        
        if (index < 0) filters.push(filter)
        else filters.splice(index, 1)
    }

    clear() {
        const filters = this.data.filters

        filters.splice(0, filters.length)
    }
}