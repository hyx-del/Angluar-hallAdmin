import { ActivatedRouteSnapshot, RouteReuseStrategy, DetachedRouteHandle, Route } from '@angular/router';
import { RouteStash } from './route.stash';

export class CustomReuseStrategy implements RouteReuseStrategy {

    /**
     * Object which will store RouteStorageObjects indexed by keys
     * The keys will all be a path (as in route.routeConfig.path)
     * This allows us to see if we've got a route stored for the requested path
     */
    private routeStash: RouteStash = RouteStash.main;

    /**
     * Decides when the route should be stored
     * If the route should be stored, I believe the boolean is indicating to a controller whether or not to fire this.store
     * _When_ it is called though does not particularly matter, just know that this determines whether or not we store the route
     * An idea of what to do here: check the route.routeConfig.path to see if it is a path you would like to store
     * @param route This is, at least as I understand it, the route that the user is currently on, and we would like to know if we want to store it
     * @returns boolean indicating that we want to (true) or do not want to (false) store that route
     */
    public shouldDetach(route: ActivatedRouteSnapshot): boolean {
        return !route.children.length && this.routeStash.shouldStash(route['_routerState'].url);
    }

    /**
     * Constructs object of type `RouteStorageObject` to store, and then stores it for later attachment
     * @param route This is stored for later comparison to requested routes, see `this.shouldAttach`
     * @param handle Later to be retrieved by this.retrieve, and offered up to whatever controller is using this class
     */
    public store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let path = route.routeConfig.path;
        let stashRoute = this.routeStash.get(route['_routerState'].url);
        if (stashRoute) {
            stashRoute.handles[path] = handle;
        }
        if (!handle) {
            return;
        }
        this.hideComponent(handle);
        this.routeStash.push(stashRoute || {
            path: route['_routerState'].url,
            handles: { [path]: handle }
        });
    }

    /**
     * Determines whether or not there is a stored route and, if there is, whether or not it should be rendered in place of requested route
     * @param route The route the user requested
     * @returns boolean indicating whether or not to render the stored route
     */
    public shouldAttach(route: ActivatedRouteSnapshot): boolean {
        // this will be true if the route has been stored before
        let routeStash = this.routeStash.get(route['_routerState'].url);
        if (!routeStash || !routeStash.handles[route.routeConfig.path]) {
            return false;
        }
        return routeStash.retrieveFlag = true;
    }

    /**
     * Finds the locally stored instance of the requested route, if it exists, and returns it
     * @param route New route the user has requested
     * @returns DetachedRouteHandle object which can be used to render the component
     */
    public retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        /** returns handle when th0e route.routeConfig.path is already stored */

        let stashRoute = this.routeStash.get(route['_routerState'].url);
        if (!stashRoute || !stashRoute.handles[route.routeConfig.path]) {
            return null;
        }

        let handle = stashRoute.handles[route.routeConfig.path];

        if (stashRoute.retrieveFlag) {
            stashRoute.retrieveFlag = false;
            this.showComponent(handle);
        }

        return handle;
    }

    /**
     * Determines whether or not the current route should be reused
     * @param future The route the user is going to, as triggered by the router
     * @param curr The route the user is currently on
     * @returns boolean basically indicating true if the user intends to leave the current route
     */
    public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return future.routeConfig === curr.routeConfig; // && JSON.stringify(future.queryParams) === JSON.stringify(curr.queryParams)
    }

    protected showComponent(handle: DetachedRouteHandle) {
        let component = handle['componentRef']._component;
        if (component.onShow) {
            component.onShow();
        }
    }

    protected hideComponent(handle: DetachedRouteHandle) {
        let component = handle['componentRef']._component;
        if (component.onHidden) {
            component.onHidden();
        }
    }
}
