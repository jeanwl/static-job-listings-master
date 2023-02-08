import { reactive, html } from './arrow.js'

export default class Jobs {
    constructor(filters) {
        this.filters = filters

        this.data = reactive({
            jobs: [],
            jobsAreLoading: "true"
        })

        this.init()
    }

    async init() {
        // await new Promise(r => setTimeout(r, 4000))

        this.data.jobs = await this.getJobs()
        
        this.data.jobsAreLoading = "false"
    }

    async getJobs() {
        const url = 'data.json'

        // manage error empty jobsList reload button?
        const jobs = await (await fetch(url)).json()

        for (const job of jobs) {
            const keywords = [job.role, job.level, ...job.languages.concat(job.tools)]
            
            job.keywords = keywords.filter(Boolean)
        }

        return jobs
    }

    getFilteredJobs() {
        const filters = this.filters.get()

        return filters.length == 0
            ? [...this.data.jobs]
            : this.data.jobs.filter(job =>
                filters.every(filter => job.keywords.includes(filter))
            )
    }

    render() {
        const ariaBusy = () => this.data.jobsAreLoading
        const reactiveJobs = () => this.renderJobs()

        return html`

        <section id="jobs" aria-live="polite" aria-busy="${ariaBusy}">
            <h2 class="visually-hidden">Jobs Listing</h2>

            <div class="jobs__loader">
                <span class="visually-hidden">Jobs are loading</span>

                <div class="loader__circle"></div>
                <div class="loader__circle"></div>
                <div class="loader__circle"></div>
            </div>

            <ul class="jobs">${reactiveJobs}</ul>
        </section>

        `
    }

    renderJobs() {
        return this.getFilteredJobs().map((job, i) => {
            const classList = `job${job.featured ? ' job--featured' : ''}`
            const renderDescription = this.renderDescription(job)
            const renderKeywords = this.renderKeywords(job)

            return html`
    
            <li class="${classList}" style="--rank: ${i}">
                <article class="job__wrapper">
                    <h3 class="visually-hidden">${job.position} at ${job.company}</h3>

                    ${renderDescription}
                    ${renderKeywords}
                </article>
            </li>
    
            `.key(Math.random())
        })
    }

    renderDescription(job) {
        const renderTags = this.renderTags(job)

        const logo = job.logo ? html`
        
        <img src="${job.logo}" alt="${job.company} Logo" class="job__logo">
        
        ` : ''

        return html`

        <section class="job__description">
            <h4 class="visually-hidden">Job description</h4>

            ${logo}

            <div class="job__main">
                <div class="job__top">
                    ${renderTags}
                    
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
        console.log('render keywords')

        if (keywords.length == 0) return ''

        const reactiveKeywords = () => this.renderKeywordsList(keywords)

        return html`
        
        <section class="job__keywords">
            <h4 class="visually-hidden">Job keywords</h4>

            <ul class="keywords__list">${reactiveKeywords}</ul>
        </section>

        `
    }

    renderKeywordsList(keywords) {
        const filters = this.filters.get()
        
        return keywords.map(keyword => {
            const onClick = () => this.filters.toggle(keyword)
            const isPressed = filters.includes(keyword)
            const label = `${isPressed ? 'Remove from' : 'Add to'} filters`
            
            return html`
    
            <li class="job__keyword">
                <span class="visually-hidden">${keyword}</span>
                
                <button class="keyword__btn" @click="${onClick}"
                    aria-pressed="${isPressed}"
                    aria-controls="jobs">
                    <span class="visually-hidden">${label}</span>
                    <span aria-hidden="true">${keyword}</span>
                </button>
            </li>
    
            `.key(Math.random())
        })
    }
}