import { Utils } from "./tableOfContents.js"


let allProjectsRaw = []
let allProjects = []
let showingAll = false
let activeTag = null
const INITIAL_DISPLAY_COUNT = 6

function getYouTubeVideoId(url) {
    if (!url || typeof url !== "string") return ""
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : ""
}

function formatDateForDisplay(dmy)
{
    if (!dmy || typeof dmy !== "string") return ""
    const parts = dmy.trim().split("/")
    if (parts.length !== 3) return ""
    const day = Number(parts[0]), month = Number(parts[1]), year = Number(parts[2])
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return ""
    const date = new Date(year, month - 1, day)
    if (Number.isNaN(date.getTime())) return ""
    const fmt = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" })
    return fmt.format(date)
}

async function loadNews()
{
    const container = document.getElementById("news-container")
    if (!container) return
    try
    {
        const response = await fetch("data/newsInformation.json")
        const list = await response.json()
        container.innerHTML = list.map((item, index) => {
            const dateStr = formatDateForDisplay(item.date)
            return `<a href="pages/newsTemplate.html?id=${index}" class="news-item"><span class="news-item-title">${item.title}</span><span class="news-item-date">${dateStr}</span></a>`
        }).join("")
    }
    catch (e)
    {
        container.innerHTML = "<p class=\"news-empty\">No news yet.</p>"
    }
}

async function loadProjects()
{
    const response = await fetch("data/blogInformation.json")
    allProjectsRaw = await response.json()
    allProjects = Utils.copyAndSort(allProjectsRaw)
    displayProjects()
}

function displaySingleProject(project, projectsContainer)
{
    const blogId = allProjectsRaw.indexOf(project)
    const projectCard = document.createElement("a")
    projectCard.className = "project-card"
    projectCard.href = `pages/blogTemplate.html?id=${blogId}`

    const tags = Array.isArray(project.tags) ? project.tags : []
    const description = project.description || ""
    const descriptionImage = project.descriptionImage || ""
    const descriptionVideo = project.descriptionVideo || ""
    const dateStr = project.date ? formatDateForDisplay(project.date) : ""

    const videoId = getYouTubeVideoId(descriptionVideo)
    const videoTitle = (project.name || "").length > 55 ? (project.name || "").substring(0, 52) + "..." : (project.name || "")
    const videoDesc = (description || "").length > 90 ? (description || "").substring(0, 87) + "..." : (description || "")

    const descriptionBlock = (description || descriptionImage)
        ? `<div class="project-summary${descriptionImage ? " project-summary-with-image" : ""}">${description ? `<p class="project-summary-text">${description}</p>` : ""}${descriptionImage ? `<div class="project-summary-thumb"><img src="${descriptionImage}" alt="${description || project.name}" loading="lazy"></div>` : ""}</div>`
        : ""

    const videoBlock = videoId
        ? `<div class="project-video-preview" data-video-id="${videoId}" role="button" tabindex="0">
            <div class="project-video-thumb"><img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt=""><span class="project-video-play" aria-hidden="true"></span></div>
            <div class="project-video-meta"><span class="project-video-source">youtube.com</span><strong class="project-video-title">${videoTitle.replace(/</g, "&lt;")}</strong><span class="project-video-desc">${videoDesc.replace(/</g, "&lt;")}</span></div>
          </div>`
        : ""

    projectCard.innerHTML = `
    <h3>${project.name}</h3>
    ${dateStr ? `<p class="project-date">${dateStr}</p>` : ""}
    ${descriptionBlock}
    ${videoBlock}
    ${tags.length ? `<div class="project-tags">${tags.map(t => `<span class="tag">${t}</span>`).join(" ")}</div>` : ""}
    `
    projectsContainer.appendChild(projectCard)

    if (videoId) {
        const preview = projectCard.querySelector(".project-video-preview")
        if (preview && !preview.classList.contains("project-video-playing")) {
            const playInline = (e) => {
                e.preventDefault()
                e.stopPropagation()
                if (preview.classList.contains("project-video-playing")) return
                preview.classList.add("project-video-playing")
                preview.removeAttribute("role")
                preview.removeAttribute("tabindex")
                const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`
                preview.innerHTML = `<div class="project-video-embed"><iframe src="${embedUrl}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><span class="project-video-from">From youtube.com</span></div>`
            }
            preview.addEventListener("click", playInline)
            preview.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playInline(e) } })
        }
    }
}

function displayProjects()
{
    const projectsContainer = document.getElementById("projects-container")
    const showMoreContainer = document.getElementById("show-more-container")

    projectsContainer.innerHTML = ""

    const source = activeTag
        ? allProjects.filter(p => Array.isArray(p.tags) && p.tags.includes(activeTag))
        : allProjects
    const projectsToShow = showingAll ? source : source.slice(0, INITIAL_DISPLAY_COUNT)

    for(const project of projectsToShow) displaySingleProject(project, projectsContainer)

    if (source.length > INITIAL_DISPLAY_COUNT)
    {
        showMoreContainer.style.display = "block"
        const showMoreBtn = document.getElementById("show-more-btn")
        showMoreBtn.textContent = showingAll
        ? "Show Less"
        : `Show More (${source.length - INITIAL_DISPLAY_COUNT} more)`
    }
    else
    {
        showMoreContainer.style.display = "none"
    }
}

function buildTagChips()
{
    const tagContainer = document.getElementById("tag-chips")
    if (!tagContainer) return
    const tagSet = new Set()
    for (const p of allProjects) {
        if (Array.isArray(p.tags))
            for (const t of p.tags) tagSet.add(t)
    }
    tagContainer.innerHTML = ""
    const tags = Array.from(tagSet).sort()
    for (const tag of tags) {
        const chip = document.createElement("button")
        chip.type = "button"
        chip.className = "tag"
        chip.textContent = tag
        chip.addEventListener("click", () => {
            activeTag = activeTag === tag ? null : tag
            for (const el of tagContainer.querySelectorAll(".tag"))
                el.classList.toggle("active", el.textContent === activeTag)
            showingAll = false
            displayProjects()
        })
        tagContainer.appendChild(chip)
    }
}

function toggleShowMore()
{
    showingAll = !showingAll
    displayProjects()
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadProjects().then(() => buildTagChips())
  loadNews()
})

window.toggleShowMore = toggleShowMore
