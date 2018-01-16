import { Component, OnInit } from '@angular/core';
import { RecipeFetcherService } from '../../shared/services';

import { StatModule } from '../../shared';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  recipes:RecipeDetail[];

  constructor(private recipeFetcherService:RecipeFetcherService) { }

  ngOnInit() {
    this.recipeFetcherService.getRecipes().subscribe((recipes) => {
      this.recipes = recipes;
    });
  }
}

export interface RecipeDetail{
  "albumId": number,
  "id": number,
  "title": string,
  "url": string,
  "thumbnailUrl": string
}
