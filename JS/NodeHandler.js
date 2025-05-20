class NodeHandler {

    configure(dv, area, tags) {
        this.dv = dv;
        this.area = area;
        this.tags = tags || [];
        this.unfilteredPages = dv.pages().filter(p => this.isValidPage(p)).values;
        if (this.tags.length > 0) {
            this.pages = this.unfilteredPages
                .filter(p =>  p.tags != null && this.tags.every(t =>  p.tags.includes(t)));
        } else {
            this.pages = this.unfilteredPages;
        }
        this.today = new Date();
    }

    isValidPage(page) {
        return page && page.file && page.file.folder.startsWith(this.area) && page.file.path.endsWith('.md');
    }

    getVisibleChildren(page) {
        return this.pages
            .filter(p =>
                p.nodos &&
                p.nodos.some(n => n.path == page.file.path))
    }

    getAllChildren(page) {
        return this.unfilteredPages
            .filter(p =>
                p.nodos &&
                p.nodos.some(n => n.path == page.file.path))
    }

    getSiblings(page) {
        return this.pages.filter(p => {
            return p.nodos && !(p.file.path == page.file.path) && p.nodos.some(n => page.nodos && page.nodos.some(n2 => n2.path == n.path)) && !p.nodos.some(n => n.path == page.file.path);
        });
    }

    getRoots() {
        return this.pages.filter(p => {
            const nodos = p.nodos || [];
            const validNodos = nodos.filter(n => {  
                return n.path && this.pages.map(p => p.file.path).includes(n.path)
            });
            return validNodos.length == 0;;
        });
    }

    randomPage(pages) {
        return pages[Math.floor(Math.random() * pages.length)];
    }

    

}