import { resolveProjectPath } from '../modules/project/application/resolveProjectPath';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
  const testSlug = "lap-dat-he-thong-gio-tuoi-cho-can-ho-cao-cap-landmark-mr-son-quan-binh-thanh";
  console.log(`Resolving slug: ${testSlug}`);
  try {
    const result = await resolveProjectPath(testSlug);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error resolving path:', err.message);
    } else {
      console.error('Unknown error resolving path:', err);
    }
  }
}

test();
