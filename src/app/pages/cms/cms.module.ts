import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgZorroAntdModule } from 'ng-zorro-antd';
import { SharedModule } from '../shared/shared.module';
import { CategoryComponent } from './category/category.component';
import { ArticleManageComponent } from './article/article.component';
// import { SamllProgarmSettingComponent } from './setting/setting.component';
import { CollectionComponent } from './collection/collection.component';
import { Routes } from "../../app.router.module";

const routes: Routes = [
    { path: "article-manage", name: 'cms.material.list', component: ArticleManageComponent },
    { path: "category", name: 'cms.material-category.list', component: CategoryComponent },
    // { path: "setting/banner", name: 'cms.app.banner.get', component: SamllProgarmSettingComponent },
    { path: "collection", name: 'cms.collection.list', component: CollectionComponent },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgZorroAntdModule,
        SharedModule,
        RouterModule.forChild(routes)
    ],
    providers: [],
    declarations: [
        CategoryComponent,
        ArticleManageComponent,
        // SamllProgarmSettingComponent,
        CollectionComponent,
    ],
    exports: []
})
export class CmsModule {

}
