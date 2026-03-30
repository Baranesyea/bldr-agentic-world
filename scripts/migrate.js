const postgres = require('postgres');
const sql = postgres('postgresql://postgres.exzkttttnsnpwzouwiqq:The%40gentic3orldPa5%24@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres');

async function run() {
  // Tables
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      avatar_type avatar_type DEFAULT 'generated',
      bio TEXT,
      current_projects TEXT,
      role user_role DEFAULT 'member' NOT NULL,
      timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem',
      notification_prefs JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      thumbnail TEXT,
      status course_status DEFAULT 'draft' NOT NULL,
      drip_enabled BOOLEAN DEFAULT false,
      drip_start_offset INTEGER,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      display_order INTEGER DEFAULT 0 NOT NULL,
      drip_unlock_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      video_url TEXT,
      video_provider video_provider,
      duration INTEGER,
      display_order INTEGER DEFAULT 0 NOT NULL,
      attachments JSONB DEFAULT '[]',
      has_assignment BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      type assignment_type DEFAULT 'text' NOT NULL,
      instructions TEXT,
      deadline TIMESTAMP,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      files JSONB DEFAULT '[]',
      status submission_status DEFAULT 'not_submitted' NOT NULL,
      submitted_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      status progress_status DEFAULT 'not_started' NOT NULL,
      completed_at TIMESTAMP,
      watch_position INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      video_timestamp VARCHAR(10),
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      icon VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES forum_categories(id),
      title VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      tags JSONB DEFAULT '[]',
      pinned BOOLEAN DEFAULT false,
      locked BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_replies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      parent_reply_id UUID,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS support_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      media_link TEXT,
      status question_status DEFAULT 'pending' NOT NULL,
      admin_response TEXT,
      admin_response_media TEXT,
      tags JSONB DEFAULT '[]',
      is_published BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      answered_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type chat_channel_type DEFAULT 'general' NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      attachments JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      type event_type DEFAULT 'live' NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      recording_url TEXT,
      transcript_url TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status rsvp_status DEFAULT 'attending' NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      members JSONB DEFAULT '[]',
      chat_channel_id UUID REFERENCES chat_channels(id),
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pod_checkins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_number INTEGER NOT NULL,
      done_this_week TEXT,
      goal_next_week TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reputation (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      total_points INTEGER DEFAULT 0 NOT NULL,
      level_name VARCHAR(50) DEFAULT 'Explorer',
      badges JSONB DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS reputation_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type reputation_event_type NOT NULL,
      points INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_feed_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type activity_feed_type DEFAULT 'auto' NOT NULL,
      trigger activity_trigger,
      title VARCHAR(500) NOT NULL,
      body TEXT,
      image_url TEXT,
      link_url TEXT,
      link_label VARCHAR(100),
      is_read_by JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      class notification_class NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT false NOT NULL,
      channel notification_channel DEFAULT 'in_app' NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS theme_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      primary_color VARCHAR(20) DEFAULT '#0000FF',
      secondary_color VARCHAR(20) DEFAULT '#050510',
      font_heading VARCHAR(100),
      font_body VARCHAR(100),
      logo_url TEXT,
      favicon_url TEXT
    );

    -- Additional tables for localStorage data not in original schema
    CREATE TABLE IF NOT EXISTS case_studies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      thumbnail TEXT,
      category VARCHAR(255),
      content TEXT,
      tags JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category VARCHAR(255),
      tags JSONB DEFAULT '[]',
      source TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      body TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(255) NOT NULL UNIQUE,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS share_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token VARCHAR(255) NOT NULL UNIQUE,
      course_id UUID,
      lesson_id UUID,
      type VARCHAR(50),
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      expires_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      type VARCHAR(50),
      message TEXT NOT NULL,
      rating INTEGER,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_registry (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      label VARCHAR(500),
      key VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );
  `);

  console.log('All tables created!');
  process.exit(0);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
