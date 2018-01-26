import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {RecipeComponent} from './recipe.component';

const routes: Routes = [
  {
    path: 'id/:id', component: RecipeComponent
  },
  {
    path: 'new', loadChildren: './inputRecipe/inputRecipe.module#InputRecipeModule'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RecipeRoutingModule {
}
