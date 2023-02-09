import { reactive, html } from './lib/arrow.js'

export class Jobs {
    constructor(filters) {
        this.demoError = location.search.includes('error')
        
        this.filters = filters
        this.jobs = []
        this.url = this.demoError ? 'wrong.json' : 'data.json'

        this.data = reactive({
            filteredJobs: [],
            jobsAreLoading: true
        })

        this.loadJobs()

        filters.init(this)
    }

    filterJobs() {
        const filters = this.filters.get()

        this.data.filteredJobs = filters.length == 0
            ? [...this.jobs]
            : this.jobs.filter(job =>
                filters.every(filter => job.keywords.includes(filter))
            )
    }

    async loadJobs() {
        this.data.jobsAreLoading = true
        
        const artificialLatency = 3000

        await new Promise(r => setTimeout(r, artificialLatency))

        const jobs = await this.getJobs()

        if (jobs) this.jobs = jobs

        this.data.jobsAreLoading = false

        this.filterJobs()

        if (this.demoError) this.url = 'data.json'
    }

    async getJobs() {
        try {
            const jobs = await (await fetch(this.url)).json()

            for (const job of jobs) {
                const keywords = [job.role, job.level, ...job.languages.concat(job.tools)]
                
                job.keywords = keywords.filter(Boolean)
            }

            return jobs
        } catch {
            return false
        }
    }

    render() {
        const isEmpty = () => this.data.filteredJobs.length == 0

        return html`

        <section id="jobs" aria-live="polite" data-empty="${isEmpty}"
            aria-busy="${() => this.data.jobsAreLoading}">
            <h2 class="visually-hidden">Jobs Listing</h2>

            <div class="jobs__loader">
                <span class="visually-hidden">Jobs are loading</span>

                <div class="loader__circle"></div>
                <div class="loader__circle"></div>
                <div class="loader__circle"></div>
            </div>

            <ul class="jobs">${() => this.renderJobs()}</ul>

            <div class="jobs__error">
                <p>There was an error loading jobs.</p>
                <button class="keyword__btn jobs__reload" @click="${() => this.loadJobs()}">
                    Reload jobs
                </button>
            </div>
        </section>

        `
    }

    renderJobs() {
        return this.data.filteredJobs.map((job, i) => {
            const isFeatured = job.featured == true
            
            return html`
    
            <li class="job" data-featured="${isFeatured}" style="--rank: ${i}">
                <article class="job__wrapper">
                    <h3 class="visually-hidden">${job.position} at ${job.company}</h3>

                    ${this.renderDescription(job)}
                    ${this.renderKeywords(job)}
                </article>
            </li>
    
            `
        })
    }

    renderDescription(job) {
        const logo = job.logo ? html`
        
        <img src="${job.logo}" alt="${job.company} Logo" class="job__logo">
        
        ` : ''

        return html`

        <section class="job__description">
            <h4 class="visually-hidden">Job description</h4>

            ${logo}

            <div class="job__main">
                <div class="job__top">
                    ${this.renderTags(job)}
                    
                    <p class="job__company">
                        <span class="visually-hidden">Company</span>
                        ${job.company}
                    </p>
                </div>

                <p class="job__position">
                    <span class="visually-hidden">Position</span>
                    <a class="job__link" href="#">${job.position}</a>
                </p>

                <div class="job__bot">
                    <p class="job__bot__item job__posted">
                        <span class="visually-hidden">Posted</span>
                        ${job.postedAt}
                    </p>

                    <p class="job__bot__item job__contract">
                        <span class="visually-hidden">Contract type</span>
                        ${job.contract}
                    </p>

                    <p class="job__bot__item job__location">
                        <span class="visually-hidden">Location</span>
                        ${job.location}
                    </p>
                </div>
            </div>
        </section>

        `
    }

    renderTags(job) {
        if (!(job.new || job.featured)) return ''

        const tagNew = job.new ? html`
        
        <span class="job__tag job__tag--new">New</span>
        
        ` : ''

        const tagFeatured = job.featured ? html`

        <span class="job__tag job__tag--featured">Featured</span>

        ` : ''

        return html`

        <p class="job__tags">
            <span class="visually-hidden">Tags</span>
            ${tagNew}
            ${tagFeatured}
        </p>

        `
    }

    renderKeywords(job) {
        const keywords = job.keywords

        if (keywords.length == 0) return ''

        return html`
        
        <section class="job__keywords">
            <h4 class="visually-hidden">Job keywords</h4>

            <ul class="keywords__list">${this.renderKeywordsList(keywords)}</ul>
        </section>

        `
    }

    renderKeywordsList(keywords) {
        console.log('renderKeywordsList')

        return keywords.map(keyword => {
            const isPressed = () => this.filters.get().includes(keyword) ? 'true' : 'false'
            
            return html`
    
            <li class="job__keyword">
                <span class="visually-hidden">${keyword}</span>
                
                <button class="keyword__btn" @click="${() => this.filters.toggle(keyword)}"
                    aria-pressed="${isPressed}"
                    aria-controls="jobs">
                    <span class="visually-hidden">Filter ${keyword}</span>
                    <span aria-hidden="true">${keyword}</span>
                </button>
            </li>
    
            `
        })
    }
}