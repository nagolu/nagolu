# Nagolu Hyper-Local Community Platform — Build-Ready MVP Plan

## 1) Recommended Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** NestJS (or Next.js Route Handlers for MVP) + TypeScript
- **Database:** PostgreSQL (primary) + Prisma ORM
- **Cache/queues:** Redis + BullMQ (expiry jobs, notifications)
- **Auth:** JWT (access/refresh) + httpOnly secure cookies
- **Storage:** S3-compatible storage for images
- **Realtime (phase 2+):** Socket.IO (inbox + live notifications)
- **Search:** PostgreSQL full-text + composite filter indexes (OpenSearch later)
- **Infra:** Docker Compose (MVP local), Kubernetes/ECS later

---

## 2) App Structure
- Home page (public exploration)
- Signup/Login
- My Community page
  - Feed tab
  - Services tab
  - Travel tab
  - Sale tab
  - Urgent tab
- Messages inbox
- Notifications center
- User profile
- Admin panel

---

## 3) Folder Structure
```txt
nagolu/
  apps/
    web/
      app/
        page.tsx                    # Home
        auth/signup/page.tsx
        auth/login/page.tsx
        my-community/page.tsx
        inbox/page.tsx
        notifications/page.tsx
        profile/page.tsx
        admin/page.tsx
      components/
        filters/community-filters.tsx
        posts/post-card.tsx
        posts/post-list.tsx
        posts/create-post-modal.tsx
        comments/comment-list.tsx
        messaging/ask-button.tsx
        tabs/community-tabs.tsx
      lib/
        api.ts
        auth.ts
  services/
    api/
      src/
        modules/
          auth/
          users/
          posts/
          comments/
          messages/
          notifications/
          ratings/
          admin/
        jobs/
          expiry.job.ts
          notifications.job.ts
  packages/
    db/
      prisma/schema.prisma
      migrations/
  docs/
    IMPLEMENTATION_PLAN.md
```

---

## 4) Database Schema (SQL)
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  country VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  area VARCHAR(120) NOT NULL,
  community VARCHAR(120) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'user',
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('feed','services','travel','sale','urgent')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  country VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  area VARCHAR(120) NOT NULL,
  community VARCHAR(120) NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  expiry_date TIMESTAMP NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','expired','sold')),
  comments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT NULL REFERENCES posts(id) ON DELETE SET NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL,
  message TEXT NOT NULL,
  post_id BIGINT NULL REFERENCES posts(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ratings_reviews (
  id BIGSERIAL PRIMARY KEY,
  service_post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(service_post_id, user_id)
);

CREATE TABLE service_directory (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  category VARCHAR(120) NOT NULL,
  contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  service_area JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  condition VARCHAR(60) NOT NULL,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE urgent_posts (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  urgency_level VARCHAR(20) NOT NULL DEFAULT 'high',
  expiry_time TIMESTAMP NOT NULL
);
```

### Indexes
- `posts (country, city, area, community, type, status, created_at DESC)`
- `messages (sender_id, receiver_id, created_at DESC)`
- `notifications (user_id, is_read, created_at DESC)`
- `comments (post_id, created_at DESC)`

---

## 5) Core Behavior Mapping
- **Home:** filter by location/community and show matching posts across all types.
- **Signup:** required location/community; sets default My Community.
- **My Community:** tabs + post creation + comments + private Ask.
- **Ask button:** creates private message + notification to post owner.
- **Services:** on create, auto-write `service_directory`; ratings/reviews enabled day one.
- **Expiry:** scheduled job marks services/sale/urgent as `expired` or `hidden` after expiry.
- **Sale:** explicit “mark as sold” updates `sale_items.is_sold=true` and post status `sold`.

---

## 6) API Route Design
### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Posts
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/:id`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

### Comments
- `POST /api/posts/:id/comments`
- `GET /api/posts/:id/comments`

### Messages
- `GET /api/messages`
- `POST /api/messages`
- `GET /api/messages/:conversationId`

### Notifications
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

### Ratings
- `POST /api/services/:id/rating`
- `GET /api/services/:id/ratings`

### Search
- `GET /api/search?country=&city=&area=&community=&type=`

---

## 7) UI Component Breakdown
- `CommunityFilters`: large mobile-select controls + Explore button
- `CommunityHeader`: displays selected community context
- `CommunityTabs`: Feed / Services / Travel / Sale / Urgent
- `PostCard`: title, description, type, location, community, creator, comments count, Ask button
- `CreatePostModal`: dynamic fields by type
- `CommentList` + `CommentComposer`
- `AskMessageDrawer`: private message entry
- `InboxList` + `ConversationView`
- `NotificationList` with read/unread state
- `AdminQueueTable`: reports, spam flags, expired content

---

## 8) Dummy Data (MVP seed)
- Feed:
  - Anyone going to Meadowhall this weekend?
  - New Telugu family in Sheffield looking to connect.
- Services:
  - Reliable plumber available in Sheffield.
  - Need electrician for light fitting.
- Travel:
  - Peak District trip — parking easy before 10 AM.
  - London trip — very crowded near Tower Bridge.
- Sale:
  - Dining table for sale £40.
  - Baby stroller available in good condition.
- Urgent:
  - Parents travelling from Hyderabad to Manchester, need companion.
  - Anyone going Sheffield to London tomorrow morning?

---

## 9) Security & Moderation
- Input validation: Zod/DTO validators
- Auth checks on protected routes
- Authorization checks (ownership + role)
- Rate limits (posts/messages/comments)
- Spam prevention (cooldown + duplicate detection)
- Report button on posts/comments/users
- Basic profanity filter at write-time
- Admin actions: remove posts, hide users, review reports, manage spam, expired queue

---

## 10) MVP Development Phases
1. **Phase 1:** Auth, Home filters, My Community tabs, Post creation, Dummy data
2. **Phase 2:** Comments, Ask/private messaging, Notifications
3. **Phase 3:** Services directory, Ratings/reviews, Sale status, Urgent expiry
4. **Phase 4:** Admin panel, Moderation improvements, Search polish, mobile UX polish

---

## 11) Example Core Code (API pseudo)
```ts
// POST /api/messages (Ask button path)
if (!auth.user) throw new Unauthorized();
const post = await db.post.findById(body.postId);
await db.message.create({
  sender_id: auth.user.id,
  receiver_id: post.user_id,
  post_id: post.id,
  message_text: body.message,
});
await db.notification.create({
  user_id: post.user_id,
  type: 'new_message',
  message: `New private message on: ${post.title}`,
  post_id: post.id,
});
```

```ts
// expiry job (hourly)
await db.posts.updateMany({
  where: { type: { in: ['services', 'sale', 'urgent'] }, expiry_date: { lt: now }, status: 'active' },
  data: { status: 'expired' },
});
```

---

## 12) Missing Improvements Before Coding
- Community taxonomy service (managed list of country/city/area/community)
- Abuse heuristics (phone/email obfuscation, scam keywords)
- Trust score (account age + ratings + report history)
- Safety rails for Sale/Urgent (warning banners + scam checklist)
- Feature flags for staged rollout
- Analytics events for retention and tab usage
