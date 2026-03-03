export class Utils
{
    static copy(data)
    {
        return [...data]
    }

    static createAnchorId(text)
    {
        return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim()
    }

    static generateHeaders(markdownContent)
    {
        const lines = markdownContent.split("\n");
        const headers = [];
        let inCodeBlock = false;

        for (let line of lines)
        {
            if (/^```/.test(line)) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            if (inCodeBlock) continue;

            const match = line.match(/^(#{1,3})\s+(.*)$/);
            if (match)
            {
                const level = match[1].length;
                const text = match[2].trim();
                const id = Utils.createAnchorId(text);
                headers.push({ level, text, id });
            }
        }
        return headers;
    }

    static buildNestedListTOC(headers)
    {
        const tocHtml ="<ul class='toc-list'>" +
        headers.map((h) =>
            `<li class="toc-level-${h.level}">
            <a href="#${h.id}" class="toc-link">${h.text}</a>
            </li>`
        )
        .join("") + "</ul>";
        return tocHtml;
    }

    static parseDate(dateString)
    {
        if (!dateString || typeof dateString !== "string") return new Date(0)
        const parts = dateString.trim().split("/")
        if (parts.length !== 3) return new Date(0)
        const [day, month, year] = parts
        const y = Number(year), m = Number(month) - 1, d = Number(day)
        if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return new Date(0)
        return new Date(y, m, d)
    }

    static copyAndSort(dataRaw)
    {
        let data = Utils.copy(dataRaw)
        data.sort((a, b) =>
        {
            const dateA = Utils.parseDate(a.date)
            const dateB = Utils.parseDate(b.date)
            return dateB - dateA
        })
        return data
    }
}


