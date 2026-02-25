import { Utils } from "./tableOfContents.js";


class BlogWebsite
{
    constructor()
    {
        this.blogId = 0 ;
        this.blogName = "Example" ;
        this.blogSlug = "Example" ;
        this.blogRepoLink = "https://www.example.com/" ;
        this.authors = [] ;
        this.init() ;
    }

    async init()
    {
        const blogContent = document.getElementById("blog-content") ;
        const showError = (msg) => { if (blogContent) blogContent.innerHTML = `<p class="loading" style="color:#c00">${msg}</p>` ; } ;
        try {
            this.getBlogId() ;
            await this.loadBlogInformation() ;
            await this.loadBlog() ;
            await this.loadTableOfContents() ;
            this.setUpEventListeners() ;
        } catch (e) {
            showError(`Failed to load blog: ${e && e.message ? e.message : e}`) ;
        }
    }

    getSiteBase()
    {
        const pathname = window.location.pathname || "" ;
        const i = pathname.indexOf("/pages/") ;
        if (i !== -1) return pathname.substring(0, i) + "/" ;
        return "/" ;
    }

    baseUrl(path)
    {
        const base = this.getSiteBase() ;
        return new URL(path.replace(/^\//, ""), window.location.origin + base).href ;
    }

    getBlogId()
    {
        const urlParams = new URLSearchParams(window.location.search) ;
        const idParam = urlParams.get("id") ;
        this.blogId = Number.parseInt(idParam,10) || 0 ;
    }

    async getBlogInformation()
    {
        const jsonUrl = new URL("../data/blogInformation.json", window.location.href).href ;
        const response = await fetch(jsonUrl) ;
        if (!response.ok) throw new Error(`blogInformation.json: ${response.status}`) ;

        const blogInformationList = await response.json() ;
        if(blogInformationList.length <= this.blogId) throw new Error("Incorrect blog Id.") ;
        const blogInformation = blogInformationList[this.blogId] ;

        this.blogName = blogInformation.name ;
        this.blogSlug = (blogInformation.slug && String(blogInformation.slug).trim()) || blogInformation.name ;
        this.blogRepoLink = (blogInformation.repoLink && String(blogInformation.repoLink).trim()) || "" ;
        this.authors = blogInformation.authors || [] ;
    }

    loadBlogTitle()
    {
        const displayName = this.blogName.replace(/_/g, " ") ;
        document.title = `${displayName} — Cangjie UK Team` ;
    }

    loadRepoLink()
    {
        const container = document.getElementById("repo-link-container") ;
        if (!container) return ;
        if (!this.blogRepoLink) {
            container.style.display = "none" ;
            container.setAttribute("hidden", "hidden") ;
            return ;
        }
        container.style.display = "" ;
        container.removeAttribute("hidden") ;
        const repoLinkElement = document.getElementById("repo-link") ;
        if (repoLinkElement) {
            const href = this.blogRepoLink ;
            repoLinkElement.href = /^https?:\/\//i.test(href) ? href : this.baseUrl(href.replace(/^\//, "")) ;
        }
    }

    loadAuthorsList()
    {
        const authorsListElement = document.getElementById("authors-list") ;
        authorsListElement.innerHTML = this.authors
        .map((author) => `<span class="author-tag">${author}</span>`)
        .join("") ;
    }

    async loadBlogInformation()
    {
        await this.getBlogInformation() ;
        this.loadBlogTitle() ;
        this.loadRepoLink() ;
        this.loadAuthorsList() ;
    }

    setUpEventListeners()
    {
        /* Nav bar matches homepage (Learn, Blogs, About); no Back button */
    }

    async loadBlog()
    {
        const blogContent = document.getElementById("blog-content") ;
        const url = new URL(`../blogsHTML/${this.blogSlug}.html`, window.location.href).href ;
        const response = await fetch(url) ;
        if (!response.ok) throw new Error(`Blog ${this.blogSlug}.html: ${response.status}`) ;
        const text = await response.text() ;
        blogContent.innerHTML = text ;
        this.embedYouTubeVideoLinks(blogContent) ;
        this.wrapBlogImages(blogContent) ;
    }

    getYouTubeVideoId(url)
    {
        if (!url || typeof url !== "string") return "" ;
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ;
        return m ? m[1] : "" ;
    }

    embedYouTubeVideoLinks(container)
    {
        if (!container) return ;
        const links = container.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]') ;
        const seen = new Set() ;
        links.forEach((a) => {
            const videoId = this.getYouTubeVideoId(a.href) ;
            if (!videoId) return ;
            const block = a.closest("p") ;
            if (!block || seen.has(block)) return ;
            const text = (block.textContent || "").toLowerCase() ;
            if (!text.includes("video link") && !text.includes("video link:")) return ;
            seen.add(block) ;
            const embedUrl = `https://www.youtube.com/embed/${videoId}` ;
            const embed = document.createElement("div") ;
            embed.className = "blog-youtube-embed" ;
            embed.innerHTML = `<div class="blog-youtube-embed-inner"><iframe src="${embedUrl}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>` ;
            block.parentNode.replaceChild(embed, block) ;
        }) ;
    }

    wrapBlogImages(container)
    {
        const maxW = container.clientWidth ;
        const images = Array.from(container.querySelectorAll("img")) ;
        images.forEach((img) => {
            const wrapper = document.createElement("div") ;
            wrapper.className = "blog-img-wrapper" ;
            img.parentNode.insertBefore(wrapper, img) ;
            wrapper.appendChild(img) ;
            const checkOversized = () => {
                const w = container.clientWidth || maxW ;
                if (w > 0 && img.naturalWidth > w) {
                    wrapper.classList.add("has-zoom") ;
                    wrapper.addEventListener("click", (e) => {
                        e.preventDefault() ;
                        this.openLightbox(img.currentSrc || img.src, img.alt) ;
                    }) ;
                }
            } ;
            if (img.complete) checkOversized() ;
            else img.addEventListener("load", checkOversized) ;
        }) ;
        this.ensureLightbox() ;
    }

    ensureLightbox()
    {
        if (this._lightbox) return ;
        const lb = document.createElement("div") ;
        lb.id = "blog-img-lightbox" ;
        lb.className = "blog-img-lightbox" ;
        const lbImg = document.createElement("img") ;
        lbImg.alt = "" ;
        lb.appendChild(lbImg) ;
        document.body.appendChild(lb) ;
        lb.addEventListener("click", (e) => { if (e.target === lb) this.closeLightbox() ; }) ;
        lbImg.addEventListener("click", () => this.closeLightbox()) ;
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && this._lightbox.classList.contains("is-open")) this.closeLightbox() ; }) ;
        this._lightbox = lb ;
        this._lightboxImg = lbImg ;
    }

    openLightbox(src, alt)
    {
        this._lightboxImg.src = src ;
        this._lightboxImg.alt = alt || "" ;
        this._lightbox.classList.add("is-open") ;
    }

    closeLightbox()
    {
        this._lightbox.classList.remove("is-open") ;
    }

    loadTableOfContents()
    {
        const container = document.getElementById("blog-content") ;
        const tocElement = document.getElementById("table-of-contents") ;
        const headingNodes = container.querySelectorAll("h1[id], h2[id], h3[id]") ;
        const headers = Array.from(headingNodes).map((el) => ({
            level: el.tagName === "H1" ? 1 : el.tagName === "H2" ? 2 : 3,
            text: el.textContent.trim(),
            id: el.id
        })) ;

        if (headers.length === 0)
        {
            tocElement.innerHTML = "<p class=\"no-toc\">No sections found</p>" ;
            return ;
        }
        const tocHTML = Utils.buildNestedListTOC(headers) ;
        tocElement.innerHTML = `<nav class="toc">${tocHTML}</nav>` ;

        this.enableScrollSpy(headers) ;
    }

    enableScrollSpy(headers)
    {
        const linkById = new Map()
        for (const h of headers) {
            const link = document.querySelector(`.toc a[href="#${h.id}"]`)
            if (link) linkById.set(h.id, link)
        }
        const container = document.getElementById('blog-content')
        const headings = Array.from(container.querySelectorAll('h1[id], h2[id], h3[id]'))
        const triggerOffset = 80

        const updateActive = () => {
            const scrollTop = container.scrollTop
            const viewTop = scrollTop + triggerOffset
            let activeId = null
            for (const h of headings) {
                if (h.offsetTop <= viewTop) activeId = h.id
            }
            document.querySelectorAll('.toc-link.active').forEach(el => el.classList.remove('active'))
            if (activeId) {
                const link = linkById.get(activeId)
                if (link) link.classList.add('active')
            }
        }

        container.addEventListener('scroll', updateActive, { passive: true })
        updateActive()
    }
}

document.addEventListener("DOMContentLoaded", () => {
  new BlogWebsite()
})
