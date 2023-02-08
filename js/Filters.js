import { reactive, html } from './arrow.js'

export class Filters {
    constructor() {
        this.storageKey = 'filters'
        this.defaultFilters = ['Frontend', 'CSS', 'JavaScript']

        this.data = reactive({
            filters: this.getFilters()
        })

        this.data.$on('filters', () => this.saveFilters())
    }

    getFilters() {
        const filters = localStorage.getItem(this.storageKey)

        return filters ? JSON.parse(filters) : this.defaultFilters
    }

    saveFilters() {
        const filters = JSON.stringify(this.data.filters)

        localStorage.setItem(this.storageKey, filters)
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
}