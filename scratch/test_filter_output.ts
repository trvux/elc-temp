import { searchProducts } from './modules/catalog/application/searchProducts';

async function testFilterOutput() {
  const result = await searchProducts("");
  console.log('Available Spec Filters:');
  result.availableFilters.specs.forEach(s => {
    console.log(`- ${s.label}: ${s.values.join(', ')}`);
  });
}

testFilterOutput();
