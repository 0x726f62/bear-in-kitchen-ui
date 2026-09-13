const categoryIcons: Record<string, string> = {
  'bagety a sendviče': '/icons/baguette.svg',
  dezerty: '/icons/037-piece-of-cake-with-cherry.svg',
  'hlavní chody': '/icons/042-hot-pot.svg',
  'nápoje': '/icons/038-drink.svg',
  'pečivo': '/icons/039-bread-silhouette-side-view.svg',
  'polévky': '/icons/040-soup-hot-bowl-with-spoon.svg',
  'saláty': '/icons/salad.svg',
};

export const categoryIcon = (category: string) =>
  categoryIcons[category.toLocaleLowerCase('cs')] ?? '/icons/015-restaurant.svg';

export const stepIcons = [
  '/icons/numbers/one.svg', '/icons/numbers/two.svg', '/icons/numbers/three.svg',
  '/icons/numbers/four.svg', '/icons/numbers/five.svg', '/icons/numbers/six.svg',
  '/icons/numbers/seven.svg', '/icons/numbers/eight.svg', '/icons/numbers/nine.svg',
  '/icons/numbers/ten.svg',
];
