---
area: Simulacion
reset: jhghj
tags: 
dias: "1"
nodos: 
selectedPagePath: Simulacion/Tipos de Analisis de Sistema.md
lastReset: jhghj
---

```dataviewjs
const curr = dv.current();
const targetArea = curr.area;
const today = new Date().toISOString().split('T')[0];
const daysLimit = curr.dias || 1;
const resetKey = curr.reset;
const tagFilters = curr.tags || [];
const nodoFilters = curr.nodos || [];

let selectedPagePath = curr.selectedPagePath || null;
let lastReset = curr.lastReset || null;

const wasRevisedWithinLimit = (page) => {
    if (!page.ultima_revision) return false;
    const lastRevision = new Date(page.ultima_revision);
    const diffTime = Math.abs(new Date() - lastRevision);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysLimit;
};

let pagesInArea = dv.pages()
    .filter(p => p.file.folder.startsWith(targetArea) && !wasRevisedWithinLimit(p));

if (tagFilters.length > 0) {
    pagesInArea = pagesInArea.filter(p => tagFilters.every(tag => p.tags && p.tags.includes(tag)));
}

if (nodoFilters.length > 0) {
    pagesInArea = pagesInArea.filter(p => p.nodos && nodoFilters.some(nodoFilter => p.nodos.some(nodo => nodo.path === nodoFilter.path)));
}

if (pagesInArea.length === 0) {
    dv.paragraph("No documents available to view based on the current filters.");
} else {
    if (!selectedPagePath || lastReset !== resetKey) {
        const selectedPage = pagesInArea[Math.floor(Math.random() * pagesInArea.length)];
        selectedPagePath = selectedPage.file.path;

        // Get the file object for the current document and update its frontmatter
        const currentFile = app.vault.getAbstractFileByPath(curr.file.path);
        await app.fileManager.processFrontMatter(currentFile, (fm) => {
            fm.selectedPagePath = selectedPagePath;
            fm.lastReset = resetKey;
        });

        const randomFile = app.vault.getAbstractFileByPath(selectedPagePath);
        await app.fileManager.processFrontMatter(randomFile, (fm) => {
            fm["ultima_revision"] = today;
        });
    }

    if (selectedPagePath) {
        const pageObj = dv.page(selectedPagePath);
        dv.header(2, `[[${pageObj.file.name}]]`);
        dv.paragraph(`![[${pageObj.file.name}]]`);

        const nodos = pageObj.nodos;
        if (nodos && nodos.length > 0) {
            dv.header(3, "Nodos Padre");
            dv.list(nodos);
        }

        const backlinks = dv.pages().filter(p => p.file.outlinks && p.file.outlinks.includes(pageObj.file.link));
        if (backlinks.length > 0) {
            dv.header(3, "Nodos Hijo");
            dv.list(backlinks.map(back => back.file.link));
        }

        if (pageObj.relacionado) {
            dv.header(3, "Relacionados");
            dv.list(pageObj.relacionado.map(rel => rel));
        }
    }
}
```
