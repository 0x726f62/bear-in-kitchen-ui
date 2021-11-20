import {Component, OnInit} from '@angular/core';
import {routerTransition} from '../../router.animations';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {RecipeDetail} from '../recipe/recipe.component';
import {RecipeFetcherService} from '../../shared/services';
import {AngularFireStorage} from '@angular/fire/compat/storage';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  animations: [routerTransition()]
})
export class GalleryComponent implements OnInit {
  recipes: Observable<RecipeDetail[]>;

  constructor(private recipeFetcherService: RecipeFetcherService,
              private storage: AngularFireStorage,
              private afs: AngularFirestore) {
  }

  ngOnInit() {
    this.recipes = this.recipeFetcherService.getRecipes().pipe(map(recipes => {
      recipes.forEach(recipe => {
        // FIXME potential issue, we should wait for all async ops to finish before we return the recipes array
        this.resolveThumbPhotoUrl(recipe);
      });
      return recipes;
    }));
  }

  // TODO extract it to the service
  // GalleryModule shouldn't have dependency on AngularFireStorageModule and AngularFirestoreModule
  private resolveThumbPhotoUrl(recipe): Promise<void> {
    const document: AngularFirestoreDocument<RecipeDetail> = this.afs.doc('recipes/' + recipe.id);

    if (recipe.thumbnailUrl) {
      return Promise.resolve();
    }

    // fallback
    if (!recipe.thumbnailStoragePath) {
      return document.update({thumbnailUrl: recipe.photoUrl});
    }

    const downloadURL = this.storage.ref(recipe.thumbnailStoragePath).getDownloadURL();
    return downloadURL.toPromise().then(url => {
      console.log('resolved thumbnailUrl=' + recipe.thumbnailUrl);
      return document.update({thumbnailUrl: url});
    });
  }
}
