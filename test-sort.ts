import { sortByOrderIndex } from './shared/lib/helpers';

const pages = [
  { title: "B", orderIndex: 2 },
  { title: "A", orderIndex: 1 },
];

console.log(sortByOrderIndex(pages));
