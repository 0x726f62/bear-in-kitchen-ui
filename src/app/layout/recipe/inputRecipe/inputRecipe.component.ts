import {Component, OnInit} from '@angular/core';
import {routerTransition} from '../../../router.animations';
import {
  DynamicFormArrayModel,
  DynamicFormControlModel, DynamicFormGroupModel,
  DynamicFormLayout,
  DynamicFormService,
  DynamicSelectModel
} from '@ng-dynamic-forms/core';
import {FormArray, FormGroup} from '@angular/forms';
import {AngularFireStorage} from 'angularfire2/storage';
import {AngularFirestore, AngularFirestoreCollection} from 'angularfire2/firestore';
import {INPUT_RECIPE_MODEL, NG_BOOTSTRAP_SAMPLE_FORM_LAYOUT} from './model/inputRecipeModel';
import {Observable} from 'rxjs/Observable';

import {RecipeCategoryRecipe, RecipeDetail, Stats} from '../recipe.component';
import {FormatSelectOptionService} from './service/formatSelectOption.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-input-recipe',
  templateUrl: './inputRecipe.component.html',
  styleUrls: ['./inputRecipe.component.scss'],
  animations: [routerTransition()]
})
export class InputRecipeComponent implements OnInit {
  formModel: DynamicFormControlModel[];
  formLayout: DynamicFormLayout = NG_BOOTSTRAP_SAMPLE_FORM_LAYOUT;
  formGroup: FormGroup;

  tagsFormArrayControl: FormArray;
  ingredientsFormArrayControl: FormArray;
  directionsFormArrayControl: FormArray;
  tagsFormArrayModel: DynamicFormArrayModel;
  ingredientsFormArrayModel: DynamicFormArrayModel;
  directionsFormArrayModel: DynamicFormArrayModel;

  uploadPercent: Observable<number>;
  downloadURL: Observable<string>;
  private newRecipe = <RecipeDetail> {
    stats: <Stats>{
      category: <RecipeCategoryRecipe>{}
    }
  };

  private recipesCollection: AngularFirestoreCollection<RecipeDetail>;

