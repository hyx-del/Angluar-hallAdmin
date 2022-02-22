import { DetachedRouteHandle } from "@angular/router"

type StashRoute = {
    path: string,
    handles: { [path: string]: DetachedRouteHandle }
    retrieveFlag?: boolean;
}

export class RouteStash {

    public static MAX: number = -1;

    public static filter: string[] = [];

    private static __obj__: RouteStash;

    public static get main() {
        if (!this.__obj__) {
            this.__obj__ = new RouteStash()
        }
        return this.__obj__
    }

    public get stash() {
        return this._stash;
    }

    private readonly _stash: StashRoute[] = [];

    private _unstash: Boolean = false;

    private constructor() {

    }

    public unstash() {
        this._unstash = true;
        return this;
    }

    public shouldStash(path: string) {
        if (this._unstash) {
            this._unstash = false;
            return false;
        }
        return RouteStash.MAX !== 0 && RouteStash.filter.indexOf(path) < 0;
    }

    public get(path: string): StashRoute {
        for (let item of this._stash) {
            if (item.path === path) {
                return item;
            }
        }
        return null
    }

    public match(path: string): StashRoute[] {
        return this._stash.filter((item) => item.path.indexOf(path) >= 0);
    }

    public shift() {
        if (this._stash.length) {
            this.destroyComponent(this._stash.shift());
        }
        return this;
    }

    public pop() {
        if (this._stash.length) {
            this.destroyComponent(this._stash.pop());
        }
        return this;
    }

    public push(stashRoute: StashRoute) {
        if (!this.shouldStash(stashRoute.path)) {
            return this;
        }
        let index = this._stash.indexOf(stashRoute);
        if (index >= 0) {
            this._stash.splice(index, 1)
        }
        if (RouteStash.MAX > 0 && this._stash.length >= RouteStash.MAX) {
            this.shift();
        }
        this._stash.push(stashRoute);
        return this;
    }

    public remove(stashRoute: string | StashRoute) {
        if (typeof stashRoute === 'string') {
            stashRoute = this.get(stashRoute);
        }
        let index = this._stash.indexOf(stashRoute);
        if (index >= 0) {
            this._stash.splice(index, 1);
            this.destroyComponent(stashRoute);
        }
        return this;
    }

    public clear() {
        this._stash.forEach((item) => this.destroyComponent(item));
        this._stash.length = 0;
        return this;
    }

    protected destroyComponent(stashRoute: StashRoute) {
        for (let path in stashRoute.handles) {
            let handle = stashRoute.handles[path];
            if (handle) {
                handle['componentRef'].destroy();
            }
        }
    }
}
