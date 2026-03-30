const fs = require('fs');
const postgres = require('postgres');

const SUPABASE_URL = 'https://exzkttttnsnpwzouwiqq.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4emt0dHR0bnNucHd6b3V3aXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU5ODExNSwiZXhwIjoyMDg5MTc0MTE1fQ.cEz4vls7qky40nJh9WkPXlSZNU3Tnh8UOJobQGZkekE';
const sql = postgres('postgresql://postgres.exzkttttnsnpwzouwiqq:The%40gentic3orldPa5%24@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres');

async function ensureBucket() {
  // Try to create bucket (ignore if exists)
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'images', name: 'images', public: true })
  });
  const data = await res.json();
  console.log('Bucket:', data.message || 'created');
}

async function uploadImage(id, dataUrl) {
  // Parse data URL
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine extension
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('audio') ? 'mp3' : 'jpg';
  const fileName = `${id}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${fileName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true'
    },
    body: buffer
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  Failed ${id}: ${err}`);
    return null;
  }

  // Return public URL
  return `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
}

async function run() {
  const raw = JSON.parse(fs.readFileSync('/Users/eranbrownstain/Downloads/bldr-export.json', 'utf-8'));
  const images = raw.indexedDB?.['bldr_images__images'] || [];

  console.log(`Found ${images.length} images`);

  await ensureBucket();

  // Build mapping: old idb:// id -> new public URL
  const urlMap = {};

  for (const img of images) {
    if (!img.data || !img.id) continue;
    // Skip audio files
    if (img.data.startsWith('data:audio')) {
      console.log(`  Skipping audio: ${img.id}`);
      continue;
    }

    const publicUrl = await uploadImage(img.id, img.data);
    if (publicUrl) {
      urlMap[`idb://${img.id}`] = publicUrl;
      console.log(`  Uploaded: ${img.id}`);
    }
  }

  console.log(`\nUploaded ${Object.keys(urlMap).length} images`);

  // Update course thumbnails in DB
  const courses = await sql`SELECT id, thumbnail FROM courses WHERE thumbnail IS NOT NULL`;
  let updated = 0;
  for (const course of courses) {
    const newUrl = urlMap[course.thumbnail];
    if (newUrl) {
      await sql`UPDATE courses SET thumbnail = ${newUrl} WHERE id = ${course.id}`;
      updated++;
    } else if (course.thumbnail && course.thumbnail.startsWith('data:')) {
      // Inline base64 - upload directly
      const publicUrl = await uploadImage(`course-${course.id}`, course.thumbnail);
      if (publicUrl) {
        await sql`UPDATE courses SET thumbnail = ${publicUrl} WHERE id = ${course.id}`;
        updated++;
      }
    }
  }

  console.log(`Updated ${updated} course thumbnails in DB`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
