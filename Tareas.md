---
areas: 
importantes: false
review_filter:
  - Proyecto Final
  - PIS
  - Administracion Gerencial
  - Sistemas de Costos y Presupuesto
---

```dataviewjs
const areas = dv.current().areas ?? [];
const importantes = dv.current().importantes;

let tasks = dv.pages()
    .filter(p => areas.length === 0 ? !p.file.path.startsWith('Templates') : areas.some(m => p.file.path.startsWith(m)))
    .file.tasks
    .filter(t => !t.completed && t.para)
    .filter(t => importantes ? t.importante == "si": true)
    .map(t => {
        const cleanText = t.text.replace(/\[para::[^\]]*\]/, '').replace(/\[importante::[^\]]*\]/, '').trim();
        const dueDateString = t.para.trim();
        let timeRemaining = "unknown";
        let timeInDays = 999999;
        let important = t.importante == "si" ? "**" : "";

        const dateParts = dueDateString.split('-');
        if (dateParts.length === 3) {
            const [day, month, year] = dateParts.map(Number);
            const dueDate = new Date(year, month - 1, day);
            if (!isNaN(dueDate.getTime())) {
                const now = new Date();
                const diffTime = dueDate - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                timeRemaining = diffDays >= 0 ? `${diffDays} ${diffDays == 1 ? 'dia' : 'dias'}` : `Pasado por ${-diffDays} ${-diffDays == 1 ? 'dia' : 'dias'}`;
                timeInDays = diffDays;
            }
        }

        return {
            text: `${important}${cleanText}${important}`,
            due: dueDateString,
            timeRemaining: timeRemaining,
            sortBy: timeInDays,
            link: t.path.split('/').pop().split('.')[0],
            area: t.path.split('/')[0]
        };
    })

tasks = [...tasks].sort((a, b) => a.sortBy - b.sortBy);

dv.paragraph(`Cantidad de tareas: ${tasks.length}`)
dv.paragraph(`Cantidad de tareas prioritarias: ${tasks.filter(t => t.text.includes("**")).length}` )
// Sort in ascending order by sortBy value

// Now, render the tasks in the correct order
dv.header(1, "Tareas");
if (tasks.length > 0) {
    const tableHeader = "| Task | Area | Fecha de Entrega | Tiempo Restante | Archivo |\n";
    const tableSeparator = "| --- | --- | --- | --- | --- |\n";
    const tableRows = tasks.map(t => `| ${t.text} | ${t.area} | ${t.due} | ${t.timeRemaining == "0 dias" ? "**HOY**" : t.timeRemaining} | [[${t.link}]] |\n`).join("");
    
    dv.el("div", tableHeader + tableSeparator + tableRows);
} else {
    dv.paragraph("Sin tareas :)");
}
```

# Checker

```dataview
TASK
WHERE !completed AND para != null AND !contains(path, "Templates")
SORT date(para) ASC
```

# Reviews

```dataviewjs

const estudiadorPage = dv.page("Estudiador")
const current = dv.current()

const intervals = estudiadorPage.intervals

const pages = dv.pages().filter(p => current.review_filter.some(rf => p.file.path.startsWith(rf) && p.nodos))

const map = new Map()


for (const page of pages) { 
     const folder = page.file.path.split("/")[0]
     map.set(folder,[...(map.get(folder) || []), page])
}

  

function isDueForReview(page) {// If the page lacks 'ultima_revision' or 'intervalIndex', consider it due for review
    if (!page.ultima_revision || page.intervalIndex === undefined) return true;
    const lastRevisionDate = new Date(page.ultima_revision);
    let idx = page.intervalIndex;
    if (idx >= intervals.length) idx = intervals.length - 1;
    const intervalDays = intervals[idx];
    const nextReviewDate = new Date(0); 
    nextReviewDate.setTime(lastRevisionDate.getTime() + intervalDays * 1000 * 60 * 60 * 24)// 86400000 ms in a day
    return nextReviewDate.getTime() <= new Date().getTime();
}

  

for (const [folder, pages] of map) {

    dv.paragraph(`${folder}: ${pages.filter(p => isDueForReview(p)).length}`)

}


```
