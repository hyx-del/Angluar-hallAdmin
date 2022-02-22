import { Component, OnDestroy, HostBinding, AfterContentChecked } from '@angular/core';
import { Router, NavigationEnd, PRIMARY_OUTLET, UrlTree } from '@angular/router';
import { RouteStash, PageTabs, ROUTES_INFO } from '@/providers/index';

@Component({
    selector: 'page-tab',
    styleUrls: ['page.tab.scss'],
    templateUrl: "./page.tab.html",
})
export class PageTabComponent implements AfterContentChecked, OnDestroy {

    private routeStash: RouteStash = RouteStash.main;

    private _routeSubscriber;

    private _isForbidden;

    public except = [
        '/login',
        '/empty',
    ];

    @HostBinding('class.show') show: boolean;

    constructor(public pageTabs: PageTabs, private router: Router) {
        RouteStash.MAX = PageTabs.MAX;

        this.pageTabs.push({ path: '/home', label: '首页' });
        this.registerNavigateEvent();
    }

    public ngAfterContentChecked(): void {
        this.show = this.pageTabs.length() > 1 && !this.isHomePage();
    }

    public ngOnDestroy() {
        this._routeSubscriber && this._routeSubscriber.unsubscribe();
        this.pageTabs.clear(true);
        this.routeStash.clear();
    }

    private registerNavigateEvent() {
        this._routeSubscriber = this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.storeRoute();
            }
        })
    }

    private storeRoute() {
        let urlTree: UrlTree = this.router['currentUrlTree'];

        let path = '/' + urlTree.root.children[PRIMARY_OUTLET].toString();

        this._isForbidden = path === '/forbidden';

        if (this.except.indexOf(path) > -1) return;

        let pageTab = this.pageTabs.get(path);
        if (pageTab) {
            pageTab.urlTree = urlTree;
            this.setRouteLabel(pageTab);
        } else {
            pageTab = this.setRouteLabel({ path, urlTree, deletable: true });
            this.pageTabs.push(pageTab);
        }
        this.pageTabs.setActive(pageTab);
    }

    private setRouteLabel(pageTab) {
        let path = this._isForbidden ? pageTab.urlTree.fragment : pageTab.path;
        if (path === '/home') {
            pageTab.label = '首页';
        } else {
            pageTab.label = ROUTES_INFO[path] && ROUTES_INFO[path].label;
        }
        return pageTab;
    }

    public isHomePage() {
        return this.pageTabs.active && this.pageTabs.active.path === '/home';
    }

    public click(pageTab) {
        if (this.pageTabs.active === pageTab) {
            return;
        }
        this.pageTabs.setActive(pageTab);
        this.navigate(pageTab);
    }

    public close(pageTab, event?: any) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        let active = this.pageTabs.active;

        this.routeStash.remove(pageTab.path);
        this.pageTabs.remove(pageTab);

        if (active === pageTab) {
            this.routeStash.unstash();
        }

        if (active !== this.pageTabs.active) {
            this.navigate(this.pageTabs.active);
        }
    }

    public closeAll() {
        let active = this.pageTabs.active;
        this.pageTabs.stash.forEach((pageTab) => {
            if (pageTab.deletable) {
                this.routeStash.remove(pageTab.path);
            }
        });
        this.pageTabs.clear();
        if (active !== this.pageTabs.active) {
            this.navigate(this.pageTabs.active);
        }
    }

    public closeOthers() {
        let active = this.pageTabs.active;
        this.pageTabs.stash.forEach((pageTab) => {
            if (pageTab.deletable && pageTab !== active) {
                this.routeStash.remove(pageTab.path);
            }
        });
        this.pageTabs.clear();
        if (this.pageTabs.active !== active) {
            this.pageTabs.push(active).setActive(active);
        }
    }

    protected navigate(pageTab) {
        if (pageTab) {
            this.router.navigateByUrl(pageTab.urlTree || pageTab.path);
        } else {
            this.router.navigateByUrl('/');
        }
    }
}
