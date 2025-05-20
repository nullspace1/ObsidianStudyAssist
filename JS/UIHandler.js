class UIHandler {

    configure(app,page) {
        this.app = app;
        this.page = page;
    }

    button(name,action,params) {
        const {createButton} = this.app.plugins.plugins["buttons"];
        return createButton({
            app: this.app,
            el: this.page.container,
            args: { name: name },
            clickOverride: {
                click: action,
                params: params
            }
        });
    }

}