  constructor(private formService: DynamicFormService,
              private storage: AngularFireStorage,
              private afs: AngularFirestore,
              private router: Router,
              private formatSelectOptionService: FormatSelectOptionService) {
    this.formModel = INPUT_RECIPE_MODEL;
  }

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.formModel);
    this.tagsFormArrayControl = this.formGroup.get('tagsFormArray') as FormArray;
    this.ingredientsFormArrayControl = this.formGroup.get('ingredientsFormArray') as FormArray;
    this.directionsFormArrayControl = this.formGroup.get('directionsFormArray') as FormArray;
    this.tagsFormArrayModel = this.formService.findById('tagsFormArray', this.formModel) as DynamicFormArrayModel;
    this.ingredientsFormArrayModel = this.formService.findById('ingredientsFormArray', this.formModel) as DynamicFormArrayModel;
    this.directionsFormArrayModel = this.formService.findById('directionsFormArray', this.formModel) as DynamicFormArrayModel;

    this.recipesCollection = this.afs.collection<RecipeDetail>('recipes');

    const ingredientsSelectControl = this.ingredientsFormArrayModel.get(0).get(0) as DynamicSelectModel<string>;
    ingredientsSelectControl.options = this.formatSelectOptionService.getIngredients();

    const categories = this.formService.findById('categories', this.formModel) as DynamicFormGroupModel;
    const recipeCategoriesSelectControl = categories.get(3) as DynamicSelectModel<RecipeCategoryRecipe>;
    recipeCategoriesSelectControl.options = this.formatSelectOptionService.getRecipeCategories();
  }

  addRecipe(recipeDetail: RecipeDetail) {
    return this.recipesCollection.add(recipeDetail);
  }

  onSubmit() {
    console.log(this.formGroup.value);
    this.newRecipe.title = this.formGroup.get(['basic', 'title']).value;
    this.newRecipe.description = this.formGroup.get(['basic', 'description']).value;
    this.newRecipe.stats.category = this.formGroup.get(['categories', 'recipeCategorySelect']).value;
    this.newRecipe.stats.difficulty = this.formGroup.get(['categories', 'difficulty']).value;
    this.newRecipe.stats.serves = this.formGroup.get(['categories', 'serves']).value;
    this.newRecipe.stats.time = this.formGroup.get(['categories', 'time']).value;

    this.addRecipe(this.newRecipe).then((ref) => {
      const promises: Promise<any>[] = [];
      for (const tag of this.formGroup.get(['tagsFormArray']).value) {
        promises.push(ref.collection('tags').add({name: tag.tag}));
      }

      for (const ingredient of this.formGroup.get(['ingredientsFormArray']).value) {
        promises.push(ref.collection('ingredients').add({
          name: ingredient.ingredient,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          refIngredient: ingredient.ingredientSelect
        }));
        promises.push(this.afs.collection('ingredients/' + ingredient.ingredientSelect + '/synonyms').add({
          name: ingredient.ingredient
        }));
      }

      let order = 1;
      let icon = 1;
      for (const protocol of this.formGroup.get(['directionsFormArray']).value) {
        promises.push(ref.collection('protocols').add({
          content: protocol.direction,
          order: order,
          icon: icon,
          tip: protocol.tip
        }));
        ++order;
        if (!protocol.tip) {
          ++icon;
        }
      }

      Promise.all(promises).then(
        () => {
          this.router.navigate(['/recipe/' + ref.id]);
        });

    });
  }

  addItemLabels() {
    this.formService.addFormArrayGroup(this.tagsFormArrayControl, this.tagsFormArrayModel);
  }

  clearLabels() {
    this.formService.clearFormArray(this.tagsFormArrayControl, this.tagsFormArrayModel);
  }

  removeItemLabels(context: DynamicFormArrayModel, index: number) {
    this.formService.removeFormArrayGroup(index, this.tagsFormArrayControl, context);
  }

  insertItemLabels(context: DynamicFormArrayModel, index: number) {
    this.formService.insertFormArrayGroup(index, this.tagsFormArrayControl, context);
  }

  addItemIngredients() {
    this.formService.addFormArrayGroup(this.ingredientsFormArrayControl, this.ingredientsFormArrayModel);
  }

  clearIngredients() {
    this.formService.clearFormArray(this.ingredientsFormArrayControl, this.ingredientsFormArrayModel);
  }

  removeItemIngredients(context: DynamicFormArrayModel, index: number) {
    this.formService.removeFormArrayGroup(index, this.ingredientsFormArrayControl, context);
  }

  insertItemIngredients(context: DynamicFormArrayModel, index: number) {
    this.formService.insertFormArrayGroup(index, this.ingredientsFormArrayControl, context);
    const selectControl = this.ingredientsFormArrayModel.get(index).get(0) as DynamicSelectModel<string>;
    selectControl.options = this.formatSelectOptionService.getIngredients();
  }

  addItemDirections() {
    this.formService.addFormArrayGroup(this.directionsFormArrayControl, this.directionsFormArrayModel);
  }

  clearDirections() {
    this.formService.clearFormArray(this.directionsFormArrayControl, this.directionsFormArrayModel);
  }

  removeItemDirections(context: DynamicFormArrayModel, index: number) {
    this.formService.removeFormArrayGroup(index, this.directionsFormArrayControl, context);
  }

  insertItemDirections(context: DynamicFormArrayModel, index: number) {
    this.formService.insertFormArrayGroup(index, this.directionsFormArrayControl, context);
  }

  uploadFile(event) {
    const file = event.target.files[0] as File;
    const filePath = 'recipes/' + file.name;
    const task = this.storage.upload(filePath, file);

    // observe percentage changes
    this.uploadPercent = task.percentageChanges();
    // get notified when the download URL is available
    this.downloadURL = task.downloadURL();

    task.then((taskDone) => {
      this.newRecipe.photoUrl = taskDone.downloadURL;
      this.newRecipe.thumbnailUrl = taskDone.downloadURL;
    });
  }
}
