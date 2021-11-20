import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/compat/firestore';
import {IngredientRecipe, ProtocolItem, RecipeDetail, TagRecipe} from '../../../layout/recipe/recipe.component';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DocumentSnapshot, Query} from '@firebase/firestore-types';


@Injectable()
export class RecipeFetcherService {
  lastRecipe: DocumentSnapshot;

  constructor(private afs: AngularFirestore) {
    this.lastRecipe = null;
    console.log('fetcher cons');
  }

  // getPagenatedRecipes(startAfter: RecipeDetail) {
  getPagenatedRecipes() {
    const collection: AngularFirestoreCollection<RecipeDetail> = this.afs.collection('recipes');
    let firebaseQuery: Query = collection.ref.orderBy('title');

    if (this.lastRecipe != null) {
      firebaseQuery = firebaseQuery.startAfter(this.lastRecipe);
    }

    return firebaseQuery.limit(3).get().then(qsnap => {
      this.lastRecipe = qsnap.docs[qsnap.docs.length - 1];
      return qsnap.docs.map(qdocsnap => {
        const data = qdocsnap.data() as RecipeDetail;
        const id = qdocsnap.id;
        return {id, ...data};
      });
    });
  }

  getRecipes() {
    const collection: AngularFirestoreCollection<RecipeDetail> = this.afs.collection('recipes');
    // TODO rewrite to reference only
    return collection.snapshotChanges().pipe(map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as RecipeDetail;
        const id = a.payload.doc.id;
        return {id, ...data};
      });
    }));
  }

  getRecipe(idIn: string) {
    const document: AngularFirestoreDocument<RecipeDetail> = this.afs.doc('recipes/' + idIn);
    const document$: Observable<RecipeDetail> = document.snapshotChanges().pipe(map(a => {
      const tags = [];
      const ingredients = [];
      const protocols = [];
      const data = a.payload.data() as RecipeDetail;
      const id = a.payload.id;
      this.getTags(idIn).then(res => {
        res.forEach(item => {
          tags.push({id: item.id, ...item.data()});
        });
      });

      this.getIngredients(idIn).then(res => {
        res.forEach(item => {
          ingredients.push({id: item.id, ...item.data()});
        });
      });

      this.getProtocols(idIn).then(res => {
        res.forEach(item => {
          protocols.push({id: item.id, ...item.data()});
        });
      });

      return {id, ...data, tags: tags, ingredients: ingredients, protocols: protocols};
    }));
    return document$;
  }

  getTags(idItem: string) {
    const collection: AngularFirestoreCollection<TagRecipe> = this.afs.collection('recipes/' + idItem + '/tags');
    return collection.ref.get().then(qsnap => {
      return qsnap.docs;
    });
  }

  getIngredients(idItem: string) {
    const collection: AngularFirestoreCollection<IngredientRecipe> = this.afs.collection('recipes/' + idItem + '/ingredients');
    return collection.ref.get().then(qsnap => {
      return qsnap.docs;
    });
  }

  getProtocols(idItem: string) {
    const collection: AngularFirestoreCollection<ProtocolItem> = this.afs.collection('recipes/' + idItem + '/protocols');
    return collection.ref.orderBy('order').get().then(qsnap => {
      return qsnap.docs;
    });
  }
}
