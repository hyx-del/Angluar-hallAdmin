import { Component, DoCheck, Input } from '@angular/core';

@Component({
    selector: 'content-header',
    templateUrl: 'nc.content.header.html',
    styleUrls: ['nc.content.header.scss'],
})
export class NcContentHeader implements DoCheck {
    public buttonOptions: any = {};

    @Input() collection: any = {};
    @Input() pageSizeList: number[] = [20, 30, 50, 100];
    @Input() buttonGroups: any[];
    @Input() showButtonGroup: boolean = true;
    @Input() showExtraCondition: boolean;
    @Input() moreText: string;

    constructor() {
    }

    public ngDoCheck() {
        if (this.buttonGroups) {
            this.buttonOptions = {show: []};
            this.buttonGroups.forEach((item: any) => {
                if (this.toBool(item.hidden)) return;
                if (item.name) {
                    this.buttonOptions[item.name] = item;
                } else if (item.display && this.buttonOptions.show.length < 3) {
                    this.buttonOptions.show.push(item);
                } else {
                    if (!this.buttonOptions.hidden) this.buttonOptions.hidden = [];
                    this.buttonOptions.hidden.push(item);
                }
            });
        }
    }

    public toBool(_: any) {
        return typeof _ === 'function' ? _() : !!_;
    }

    public buttonClick(item) {
        if (item.name === 'checkbox') {
            this.collection.showCheckbox = !this.collection.showCheckbox;
        }
        if (item.click && !this.toBool(item.disabled)) item.click(this.collection.checkedItems);
    }

    public prevPage(end: boolean = false) {
        let prev = end ? 1 : this.collection.page - 1;

        if (prev >= 1) {
            this.collection.page = prev;
        }
    }

    public nextPage(end: boolean = false) {
        let next = end ? this.collection.pageTotal : this.collection.page + 1;

        if (next <= this.collection.pageTotal) {
            this.collection.page = next;
        }
    }
}
