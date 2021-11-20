import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RecipeComponent} from './recipe.component';
import {CanEditGuard} from '../../shared/guard';

const routes: Routes = [
  {
    path: 'new', loadChildren: () => import('./inputRecipe/inputRecipe.module').then(m => m.InputRecipeModule), canActivate: [CanEditGuard]
  },
  {
    path: ':id', component: RecipeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [CanEditGuard]
})
export class RecipeRoutingModule {
}
