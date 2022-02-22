import { Injectable } from '@angular/core';
import { UrlTree } from '@angular/router';

export type PageTab = {
    path: string,
    label: string,
    active?: boolean,
    urlTree?: UrlTree,
    deletable?: boolean
}

@Injectable({
    providedIn: 'root'
})
export class PageTabs {

    public static MAX: number = 10;

    public get stash() {
        return this._stash;
    }

    public get active() {
        return this._active;
    }

    protected _stash: PageTab[] = [];

    protected _active: PageTab;

    constructor() {
    }

    public length() {
        return this._stash.length;
    }

    public get(path: string): PageTab {
        for (let item of this._stash) {
            if (item.path === path) {
                return item;
            }
        }
        return null;
    }

    public setActive(pageTab: PageTab) {
        if (pageTab === this._active) {
            return this;
        }
        if (this._active) {
            this._active.active = false;
        }
        if (pageTab) {
            pageTab.active = true;
        }
        this._active = pageTab;
        return this;
    }

    public push(pageTab: PageTab) {
        if (PageTabs.MAX > 0 && PageTabs.MAX < this._stash.length) {
            this.shift();
        }
        this._stash.push(pageTab);
        return this;
    }

    public remove(pageTab: PageTab) {
        let index = this._stash.indexOf(pageTab);

        if (index >= 0) {
            this._stash.splice(index, 1);

            if (this._active === pageTab) {
                this.setActive(this._stash[index] || this._stash[index - 1])
            }
        }

        return this;
    }

    public shift() {
        let index = this._stash.findIndex((tab) => tab.deletable);
        if (index < 0) {
            return null;
        }
        let pageTab = this._stash[index];

        this._stash.splice(index, 1);

        if (this._active === pageTab) {
            this.setActive(this._stash[index] || this._stash[index - 1])
        }

        return pageTab;
    }

    public clear(force?: boolean) {
        if (force) {
            this._stash.length = 0;
            return this.setActive(null);
        }

        this._stash = this._stash.filter((tab) => !tab.deletable);
        if (this._stash.indexOf(this._active) < 0) {
            this.setActive(this._stash[this._stash.length - 1])
        }
        return this;
    }
}
