import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LayoutComponent} from './layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {path: '', loadChildren: () => import('./gallery/gallery.module').then(m => m.GalleryModule)},
      {path: 'recipe', loadChildren: () => import('./recipe/recipe.module').then(m => m.RecipeModule)},
      {path: 'tricks-and-tips', loadChildren: () => import('./tips-and-tricks/tips-and-tricks.module').then(m => m.TipsAndTricksModule)},
      {path: 'about-me', loadChildren: () => import('./about-me/about-me.module').then(m => m.AboutMeModule)},
      {path: 'profile', loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule)}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule {
}
