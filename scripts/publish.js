const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const schedule = JSON.parse(fs.readFileSync(path.join(projectRoot, 'schedule.json'), 'utf8'));
let indexContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
let sitemapContent = fs.readFileSync(path.join(projectRoot, 'sitemap.xml'), 'utf8');

function generateCardHtml(post) {
  return `        <!-- Post: ${post.filename} -->
        <article class="post-card">
          <div class="post-card-thumb" style="background-image: url('${post.image_url}');">
            <span class="post-tag">${post.tag}</span>
          </div>
          <div class="post-card-content">
            <div class="post-meta">
              <span>Author: Starrope</span>
              <span>•</span>
              <span>${post.date_display}</span>
            </div>
            <h3 class="post-card-title"><a href="posts/${post.filename}">${post.title}</a></h3>
            <p class="post-card-desc">${post.description}</p>
            <div class="post-card-footer">
              <a href="posts/${post.filename}" class="read-more-btn">
                Read Article
                <svg xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </article>
`;
}

function isAlreadyPublished(filename, indexContent) {
  const marker = '<!-- SCHEDULED_POSTS_START -->';
  const sidebarMarker = '<!-- RIGHT: SIDEBAR -->';
  if (!indexContent.includes(marker)) return false;
  const startIdx = indexContent.indexOf(marker);
  const endIdx = indexContent.indexOf(sidebarMarker, startIdx);
  const gridContent = endIdx === -1 ? indexContent.substring(startIdx) : indexContent.substring(startIdx, endIdx);
  return gridContent.includes(`posts/${filename}`);
}

const nowKST = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
const todayKST = nowKST.toISOString().split('T')[0];

let publishedCount = 0;
for (const post of schedule.posts) {
  if (post.publish_date <= todayKST && !isAlreadyPublished(post.filename, indexContent)) {
    console.log(`Publishing: ${post.filename} (${post.publish_date} ${post.publish_time})`);
    const cardHtml = generateCardHtml(post);
    indexContent = indexContent.replace('<!-- SCHEDULED_POSTS_START -->', '<!-- SCHEDULED_POSTS_START -->\n' + cardHtml);
    if (!sitemapContent.includes(`posts/${post.filename}`)) {
      const newUrl = `  <url>\n    <loc>https://blog4.starrope2023.com/posts/${post.filename}</loc>\n    <lastmod>${post.publish_date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      sitemapContent = sitemapContent.replace('</urlset>', newUrl + '</urlset>');
    }
    publishedCount++;
  }
}

if (publishedCount > 0) {
  fs.writeFileSync(path.join(projectRoot, 'index.html'), indexContent, 'utf8');
  fs.writeFileSync(path.join(projectRoot, 'sitemap.xml'), sitemapContent, 'utf8');
  console.log(`Successfully published ${publishedCount} posts!`);
} else {
  console.log('No posts to publish at this time.');
}
