import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Ingredient} from '../../../layout/recipe/recipe.component';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class IngredientFetcherService {

  constructor(private afs: AngularFirestore) {
  }

  getAllIngredients() {
    const collection: AngularFirestoreCollection<Ingredient> = this.afs.collection('ingredients');
    return collection.ref;
  }

  getAllIngredientsWithChanges(): Observable<Ingredient[]> {
    const collection: AngularFirestoreCollection<Ingredient> = this.afs.collection('ingredients');
    return collection.snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data() as Ingredient;
            const id = a.payload.doc.id;
            return {id, ...data};
          });
        })
      );
  }
}
