const postgres = require('postgres');
const fs = require('fs');
const crypto = require('crypto');

const sql = postgres('postgresql://postgres.exzkttttnsnpwzouwiqq:The%40gentic3orldPa5%24@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres');

// Deterministic UUID from string ID (so we can reference them)
function toUUID(str) {
  const hash = crypto.createHash('md5').update(String(str)).digest('hex');
  return [hash.slice(0,8), hash.slice(8,12), '4' + hash.slice(13,16), '8' + hash.slice(17,20), hash.slice(20,32)].join('-');
}

async function run() {
  const raw = JSON.parse(fs.readFileSync('/Users/eranbrownstain/Downloads/bldr-export.json', 'utf-8'));
  const ls = raw.localStorage;

  // Parse helper
  function parse(key) {
    const v = ls[key];
    if (!v) return null;
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  }

  // 1. Seed admin user
  const profile = parse('bldr_user_profile');
  console.log('Seeding admin user...');
  const adminId = toUUID('admin-eran');
  await sql`
    INSERT INTO users (id, email, password_hash, full_name, avatar_url, role)
    VALUES (${adminId}, ${profile.email || 'eranbrownstain@gmail.com'}, 'placeholder', ${profile.name || 'Eran'}, ${profile.avatarUrl || null}, 'admin')
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url, role = EXCLUDED.role
  `;
  console.log('  Admin user done');

  // 2. Seed courses -> chapters -> lessons
  const courses = parse('bldr_courses') || [];
  const courseOrder = parse('bldr_course_order') || [];
  console.log(`Seeding ${courses.length} courses...`);

  for (let ci = 0; ci < courses.length; ci++) {
    const c = courses[ci];
    const courseId = toUUID(c.id);
    const orderIdx = courseOrder.indexOf(c.id);
    const displayOrder = orderIdx >= 0 ? orderIdx : ci;

    // Map status
    let status = 'draft';
    if (c.status === 'active' || c.status === 'published') status = 'active';
    else if (c.status === 'coming_soon' || c.status === 'draft') status = 'draft';
    else if (c.status === 'archive') status = 'archive';

    await sql`
      INSERT INTO courses (id, title, description, thumbnail, status, display_order, created_at, updated_at)
      VALUES (${courseId}, ${c.title}, ${c.description || null}, ${c.thumbnailUrl || null}, ${status}, ${displayOrder}, ${c.createdAt ? new Date(c.createdAt) : new Date()}, ${c.updatedAt ? new Date(c.updatedAt) : new Date()})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, thumbnail = EXCLUDED.thumbnail, status = EXCLUDED.status, display_order = EXCLUDED.display_order
    `;

    const chapters = c.chapters || [];
    for (let chi = 0; chi < chapters.length; chi++) {
      const ch = chapters[chi];
      const chapterId = toUUID(ch.id);
      await sql`
        INSERT INTO chapters (id, course_id, title, display_order)
        VALUES (${chapterId}, ${courseId}, ${ch.title || `Chapter ${ch.number || chi+1}`}, ${ch.number || chi})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, display_order = EXCLUDED.display_order
      `;

      const lessons = ch.lessons || [];
      for (let li = 0; li < lessons.length; li++) {
        const l = lessons[li];
        const lessonId = toUUID(l.id);
        // Parse duration string like "12:34" to seconds
        let durationSecs = null;
        if (l.duration) {
          const parts = String(l.duration).split(':');
          if (parts.length === 2) durationSecs = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          else if (!isNaN(l.duration)) durationSecs = parseInt(l.duration);
        }

        await sql`
          INSERT INTO lessons (id, chapter_id, title, description, video_url, duration, display_order, attachments, has_assignment)
          VALUES (${lessonId}, ${chapterId}, ${l.title}, ${l.description || null}, ${l.videoUrl || null}, ${durationSecs}, ${l.number || li}, ${JSON.stringify(l.attachments || [])}, ${l.hasAssignment || false})
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, video_url = EXCLUDED.video_url, duration = EXCLUDED.duration
        `;
      }
    }
    console.log(`  Course: ${c.title} (${chapters.reduce((a, ch) => a + (ch.lessons?.length || 0), 0)} lessons)`);
  }

  // 3. Case studies
  const caseStudies = parse('bldr_case_studies') || [];
  console.log(`Seeding ${caseStudies.length} case studies...`);
  for (const cs of caseStudies) {
    await sql`
      INSERT INTO case_studies (id, title, description, thumbnail, category, content, tags)
      VALUES (${toUUID(cs.id)}, ${cs.title || 'Untitled'}, ${cs.description || null}, ${cs.thumbnail || cs.thumbnailUrl || null}, ${cs.category || null}, ${cs.content || null}, ${JSON.stringify(cs.tags || [])})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 4. Knowledge base
  const kb = parse('bldr_knowledge_base') || [];
  console.log(`Seeding ${kb.length} knowledge base entries...`);
  for (const entry of kb) {
    await sql`
      INSERT INTO knowledge_base (id, question, answer, category, tags, source)
      VALUES (${toUUID(entry.id)}, ${entry.question || entry.title || 'Untitled'}, ${entry.answer || entry.content || ''}, ${entry.category || null}, ${JSON.stringify(entry.tags || [])}, ${entry.source || null})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 5. News
  const news = parse('bldr_news') || [];
  console.log(`Seeding ${news.length} news entries...`);
  for (const n of news) {
    await sql`
      INSERT INTO news (id, title, body, image_url, created_at)
      VALUES (${toUUID(n.id)}, ${n.title || 'Untitled'}, ${n.body || n.content || null}, ${n.imageUrl || null}, ${n.createdAt ? new Date(n.createdAt) : new Date()})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 6. Calendar events
  const events = parse('bldr_calendar_events') || [];
  console.log(`Seeding ${events.length} calendar events...`);
  for (const ev of events) {
    let eventType = 'live';
    if (ev.type === 'office_hours') eventType = 'office_hours';
    else if (ev.type === 'brainstorm') eventType = 'brainstorm';

    // Build proper timestamps from date + time
    const date = ev.date || '2026-01-01';
    const startTime = new Date(`${date}T${ev.startTime || '00:00'}:00`);
    const endTime = new Date(`${date}T${ev.endTime || '23:59'}:00`);

    await sql`
      INSERT INTO calendar_events (id, title, description, type, start_time, end_time, recording_url)
      VALUES (${toUUID(ev.id)}, ${ev.title || 'Untitled'}, ${ev.description || null}, ${eventType}, ${startTime}, ${endTime}, ${ev.recordingUrl || null})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 7. Forum questions
  const forumQs = parse('bldr_forum_questions') || [];
  console.log(`Seeding ${forumQs.length} forum questions...`);
  for (const q of forumQs) {
    await sql`
      INSERT INTO support_questions (id, user_id, title, description, status, admin_response, tags, is_published)
      VALUES (${toUUID(q.id)}, ${adminId}, ${q.title || q.question || 'Untitled'}, ${q.description || q.body || ''}, ${q.status === 'answered' ? 'answered' : 'pending'}, ${q.adminResponse || q.answer || null}, ${JSON.stringify(q.tags || [])}, ${q.isPublished !== false})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 8. Feedback
  const feedback = parse('bldr_feedback') || [];
  console.log(`Seeding ${feedback.length} feedback entries...`);
  for (const fb of feedback) {
    await sql`
      INSERT INTO feedback (id, user_name, user_email, type, message, rating)
      VALUES (${toUUID(fb.id || String(Math.random()))}, ${fb.userName || fb.name || null}, ${fb.userEmail || fb.email || null}, ${fb.type || null}, ${fb.message || fb.text || ''}, ${fb.rating || null})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 9. Share links
  const shareLinks = parse('bldr_share_links') || [];
  console.log(`Seeding ${shareLinks.length} share links...`);
  for (const sl of shareLinks) {
    await sql`
      INSERT INTO share_links (id, token, course_id, lesson_id, type)
      VALUES (${toUUID(sl.id || sl.token)}, ${sl.token || sl.id}, ${sl.courseId ? toUUID(sl.courseId) : null}, ${sl.lessonId ? toUUID(sl.lessonId) : null}, ${sl.type || null})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 10. Media registry
  const media = parse('bldr_media_registry') || [];
  console.log(`Seeding ${media.length} media registry entries...`);
  for (const m of media) {
    await sql`
      INSERT INTO media_registry (id, label, key)
      VALUES (${toUUID(m.id)}, ${m.label || null}, ${m.key || ''})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 11. Admin settings (brand, onboarding, avatar, webhooks, api keys, etc.)
  const settingsToSeed = [
    ['brand_settings', parse('bldr_brand_settings')],
    ['onboarding_settings', parse('bldr_onboarding_settings')],
    ['onboarding_steps', parse('bldr_onboarding_steps')],
    ['avatar_settings', parse('bldr_avatar_settings')],
    ['webhooks', parse('bldr_webhooks')],
    ['api_keys', parse('bldr_api_keys')],
    ['admin_tasks', parse('bldr_admin_tasks')],
    ['content_ideas', parse('bldr_content_ideas')],
    ['dev_ideas', parse('bldr_dev_ideas')],
    ['promo_links', parse('bldr_promo_links')],
    ['prompt_logs', parse('bldr_prompt_logs')],
    ['whatsapp_settings', parse('bldr_whatsapp_settings')],
  ];
  console.log('Seeding admin settings...');
  for (const [key, value] of settingsToSeed) {
    if (value == null) continue;
    await sql`
      INSERT INTO admin_settings (id, key, value)
      VALUES (${toUUID('setting-' + key)}, ${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
  }

  // Done
  const totalLessons = courses.reduce((a, c) => a + (c.chapters || []).reduce((b, ch) => b + (ch.lessons?.length || 0), 0), 0);
  console.log(`\nSeed complete!`);
  console.log(`  ${courses.length} courses`);
  console.log(`  ${totalLessons} lessons`);
  console.log(`  ${caseStudies.length} case studies`);
  console.log(`  ${kb.length} knowledge base entries`);
  console.log(`  ${news.length} news items`);
  console.log(`  ${events.length} calendar events`);
  console.log(`  ${forumQs.length} forum questions`);
  console.log(`  ${media.length} media entries`);

  process.exit(0);
}

run().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
