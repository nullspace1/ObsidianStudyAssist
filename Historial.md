---
dias: "10"
sort: desc
area: Simulacion
---

```dataviewjs
const daysLimit = dv.current().dias; // Number of days to filter recent pages
const sortOrder = dv.current().sort || 'desc'; // Sorting order
const targetArea = dv.current().area; // Area filter (top folder)
const today = new Date();

// Function to extract the topmost folder (area)
function getTopFolder(path) {
    const folders = path.split('/');
    return folders.length > 0 ? folders[0] : "No Folder";
}

// Get pages that have been accessed in the last X days, filter by area, and sort by 'ultima_revision'
const recentPages = dv.pages()
    .filter(p => p.ultima_revision) // Ensure the page has a 'ultima_revision' date
    .filter(p => (today - new Date(p.ultima_revision)) / (1000 * 60 * 60 * 24) <= daysLimit) // Filter by days
    .filter(p => p.file.folder.startsWith(targetArea)) // Filter by the current area
    .sort(p => p.ultima_revision, sortOrder); // Sort by last accessed date

// Manually group pages by topmost folder (area)
const groupedPages = {};
recentPages.forEach(p => {
    const area = getTopFolder(p.file.folder);
    if (!groupedPages[area]) {
        groupedPages[area] = [];
    }
    groupedPages[area].push(p);
});

// Display grouped pages by area
if (Object.keys(groupedPages).length > 0) {
    dv.header(2, targetArea);
    for (const [area, pages] of Object.entries(groupedPages)) {
        dv.table(
            ["Page", "Last Accessed"],
            pages.map(p => [`[[${p.file.name}]]`, p.ultima_revision])
        );
    }
} else {
    dv.paragraph(`No pages found in area: ${targetArea} within the last ${daysLimit} days.`);
}
```
