class MetadataWriter {

    configure(dv,app) {
        this.dv = dv;
        this.app = app;
    }

    async write(path,fields) {
        const file = this.app.vault.getAbstractFileByPath(path);
        for (let field of fields) {
            await this.app.fileManager.processFrontMatter(file, (fm) => {
                fm[field.name] = field.value;
            });
        }
    }

    read(path,field) {
        const page = this.dv.page(path);
        return page[field] === undefined ? null : page[field];  
    }

}