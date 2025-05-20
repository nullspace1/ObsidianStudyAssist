class Estudiador {

    configure(pages){
        this.pages = pages;
        this.today = new Date();
    }

    getPagesToStudy(pages, visitedPages, intervals) {
        return pages.filter(p => !visitedPages.includes(p.file.path))
            .filter(p => this.shouldStudy(p, intervals, this.today));
    }

    shouldStudy(page, intervals, today) {
        const date = new Date(page.ultima_revision);
        const intervalDays = intervals[page.intervalIndex];
        const msInADay = 24 * 60 * 60 * 1000;
        date.setTime(date.getTime() + intervalDays * msInADay);
        return date.getTime() <= today.getTime();
    }

    getOverduePages(intervals, grace) {
        return this.pages.filter(p => {
            let shiftedToday = new Date();
            shiftedToday.setTime(this.today.getTime() - grace * 24 * 60 * 60 * 1000);
            return this.shouldStudy(p, intervals, shiftedToday) && p.intervalIndex > 0;
        });
    }

    getInterval(page, intervals) {
        if (page.intervalIndex < intervals.length) {
            return intervals[page.intervalIndex];
        }
        return Number.MAX_SAFE_INTEGER;
    }

    nextStudyDate(page, intervals) {
        const date = new Date(page.ultima_revision);
        const intervalDays = intervals[page.intervalIndex];
        const msInADay = 24 * 60 * 60 * 1000;
        date.setTime(date.getTime() + intervalDays * msInADay);
        const formatedDate = date.toLocaleDateString('en-GB');
        return formatedDate;
    }

}