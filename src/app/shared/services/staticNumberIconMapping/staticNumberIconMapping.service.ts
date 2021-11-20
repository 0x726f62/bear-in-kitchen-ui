import {Injectable, OnInit} from '@angular/core';

@Injectable()
export class StaticNumberIconMappingService implements OnInit {

  constructor() {
  }

  ngOnInit() {
  }

  getIcon(id: number, tip: boolean) {
    if (tip) {
      return './assets/icons/004-idea.svg';
    }
    return './assets/icons/numbers/' + ICON_NAMES[id];
  }
}

const ICON_NAMES = [
  'zero.svg',
  'one.svg',
  'two.svg',
  'three.svg',
  'four.svg',
  'five.svg',
  'six.svg',
  'seven.svg',
  'eight.svg',
  'nine.svg',
  'ten.svg'];
