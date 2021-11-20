import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {GalleryRoutingModule} from './gallery-routing.module';
import {GalleryComponent} from './gallery.component';
import {RecipeFetcherService, RecipePaginatedFetcherService} from '../../shared/services';
import {SearchbarComponent} from './components/searchbar/searchbar.component';
import {StatModule} from '../../shared';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {AngularFireStorageModule} from '@angular/fire/compat/storage';
import {AngularFirestoreModule} from '@angular/fire/compat/firestore';

@NgModule({
  imports: [
    CommonModule,
    InfiniteScrollModule,
    GalleryRoutingModule,
    StatModule,
    AngularFireStorageModule,
    AngularFirestoreModule
  ],
  declarations: [
    GalleryComponent,
    SearchbarComponent
  ],
  providers: [RecipeFetcherService, RecipePaginatedFetcherService]
})
export class GalleryModule {
}
