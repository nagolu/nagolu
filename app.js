const data = {
  Feed: [
    { title: 'Anyone going to Meadowhall this weekend?', description: 'Planning Saturday visit. Share timing and rides.', creator: 'Priya', comments: 3 },
    { title: 'New Telugu family in Sheffield looking to connect.', description: 'Would love to meet nearby families.', creator: 'Ravi', comments: 5 }
  ],
  Services: [
    { title: 'Reliable plumber available in Sheffield.', description: 'Emergency/fittings. Service across multiple areas.', creator: 'Arun Services', comments: 7 },
    { title: 'Need electrician for light fitting.', description: 'Need help today evening in City Centre.', creator: 'Lakshmi', comments: 2 }
  ],
  Travel: [
    { title: 'Peak District trip — parking easy before 10 AM.', description: 'Went last Sunday; less crowd early.', creator: 'Naveen', comments: 4 },
    { title: 'London trip — very crowded near Tower Bridge.', description: 'Best visit after 6 PM.', creator: 'Suma', comments: 6 }
  ],
  Sale: [
    { title: 'Dining table for sale £40.', description: '4-seater, pickup only.', creator: 'Ramesh', comments: 1 },
    { title: 'Baby stroller available in good condition.', description: 'Lightweight and foldable.', creator: 'Divya', comments: 2 }
  ],
  Urgent: [
    { title: 'Parents travelling from Hyderabad to Manchester, need companion.', description: 'Flight this week, need Telugu-speaking helper.', creator: 'Kiran', comments: 8 },
    { title: 'Anyone going Sheffield to London tomorrow morning?', description: 'Need same-day travel coordination.', creator: 'Anita', comments: 3 }
  ]
};

const locationText = 'UK • Sheffield • City Centre • Telugu';
const tabs = document.getElementById('tabs');
const posts = document.getElementById('posts');
let active = 'Feed';

function renderTabs() {
  tabs.innerHTML = Object.keys(data)
    .map((t) => `<button class="tab ${t === active ? 'active' : ''}" onclick="setTab('${t}')">${t}</button>`)
    .join('');
}

function renderPosts() {
  posts.innerHTML = data[active]
    .map((item) => `
      <article class="post">
        <span class="pill">${active}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p class="muted">Location: ${locationText}</p>
        <p class="muted">Creator: ${item.creator} • Comments: ${item.comments}</p>
        <div class="actions">
          <button>Comment</button>
          <button class="primary">Ask (private)</button>
        </div>
      </article>`)
    .join('');
}

window.setTab = (tab) => {
  active = tab;
  renderTabs();
  renderPosts();
};

renderTabs();
renderPosts();
