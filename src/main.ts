import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const preloaderFinished = () => {
    let preloader = document.querySelector('.preloader');
    function remove() {
        if (!preloader) return;

        preloader.addEventListener('transitionend', function () {
            preloader.className = 'preloader-hidden';
        });
        preloader.className += ' preloader-hidden-add preloader-hidden-add-active';
    }

    (window as any).appBootstrap = function () {
        setTimeout(function () {
            remove();
        }, 100);
    };
}
preloaderFinished();

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).then(() => {
    (<any>window).appBootstrap();
}).catch(err => console.error(err));