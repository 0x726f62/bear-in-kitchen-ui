import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Ingredient, RecipeCategory, Tag} from '../../../layout/recipe/recipe.component';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class CategoryFetcherService {

  constructor(private afs: AngularFirestore) {
  }

  getAllRecipeCategories() {
    const collection: AngularFirestoreCollection<RecipeCategory> = this.afs.collection('recipeCategories');
    return collection.ref;
  }

  getAllRecipeCategoriesWithChanges(): Observable<RecipeCategory[]> {
    const collection: AngularFirestoreCollection<RecipeCategory> = this.afs.collection('recipeCategories');
    return collection.snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as RecipeCategory;
        const id = a.payload.doc.id;
        return {id, ...data};
      });
    }));
  }

  // getRecipeCategory(recipeDetail: Observable<RecipeDetail>): Promise<RecipeCategory> {
  //   return recipeDetail.toPromise().then( recipe => {
  //     return this.afs.doc('recipes/' + recipe.stats.refCategory).valueChanges().toPromise() as RecipeCategory;
  //   });
  // }

  getRecipeCategory(idIn: string): Observable<RecipeCategory> {
    return this.afs.doc('recipeCategories/' + idIn).valueChanges() as Observable<RecipeCategory>;
  }

  getAllTagsWithChanges(): Observable<Tag[]> {
    const collection: AngularFirestoreCollection<Ingredient> = this.afs.collection('recipeTags');
    return collection.snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as Tag;
        const id = a.payload.doc.id;
        return {id, ...data};
      });
    }));
  }

}
