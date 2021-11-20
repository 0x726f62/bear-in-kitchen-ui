import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {InputRecipeRoutingModule} from './inputRecipe-routing.module';
import {InputRecipeComponent} from './inputRecipe.component';

import {AngularFireStorageModule} from '@angular/fire/compat/storage';
import {ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng-dynamic-forms/core';
import {DynamicFormsNGBootstrapUIModule} from '@ng-dynamic-forms/ui-ng-bootstrap';
import {CategoryFetcherService, IngredientFetcherService} from '../../../shared/services';
import {FormatSelectOptionService} from './service/formatSelectOption.service';

@NgModule({
  imports: [
    CommonModule,
    InputRecipeRoutingModule,
    ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsNGBootstrapUIModule,
    AngularFireStorageModule
  ],
  declarations: [InputRecipeComponent],
  providers: [IngredientFetcherService, FormatSelectOptionService, CategoryFetcherService]
})
export class InputRecipeModule {
}
