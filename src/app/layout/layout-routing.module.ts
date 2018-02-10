import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LayoutComponent} from './layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {path: '', loadChildren: './gallery/gallery.module#GalleryModule'},
      {path: 'recipe', loadChildren: './recipe/recipe.module#RecipeModule'},
      {path: 'profile', loadChildren: './profile/profile.module#ProfileModule'}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule {
}
