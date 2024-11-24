---
area: Plataformas de Virtualizacion
reset: 124
tags: 
intervals:
  - "0"
  - "1"
  - "3"
  - "7"
  - "12"
  - "30"
  - "45"
nodos: 
revisitInterval: 4
startingNode: 
---

```dataviewjs
// Import the required plugins
const { createButton } = app.plugins.plugins["buttons"];

const currFilePath = dv.current().file.path;
const metadataFilePath = 'Resources/EstudiadorData';
let metadataPage = dv.page(metadataFilePath);

if (!metadataPage) {
    dv.paragraph(`Error: Metadata file '${metadataFilePath}' not found.`);
    return;
}

const metadataFileFullPath = app.vault.getAbstractFileByPath(metadataFilePath + '.md');

// Function to increment the 'reset' value
async function incrementReset() {
    const file = app.vault.getAbstractFileByPath(currFilePath);
    await app.fileManager.processFrontMatter(file, (fm) => {
        fm.reset = (fm.reset || 0) + 1;
    });
    app.workspace.activeLeaf.update();
}



// Function to reset the study session
async function resetSession() {
    await app.fileManager.processFrontMatter(metadataFileFullPath, (fm) => {
        fm.visitedPages = [];
        fm.traversalStack = [];
        fm.selectedPagePath = null;
        fm.lastReset = null;
        fm.pagesSinceLastRevisit = 0;
    });
    app.workspace.activeLeaf.update();
}

// Create the 'Increment Reset' button
const incrementButton = createButton({
    app,
    el: this.container,
    args: { name: "Next Note" },
    clickOverride: {
        click: incrementReset,
        params: []
    }
});

// Create the 'Reset Study Session' button
const resetButton = createButton({
    app,
    el: this.container,
    args: { name: "Reset Study Session" },
    clickOverride: {
        click: resetSession,
        params: []
    }
});

// Display the buttons
dv.paragraph(incrementButton);
dv.paragraph(resetButton);

// Main script starts here
const curr = dv.current();
const targetArea = curr.area;
const today = new Date().toISOString().split('T')[0];
const resetKey = curr.reset;
const tagFilters = curr.tags || [];
const nodoFilters = curr.nodos || [];
const intervals = curr.intervals ? curr.intervals : [1, 3, 5, 7];

let selectedPagePath = metadataPage.selectedPagePath || null;
let lastReset = metadataPage.lastReset || null;
let visitedPages = metadataPage.visitedPages || [];
let lastTargetArea = metadataPage.lastTargetArea || null;
let pagesSinceLastRevisit = metadataPage.pagesSinceLastRevisit || 0;
let traversalStack = metadataPage.traversalStack || [];
const revisitInterval = curr.revisitInterval || 5;

function isDueForReview(page) {
    // If the page lacks 'ultima_revision' or 'intervalIndex', consider it due for review
    if (!page.ultima_revision || page.intervalIndex === undefined) return true;
    const lastRevisionDate = new Date(page.ultima_revision);
    let idx = page.intervalIndex;
    if (idx >= intervals.length) idx = intervals.length - 1;
    const intervalDays = intervals[idx];
    const nextReviewDate = new Date(lastRevisionDate.getTime() + intervalDays * 86400000); // 86400000 ms in a day
    return nextReviewDate <= new Date();
}

function getChildren(nodePath) {
    let page = dv.page(nodePath);
    if (!page) return [];
    let backlinks = dv.pages().filter(p => p.nodos && p.nodos.some(n => n.path == page.file.path));
    return backlinks
        .filter(p => !visitedPages.includes(p.file.path))
        .filter(p => isDueForReview(p)) // Only include pages that are due
        .map(p => p.file.path);
}

function nodeHasParentInFilter(page, visited = new Set()) {
    if (!page) return false;
    if (visited.has(page.file.path)) return false;
    visited.add(page.file.path);
    if (nodoFilters.some(nf => page.file.path === nf.path)) return true;
    if (page.nodos && page.nodos.length > 0) {
        return page.nodos.some(np => {
            let parentPage = dv.page(np);
            if (!parentPage) return false;
            return nodeHasParentInFilter(parentPage, visited);
        });
    }
    return false;
}

let pagesInArea = dv.pages().filter(p => p.file.folder.startsWith(targetArea) && p.nodos);

async function resetAllPages() {
	for(let i = 0; i < pagesInArea.length; i++){
		const file = app.vault.getAbstractFileByPath(pagesInArea[i].file.path);
	    await app.fileManager.processFrontMatter(file, (fm) => {
	        fm.intervalIndex = 0;
	    });
	}
}

const resetAllButton = createButton({
    app,
    el: this.container,
    args: { name: "Reset ALL Pages" },
    clickOverride: {
        click: resetAllPages,
        params: []
    }
});

if (tagFilters.length > 0) {
    pagesInArea = pagesInArea.filter(p =>
        tagFilters.every(tag => p.tags && p.tags.includes(tag))
    );
}

if (nodoFilters.length > 0) {
    pagesInArea = pagesInArea.filter(p => nodeHasParentInFilter(p));
}

let duePages = pagesInArea.filter(p => isDueForReview(p));

dv.paragraph(`Paginas Faltantes: ${duePages.length}`)

if (targetArea !== lastTargetArea) {
    visitedPages = [];
    selectedPagePath = null;
    lastReset = null;
    pagesSinceLastRevisit = 0;
    traversalStack = [];
    await app.fileManager.processFrontMatter(metadataFileFullPath, (fm) => {
        fm.lastTargetArea = targetArea;
        fm.visitedPages = visitedPages;
        fm.selectedPagePath = selectedPagePath;
        fm.lastReset = lastReset;
        fm.pagesSinceLastRevisit = pagesSinceLastRevisit;
        fm.traversalStack = traversalStack;
    });
}

if (!selectedPagePath || lastReset !== resetKey) {

	pagesSinceLastRevisit = (pagesSinceLastRevisit || 0) + 1;

    if (duePages.length === 0) {
        dv.paragraph("No more pages are due for review!");
        traversalStack = [];
        selectedPagePath = null;
    } else {

	if (pagesSinceLastRevisit >= revisitInterval && visitedPages.length > 1) {
		pagesSinceLastRevisit = 0;
	    let oldPages = visitedPages.slice(0, visitedPages.length - 1);
	    if (oldPages.length > 0) {
        // Select a random index with a bias towards earlier indices
	        let index = Math.floor( (Math.random() ** 2) * oldPages.length);
	        let revisitPagePath = oldPages[index];
	
	        // Perform swap directly on visitedPages
	        if (index + 1 < visitedPages.length) {
	            let temp = visitedPages[index + 1];
	            visitedPages[index + 1] = visitedPages[index];
	            visitedPages[index] = temp;
		        }
	// Fetch the page and check if it is due for review
		        let revisitPage = dv.page(revisitPagePath);
		        if (revisitPage) {
		            selectedPagePath = revisitPage.file.path;// Optionally, do not update the intervalIndex for revisited pages
			    }
			}
		} else {

        if (traversalStack.length === 0) {
            // Randomly select a starting node from duePages
            let availableStartNodes = duePages.filter(p =>!visitedPages.includes(p.file.path) && !p.nodos.some(n => dv.page(n.path) && duePages.includes(dv.page(n.path)) && !visitedPages.includes(n.path)));
            if (availableStartNodes.length > 0) {
                let randomIndex = Math.floor(Math.random() * availableStartNodes.length);
                let startNode = availableStartNodes[randomIndex];
                traversalStack.push({
                    node: startNode.file.path,
                    children: [], // We'll get children when we visit this node
                });
                // Save traversal stack to metadata
                await app.fileManager.processFrontMatter(metadataFileFullPath, (fm) => {
                    fm.traversalStack = traversalStack;
                });
            } else {
                dv.paragraph("No more pages to study!");
            traversalStack = [];
            }
        }

        let foundNextPage = false;
        while (traversalStack.length > 0) {
            let current = traversalStack.pop(); // Pop the node from the stack
            let page = dv.page(current.node);

            if (!page) continue;

            // Skip pages that are not due or already visited
            if (!isDueForReview(page) || visitedPages.includes(page.file.path)) {
                continue;
            }

            // Visit the page
            selectedPagePath = page.file.path;
            visitedPages.push(selectedPagePath);

            // Update page's review information

            const selectedFile = app.vault.getAbstractFileByPath(selectedPagePath);
            await app.fileManager.processFrontMatter(selectedFile, (fm) => {
                fm["ultima_revision"] = today;
                let idx = fm.intervalIndex !== undefined ? fm.intervalIndex : -1;
                idx += 1;
                if (idx >= intervals.length) idx = intervals.length - 1;
                fm.intervalIndex = idx;
            });

            foundNextPage = true;

            // Get children and push them onto the stack
            let children = getChildren(page.file.path);
            for (let childPath of children) {
                traversalStack.push({
                    node: childPath,
                });
            }

            // Save traversal stack to metadata
            await app.fileManager.processFrontMatter(metadataFileFullPath, (fm) => {
                fm.traversalStack = traversalStack;
            });

            break; // We've found the next page to display
        }

        if (!foundNextPage) {
            // No more pages in traversal stack
            traversalStack = [];
            selectedPagePath = null;
            await app.fileManager.processFrontMatter(metadataFileFullPath, (fm) => {
                fm.traversalStack = traversalStack;
            });
        }

        // Revisit Logic: Revisit an old page every N revisions
        

        // Update metadata with selected page and traversal state
        
        }
    await app.fileManager.processFrontMatter(metadataFileFullPath, (fm) => {
            fm.selectedPagePath = selectedPagePath;
            fm.lastReset = resetKey;
            fm.visitedPages = visitedPages;
            fm.lastTargetArea = targetArea;
            fm.pagesSinceLastRevisit = pagesSinceLastRevisit;
            fm.traversalStack = traversalStack;
        });
    }
}

if (selectedPagePath) {
    const pageObj = dv.page(selectedPagePath);

    if (pageObj.preguntas && pageObj.preguntas.length > 0) {
        dv.header(1, "Preguntas");
        dv.list(pageObj.preguntas);
    }
    dv.header(2, `[[${pageObj.file.name}]]`);
    dv.paragraph(`![[${pageObj.file.name}]]`);
    const nodos = pageObj.nodos;
    if (nodos && nodos.length > 0) {
        dv.header(3, "Nodos Padre");
        dv.list(nodos);
    }
    const backlinks = dv.pages().filter(p => p.nodos && p.nodos.some(n => n.path == pageObj.file.path));
    if (backlinks.length > 0) {
        dv.header(3, "Nodos Hijo");
        dv.list(backlinks.map(back => back.file.link));
    }
    if (pageObj.relacionado) {
        dv.header(3, "Relacionados");
        dv.list(pageObj.relacionado);
    }

	dv.paragraph("-----------")

    dv.paragraph(`Proxima review: ${new Date(new Date(pageObj.ultima_revision).getTime() + 86400000 * intervals[pageObj.intervalIndex]).toLocaleDateString('en-GB')}`)
}

dv.paragraph("------------")

dv.paragraph(resetAllButton)


```
