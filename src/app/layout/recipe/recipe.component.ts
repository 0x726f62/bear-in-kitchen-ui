import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {RecipeFetcherService} from '../../shared/services';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit {
  recipe: Observable<RecipeDetail>;

  constructor(private recipeFetcherService: RecipeFetcherService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.recipe = this.recipeFetcherService.getRecipe(String(this.route.snapshot.params['id']));
  }

}

export interface RecipeCategory {
  'id': string;
  'icon': string;
  'name': string;
}

export interface IngredientRecipe {
  'id': string;
  'name': string;
  'quantity': number;
  'unit': string;
  'refIngredient': string;
}

export interface Ingredient {
  'id': string;
  'name': string;
  'synonyms': string[];
}

export interface Stats {
  'serves': string;
  'time': string;
  'difficulty': string;
  'refCategory': string;
}

export interface ProtocolItem {
  'id': string;
  'order': number;
  'icon': number;
  'content': string;
  'photoUrl': string;
  'tip': boolean;
}

// TODO remove name
export interface TagRecipe {
  'name': string;
  'refTag': string;
}

export interface Tag {
  'id': string;
  'name': string;
}

export interface RecipeDetail {
  'id': string;
  'title': string;
  'description': string;
  'thumbnailUrl': string;
  'thumbnailStoragePath': string;
  'photoUrl': string;
  'photoStoragePath': string;
  'created': Date;
  'stats': Stats;
  'ingredients': IngredientRecipe[];
  'protocols': ProtocolItem[];
  'tags': TagRecipe[];
}
