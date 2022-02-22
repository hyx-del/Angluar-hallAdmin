import { Injectable, EventEmitter } from '@angular/core';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd, Route } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class RouteConfigLoad {

    public loadStart: EventEmitter<RouteConfigLoadStart> = new EventEmitter();

    public loadEnd: EventEmitter<RouteConfigLoadEnd> = new EventEmitter();

    public fullLoad: EventEmitter<any> = new EventEmitter();

    public loaded: boolean = false;

    constructor(private router: Router) {

        this.loaded = !this.loading();

        if (!this.loaded) {
            this.registerRouteLoadEvent();
        }
    }

    private registerRouteLoadEvent() {
        this.router.events.subscribe((event) => {
            if (event instanceof RouteConfigLoadStart) {
                this.loadStart.emit(event);
            }

            if (event instanceof RouteConfigLoadEnd) {
                Promise.resolve().then(() => {
                    this.loadEnd.emit(event);
                    if (!this.loading()) {
                        this.loaded = true;
                        this.fullLoad.emit();
                    }
                })
            }
        });
    }

    public loading() {
        return this.validateLoad(this.router.config);
    }

    public validateLoad(routes: Route[]) {
        for (let route of routes) {
            if (route.loadChildren && !route['_loadedConfig']) {
                return true;
            }
            let children = route.children || (route.loadChildren && route['_loadedConfig'].routes)
            if (children && this.validateLoad(children)) {
                return true;
            }
        }
        return false;
    }
}
