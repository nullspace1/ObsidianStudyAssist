---
area: Seguridad En Aplicaciones Web
nodo: 
tags:
---

```dataviewjs
class Node {
    constructor(path, pages, page, tags) {
        this.path = path;
        this.page = page || null;

        
        this.children = pages
            .filter(p => this.hasNode(p))
            .map(p => new Node(p.file.link.path, pages, p, tags));

        this.children = this.children.filter(child => child.isValid);

        this.isValid = this.hasTags(tags) || this.children.length > 0;
    }

    
    name() {
        const fileName = this.path.split('/').pop().replace('.md', '');
        return `[[${fileName}]]`;
    }

    
    references() {
        const referencesMap = new Map();

        if (this.page?.referencias) {
            this.page.referencias.forEach(ref => {
                const hash = this.generateHash(ref);
                referencesMap.set(hash, ref);
            });
        }

        this.children.forEach(child => {
            child.references().forEach((ref, hash) => {
                if (!referencesMap.has(hash)) {
                    referencesMap.set(hash, ref);
                }
            });
        });

        return referencesMap;
    }

    daysSinceLastAccess() {
        if (!this.page?.ultima_revision) return "Unknown";
        const lastAccess = new Date(this.page.ultima_revision);
        const diffDays = Math.ceil((new Date() - lastAccess) / (1000 * 60 * 60 * 24));
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    }

    related() {
        return this.page?.relacionado ?? [];
    }

    
    tableEntry() {
        return [
            this.name(),
            this.listReferences(),
            this.related(),
            this.children.map(child => child.name()),
            this.daysSinceLastAccess()
        ];
    }

    findNode(path) {
        if (this.path === path) return this;
        for (const child of this.children) {
            const found = child.findNode(path);
            if (found) return found;
        }
        return null;
    }

    hasNode(page) {
        return page.nodos?.some(n => n.path === this.path);
    }

    hasTags(tags) {
        if (!tags || tags.length === 0) return true;
        if (!this.page || !this.page.tags) return false; 
        return this.page.tags.some(tag => tags.includes(tag));
    }

    generateHash(link) {
        return link
            .split('')
            .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) & 0x7fffffff, 0)
            .toString(16)
            .substring(0, 6);
    }

    listReferences() {
        return Array.from(this.references().keys()).map(
            hash => `[${hash}](${this.references().get(hash)})`
        );
    }
}

function isRoot(link) {
    const page = dv.page(link);
    return !page || (!page.nodos || page.nodos.length === 0);
}

function combineReferences(nodes) {
    const referencesMap = new Map();
    nodes.forEach(node => {
        node.references().forEach((ref, hash) => {
            if (!referencesMap.has(hash)) {
                referencesMap.set(hash, ref);
            }
        });
    });
    return referencesMap;
}

function displayReferences(nodes) {
    const referencesMap = combineReferences(nodes);
    if (referencesMap.size > 0) {
        dv.header(2, "References");
        dv.table(
            ["Hash", "Reference"],
            Array.from(referencesMap.entries()).map(([hash, ref]) => [hash, ref])
        );
    }
}


const self = dv.current();
const tags = self.tags ?? [];
if (self.area) {
    const getPage = path => dv.page(path) ?? null;
    const headerTable = ["Name", "References", "Related", "Children", "Last Access"];
    const pages = dv.pages().filter(p => p.file.path.startsWith(self.area));

    
    const rootNodes = [...new Set(
        pages.flatMap(p => p.nodos ?? [])
        .filter(nodo => isRoot(nodo))
        .map(n => n.path)
    )]
    .map(path => new Node(path, pages, getPage(path), tags))
    .filter(node => node.isValid);

    
    const independentNodes = [...new Set(
        pages.filter(p => !p.nodos || p.nodos.length === 0)
        .map(p => p.file.link.path)
    )]
    .map(path => new Node(path, pages, getPage(path), tags))
    .filter(node => node.isValid);

    
    if (self.nodo) {
        let foundNode = null;
        for (const root of rootNodes) {
            foundNode = root.findNode(self.nodo.path);
            if (foundNode) break;
        }
        if (foundNode) {
            dv.header(2, foundNode.name());
            if (foundNode.children.length > 0) {
                dv.table(headerTable, foundNode.children.map(n => n.tableEntry()));
                foundNode.children.forEach(child => {
                    if (child.children.length > 0) {
                        dv.header(3, child.name());
                        dv.table(headerTable, child.children.map(subChild => subChild.tableEntry()));
                    }
                });
                displayReferences([foundNode]);
            }
        }
    }

    
    dv.paragraph('---');
    dv.header(1, "Main Nodes");
    dv.table(headerTable, rootNodes.map(n => n.tableEntry()));

    dv.header(2, "Hierarchy");
    rootNodes.forEach(root => {
        dv.header(3, root.name());
        dv.table(headerTable, root.children.map(n => n.tableEntry()));
    });
    displayReferences(rootNodes);

    dv.paragraph("\n\n---\n\n");
    dv.header(1, "Independent Nodes");
    dv.table(headerTable, independentNodes.map(n => n.tableEntry()));
    displayReferences(independentNodes);
}
```
