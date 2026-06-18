export const BUILTIN_LAYOUTS = {
  cv3: {
    html: `<div class="resume-container">
    
    <div class="header-section">
        <div class="pink-banner">
            <div class="logo-circle" id="logo-initials"></div>
            <h1 class="header-name">{{name}}</h1>
            <h2 class="header-title">{{punch_line}}</h2>
        </div>
    </div>

    <div class="content-section">
        
        <div class="left-column">
            {{#summary}}
            <h3 class="script-heading">Profile</h3>
            <p class="body-text">{{summary}}</p>
            {{/summary}}
            
            {{#has_experience}}
            <hr class="divider">
            <h3 class="section-heading">EXPERIENCE</h3>
            {{#experience}}
            <div class="item-box">
                <div class="item-title">{{role}}</div>
                <div class="item-subtitle">{{company}}</div>
                <div class="item-date">{{startDate}} - {{endDate}}</div>
                <div style="font-size: 12px; line-height: 1.55; color: #555; white-space: pre-line;">{{description}}</div>
            </div>
            {{/experience}}
            {{/has_experience}}

            {{#has_projects}}
            <hr class="divider">
            <h3 class="section-heading">PROJECTS</h3>
            {{#projects}}
            <div class="item-box">
                <div class="item-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span>{{title}}</span>
                    {{#link}}<span><a href="{{link}}" target="_blank" style="color: var(--primary-color, #ccab8d); font-size: 11px; text-decoration: none;"><i class="fas fa-external-link-alt" style="font-size: 10px; margin-right: 3px;"></i>View Project</a></span>{{/link}}
                </div>
                <div style="font-size: 12px; line-height: 1.55; color: #555; white-space: pre-line; margin-bottom: 6px;">{{description}}</div>
                <div class="proj-tech" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                    {{#technologies}}
                    <span class="tech-tag" style="font-size: 10px; font-weight: 600; background-color: var(--primary-color-light, #f2e6e6); color: #3b4252; padding: 2px 6px; border-radius: 4px;">{{this}}</span>
                    {{/technologies}}
                </div>
            </div>
            {{/projects}}
            {{/has_projects}}
        </div>

        <div class="right-column">
            
            <ul class="contact-list">
                {{#contact}}
                <li>
                    <svg class="contact-icon" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    {{contact}}
                </li>
                {{/contact}}
                {{#email}}
                <li>
                    <svg class="contact-icon" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    {{email}}
                </li>
                {{/email}}
            </ul>

            {{#has_education}}
            <hr class="divider">
            <h3 class="section-heading">EDUCATION</h3>
            {{#education}}
            <div class="item-box">
                <div class="item-title">{{degree}}</div>
                <div class="item-subtitle">{{institution}}</div>
                <div class="item-date">{{startYear}} - {{endYear}}</div>
            </div>
            {{/education}}
            {{/has_education}}

            {{#has_skills}}
            <hr class="divider">
            <h3 class="section-heading">SKILLS</h3>
            <ul class="skills-list">
                {{#skills}}
                <li>{{this}}</li>
                {{/skills}}
            </ul>
            {{/has_skills}}

            {{#has_languages}}
            <hr class="divider">
            <h3 class="section-heading">LANGUAGES</h3>
            <ul class="skills-list">
                {{#languages}}
                <li>{{this}}</li>
                {{/languages}}
            </ul>
            {{/has_languages}}

            {{#has_certifications}}
            <hr class="divider">
            <h3 class="section-heading">CERTIFICATIONS</h3>
            <ul class="skills-list">
                {{#certifications}}
                <li>{{this}}</li>
                {{/certifications}}
            </ul>
            {{/has_certifications}}

        </div>
    </div>
    
    <script>
        (function() {
            const name = "{{name}}";
            const initialsEl = document.getElementById("logo-initials");
            if (initialsEl && name) {
                const parts = name.trim().split(/\\s+/);
                let initials = "";
                if (parts.length > 0) {
                    initials += parts[0].charAt(0).toLowerCase();
                }
                if (parts.length > 1) {
                    initials += parts[parts.length - 1].charAt(0).toLowerCase();
                } else if (parts.length === 1 && parts[0].length > 1) {
                    initials += parts[0].charAt(1).toLowerCase();
                }
                initialsEl.textContent = initials || "cv";
            }
        })();
    </script>
</div>
<!-- creative v12_cv3 -->`,
    css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.resume-container {
  width: 100%;
  max-width: 850px;
  margin: 0 auto;
  background-color: #ffffff;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.header-section {
  position: relative;
  background-color: #fff;
  padding-top: 65px;
}
.pink-banner {
  background-color: var(--primary-color-light, #f2e6e6);
  text-align: center;
  padding: 55px 20px 35px;
  position: relative;
}
.logo-circle {
  position: absolute;
  top: -42px;
  left: 50%;
  transform: translateX(-50%);
  width: 85px;
  height: 85px;
  background-color: #fff;
  border-radius: 50%;
  border: 4px solid var(--primary-color, #ccab8d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
  font-size: 36px;
  color: #4a4a4a;
  letter-spacing: -2px;
  z-index: 10;
}
.header-name {
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 30px;
  letter-spacing: 10px;
  color: #3b4252;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.header-title {
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 13px;
  letter-spacing: 8px;
  color: #555;
  text-transform: uppercase;
}
.content-section {
  display: flex;
  padding: 35px 40px;
}
.left-column {
  width: 55%;
  padding-right: 25px;
}
.right-column {
  width: 45%;
  padding-left: 25px;
  border-left: 1px solid #dcdcdc;
}
.script-heading {
  font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
  font-size: 32px;
  color: var(--primary-color, #ccab8d);
  font-weight: normal;
  margin-bottom: 10px;
}
.section-heading {
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 14px;
  letter-spacing: 5px;
  color: #3b4252;
  text-transform: uppercase;
  margin-bottom: 15px;
}
p.body-text {
  font-size: 13px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 15px;
}
.divider {
  border: none;
  border-top: 1px solid #dcdcdc;
  margin: 18px 0;
}
.item-box {
  margin-bottom: 18px;
}
.item-title {
  font-size: 12px;
  font-weight: 700;
  color: #4a4a4a;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.item-subtitle {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.item-date {
  font-size: 11px;
  font-weight: 700;
  color: #4a4a4a;
  margin-bottom: 6px;
}
ul.bullet-list {
  list-style-type: disc;
  padding-left: 15px;
}
ul.bullet-list li {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
  margin-bottom: 5px;
}
.contact-list {
  list-style: none;
  margin-bottom: 15px;
}
.contact-list li {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #555;
  margin-bottom: 10px;
}
.contact-icon {
  width: 20px;
  height: 20px;
  margin-right: 15px;
  fill: var(--primary-color, #ccab8d);
}
ul.skills-list {
  list-style-type: disc;
  padding-left: 15px;
}
ul.skills-list li {
  font-size: 13px;
  line-height: 1.5;
  color: #555;
}

@media print {
  body {
    background: white;
    margin: 0;
    padding: 0;
  }
  .resume-container {
    box-shadow: none;
    max-width: 100%;
    width: 100%;
    overflow: visible !important;
  }
  .content-section {
    display: block !important;
    padding: 25px 25px !important;
  }
  .content-section::after {
    content: "";
    display: table;
    clear: both;
  }
  .left-column {
    display: block !important;
    float: left !important;
    width: 55% !important;
    padding-right: 25px !important;
  }
  .right-column {
    display: block !important;
    float: right !important;
    width: 45% !important;
    padding-left: 25px !important;
    border-left: 1px solid #dcdcdc !important;
  }
  .item-box, ul.skills-list li, .divider {
    display: block !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .contact-list li {
    display: flex !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  h1, h2, h3, h4, h5, h6, .section-heading, .script-heading {
    page-break-after: avoid !important;
    break-after: avoid !important;
    display: block !important;
  }
  .header-section {
    padding-top: 45px !important;
  }
  .pink-banner {
    padding: 35px 15px 25px !important;
  }
  .logo-circle {
    width: 75px !important;
    height: 75px !important;
    top: -38px !important;
    font-size: 32px !important;
  }
  p.body-text, ul.bullet-list li, .contact-list li, .skills-list li, .item-box div {
    line-height: 1.45 !important;
  }
  .divider {
    margin: 12px 0 !important;
  }
  .item-box {
    margin-bottom: 12px !important;
  }
  .section-heading {
    margin-bottom: 10px !important;
    font-size: 13px !important;
  }
  .script-heading {
    margin-bottom: 8px !important;
    font-size: 26px !important;
  }
  .contact-list {
    margin-bottom: 10px !important;
  }
  .contact-list li {
    margin-bottom: 6px !important;
  }
}
`
  },
  cv2: {
    html: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<div class="cv-container">
    
    <!-- Header -->
    <header class="cv-header">
        <div class="header-left">
            <h1>{{name}}</h1>
            {{#punch_line}}<div class="role-badge">{{punch_line}}</div>{{/punch_line}}
        </div>
        <div class="header-right">
            <ul class="contact-list">
                {{#contact}}
                <li>
                    <div class="contact-icon"><i class="fas fa-phone"></i></div>
                    {{contact}}
                </li>
                {{/contact}}
                {{#email}}
                <li>
                    <div class="contact-icon"><i class="fas fa-envelope"></i></div>
                    {{email}}
                </li>
                {{/email}}
            </ul>
        </div>
    </header>

    <!-- Main Body -->
    <main class="cv-main">
        
        <!-- About Section -->
        {{#summary}}
        <section class="about-section">
            <h2 class="section-title">ABOUT ME</h2>
            <p class="about-text">{{summary}}</p>
            <hr class="divider">
        </section>
        {{/summary}}

        <div class="cv-columns">
            
            <!-- Left Column -->
            <aside class="left-column">
                {{#has_education}}
                <div class="section">
                    <h2 class="section-title">EDUCATION</h2>
                    {{#education}}
                    <div class="edu-block">
                        <span class="year">({{startYear}} - {{endYear}})</span>
                        <h3>{{institution}}</h3>
                        <p>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}{{#score}} (GPA: {{score}}){{/score}}</p>
                    </div>
                    {{/education}}
                </div>
                <hr class="divider">
                {{/has_education}}

                {{#has_skills}}
                <div class="section skills-section">
                    <h2 class="section-title">SKILLS</h2>
                    <ul class="skills-list">
                        {{#skills}}
                        <li>{{this}}</li>
                        {{/skills}}
                    </ul>
                </div>
                <hr class="divider">
                {{/has_skills}}

                {{#has_languages}}
                <div class="section lang-section">
                    <h2 class="section-title">LANGUAGES</h2>
                    <ul class="lang-list">
                        {{#languages}}
                        <li>{{this}}</li>
                        {{/languages}}
                    </ul>
                </div>
                <hr class="divider">
                {{/has_languages}}

                {{#has_certifications}}
                <div class="section cert-section">
                    <h2 class="section-title">CERTIFICATIONS</h2>
                    <ul class="skills-list">
                        {{#certifications}}
                        <li>{{this}}</li>
                        {{/certifications}}
                    </ul>
                </div>
                {{/has_certifications}}
            </aside>

            <!-- Right Column (Timeline) -->
            <div class="right-column">
                {{#has_experience}}
                <div class="section">
                    <h2 class="section-title">WORK EXPERIENCE</h2>
                    <div class="timeline">
                        {{#experience}}
                        <div class="timeline-item">
                            <span class="year">{{startDate}} - {{endDate}}</span>
                            <h3 class="job-title">{{company}} - {{role}}</h3>
                            <div class="work-desc" style="white-space: pre-line; font-size: 13px; line-height: 1.6; color: var(--text-gray); margin-top: 6px;">{{description}}</div>
                        </div>
                        {{/experience}}
                    </div>
                </div>
                <hr class="divider">
                {{/has_experience}}

                {{#has_projects}}
                <div class="section">
                    <h2 class="section-title">PROJECTS</h2>
                    <div class="timeline">
                        {{#projects}}
                        <div class="timeline-item">
                            <h3 class="job-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span>{{title}}</span>
                                {{#link}}<span><a href="{{link}}" target="_blank" style="color: var(--text-dark); font-size: 12px; text-decoration: none;"><i class="fas fa-external-link-alt" style="font-size: 11px; margin-right: 4px;"></i>Link</a></span>{{/link}}
                            </h3>
                            <div class="work-desc" style="white-space: pre-line; font-size: 13px; line-height: 1.6; color: var(--text-gray); margin-top: 6px;">{{description}}</div>
                            <div class="proj-tech" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                                {{#technologies}}
                                <span class="tech-tag" style="font-size: 11px; font-weight: 600; background-color: var(--bg-light); color: var(--text-dark); padding: 2px 8px; border-radius: 4px;">{{this}}</span>
                                {{/technologies}}
                            </div>
                        </div>
                        {{/projects}}
                    </div>
                </div>
                {{/has_projects}}
            </div>

        </div>
    </main>
</div>
</script>
<!-- creative v12_cv2 -->`,
    css: `:root {
  --text-dark: #111111;
  --text-gray: #444444;
  --accent-yellow: var(--primary-color, #ffda44);
  --bg-light: var(--primary-color-light, #f7f7f7);
  --white: #ffffff;
  --line-color: #e0e0e0;
}

* {
  box-sizing: border-box;
}

.cv-container {
  width: 100%;
  max-width: 850px;
  margin: 0 auto;
  background-color: var(--white);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* --- HEADER --- */
.cv-header {
  background-color: var(--bg-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 50px 40px;
}

.header-left h1 {
  color: var(--text-dark);
  font-size: 42px;
  font-weight: 800;
  line-height: 1.1;
  text-transform: uppercase;
  margin: 0;
}

.role-badge {
  background-color: var(--accent-yellow);
  color: var(--text-dark);
  display: inline-block;
  font-size: 20px;
  font-weight: 500;
  padding: 8px 40px 8px 40px;
  margin-top: 15px;
  margin-left: -40px; /* Extends to the left edge */
}

.header-right {
  text-align: left;
}

.contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contact-list li {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark);
}

.contact-icon {
  background-color: var(--text-dark);
  color: var(--white);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  margin-right: 12px;
  flex-shrink: 0;
}

/* --- MAIN CONTENT --- */
.cv-main {
  padding: 40px;
}

.section-title {
  color: var(--text-dark);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;
}

/* Yellow Underline for Headings */
.section-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 4px;
  background-color: var(--accent-yellow);
}

.about-text {
  font-size: 13px;
  line-height: 1.6;
  text-align: justify;
  margin-bottom: 25px;
}

.divider {
  border: none;
  border-top: 1px solid var(--line-color);
  margin: 25px 0;
}

/* --- TWO COLUMNS --- */
.cv-columns {
  display: flex;
  gap: 40px;
}

.left-column {
  width: 35%;
}

.right-column {
  width: 65%;
}

/* --- LEFT COLUMN STYLES --- */
.edu-block {
  margin-bottom: 20px;
}

.year {
  font-size: 13px;
  color: var(--text-gray);
  margin-bottom: 4px;
  display: block;
}

.edu-block h3, .job-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
  text-transform: uppercase;
  margin-bottom: 4px;
  margin-top: 0;
}

.edu-block p {
  font-size: 13px;
  margin: 0;
}

.skills-list, .lang-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.skills-list li, .lang-list li {
  font-size: 13px;
  margin-bottom: 12px;
  position: relative;
  padding-left: 15px;
}

.skills-list li::before, .lang-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--text-dark);
  font-size: 18px;
  line-height: 14px;
}

/* --- RIGHT COLUMN TIMELINE --- */
.timeline {
  border-left: 1px solid var(--line-color);
  padding-left: 25px;
  margin-left: 5px;
  margin-top: 10px;
}

.timeline-item {
  position: relative;
  margin-bottom: 30px;
}

/* Yellow Dots for Timeline */
.timeline-item::before {
  content: '';
  position: absolute;
  left: -29.5px;
  top: 5px;
  width: 8px;
  height: 8px;
  background-color: var(--accent-yellow);
  border-radius: 50%;
}

.timeline-item .year {
  margin-bottom: 8px;
}

.timeline-item p {
  font-size: 13px;
  line-height: 1.6;
  margin-top: 10px;
  margin-bottom: 10px;
}

.timeline-item ul {
  padding-left: 15px;
  margin: 0;
}

.timeline-item ul li {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 5px;
}

@media print {
  body {
    background: white;
    margin: 0;
    padding: 0;
  }
  .cv-container {
    box-shadow: none;
    max-width: 100%;
    width: 100%;
    overflow: visible !important;
  }
  .cv-header {
    padding: 25px 20px !important;
  }
  .cv-main {
    padding: 20px 25px !important;
  }
  .timeline-item {
    margin-bottom: 16px !important;
  }
  .divider {
    margin: 15px 0 !important;
  }
  .about-text {
    margin-bottom: 15px !important;
  }
  .section-title {
    margin-bottom: 12px !important;
    display: block !important;
    page-break-after: avoid !important;
    break-after: avoid-page !important;
  }
  .cv-columns {
    display: block !important;
  }
  .cv-columns::after {
    content: "";
    display: table;
    clear: both;
  }
  .left-column {
    display: block !important;
    float: left !important;
    width: 35% !important;
  }
  .right-column {
    display: block !important;
    float: right !important;
    width: 60% !important;
  }
  .edu-block, .timeline-item, .skills-list li, .lang-list li, .cert-section, .skills-section, .lang-section {
    display: block !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .contact-list li {
    display: flex !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .about-text, p, li {
    line-height: 1.4 !important;
  }
}
`
  },
  cv1: {
    html: `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<div class="cv-container">
  <!-- Header Section -->
  <header class="header">
    <div class="header-decor">
      <div class="decor-line"></div>
      <div class="decor-circle"></div>
      <div class="decor-circle"></div>
      <div class="decor-line"></div>
    </div>
    <h1>{{name}}</h1>
    <h2>{{punch_line}}</h2>
  </header>

  <!-- Main Body -->
  <div class="cv-body">
    
    <!-- Left Column -->
    <div class="left-col">
      
      <!-- Contact Section -->
      <div class="section contact-section">
        <h2 class="section-title">Contact</h2>
        {{#contact}}
        <div class="contact-item">
          <i class="fas fa-phone"></i>
          <span>{{contact}}</span>
        </div>
        {{/contact}}
        {{#email}}
        <div class="contact-item">
          <i class="fas fa-envelope"></i>
          <span>{{email}}</span>
        </div>
        {{/email}}
      </div>

      <!-- Education Section -->
      {{#has_education}}
      <div class="section">
        <h2 class="section-title">Education</h2>
        {{#education}}
        <div class="edu-item">
          <h4>{{startYear}} - {{endYear}}</h4>
          <h3>{{institution}}</h3>
          <ul>
            <li>{{degree}}{{#fieldOfStudy}} in {{fieldOfStudy}}{{/fieldOfStudy}}{{#score}} (GPA: {{score}}){{/score}}</li>
          </ul>
        </div>
        {{/education}}
      </div>
      {{/has_education}}

      <!-- Skills Section -->
      {{#has_skills}}
      <div class="section skills-section">
        <h2 class="section-title">Skills</h2>
        <ul class="skills-list">
          {{#skills}}
          <li>{{this}}</li>
          {{/skills}}
        </ul>
      </div>
      {{/has_skills}}

      <!-- Languages Section -->
      {{#has_languages}}
      <div class="section lang-section">
        <h2 class="section-title">Languages</h2>
        <ul class="lang-list">
          {{#languages}}
          <li>{{this}}</li>
          {{/languages}}
        </ul>
      </div>
      {{/has_languages}}

      <!-- Certifications Section -->
      {{#has_certifications}}
      <div class="section cert-section">
        <h2 class="section-title">Certifications</h2>
        <ul class="lang-list">
          {{#certifications}}
          <li>{{this}}</li>
          {{/certifications}}
        </ul>
      </div>
      {{/has_certifications}}

    </div>

    <!-- Right Column -->
    <div class="right-col">
      
      <!-- Profile Summary Section -->
      {{#summary}}
      <div class="section">
        <h2 class="section-title">Profile Summary</h2>
        <p class="summary-text">{{summary}}</p>
      </div>
      {{/summary}}

      <!-- Work Experience Section -->
      {{#has_experience}}
      <div class="section">
        <h2 class="section-title">Work Experience</h2>
        {{#experience}}
        <div class="work-item">
          <div class="work-header">
            <h3>{{company}}</h3>
            <span>{{startDate}} - {{endDate}}</span>
          </div>
          <h4>{{role}}</h4>
          <p class="summary-text">{{description}}</p>
        </div>
        {{/experience}}
      </div>
      {{/has_experience}}

      <!-- Projects Section -->
      {{#has_projects}}
      <div class="section projects-section">
        <h2 class="section-title">Projects</h2>
        {{#projects}}
        <div class="work-item" style="margin-bottom: 25px;">
          <div class="work-header">
            <h3>{{title}}</h3>
            {{#link}}<span><a href="{{link}}" target="_blank">View Project</a></span>{{/link}}
          </div>
          <p class="summary-text" style="margin-bottom: 8px;">{{description}}</p>
          <div class="proj-tech" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            {{#technologies}}
            <span class="tech-tag" style="font-size: 11px; font-weight: 600; background-color: var(--header-bg); color: var(--primary-dark); padding: 2px 8px; border-radius: 4px;">{{this}}</span>
            {{/technologies}}
          </div>
        </div>
        {{/projects}}
      </div>
      {{/has_projects}}

    </div>

  </div>
</div>
<!-- creative v12_cv1 -->`,
    css: `:root {
  --primary-dark: var(--primary-color, #1f3b58);
  --text-gray: #5e6b75;
  --header-bg: var(--primary-color-light, #e6f0f9);
  --accent-blue: var(--primary-color-light, #d6e8f8);
}

* {
  box-sizing: border-box;
}

.cv-container {
  width: 100%;
  max-width: 850px;
  margin: 0 auto;
  background-color: #ffffff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

/* --- HEADER --- */
.header {
  background-color: var(--header-bg);
  padding: 40px 0;
  text-align: center;
  position: relative;
}

.header-decor {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
}

.decor-line {
  width: 80px;
  height: 1px;
  background-color: var(--primary-dark);
}

.decor-circle {
  width: 6px;
  height: 6px;
  border: 1px solid var(--primary-dark);
  border-radius: 50%;
  margin: 0 10px;
  background-color: transparent;
}

.header h1 {
  color: var(--primary-dark);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.header h2 {
  color: var(--text-gray);
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 2px;
  margin: 0;
}

/* --- MAIN BODY --- */
.cv-body {
  display: flex;
  padding: 40px 0;
}

.left-col {
  width: 38%;
  padding: 0 25px 0 35px;
}

.right-col {
  width: 62%;
  padding: 0 35px 0 25px;
  border-left: 1.5px solid var(--primary-dark);
}

/* --- SECTIONS --- */
.section {
  margin-bottom: 35px;
  position: relative;
}

/* Timeline dots on the right column border */
.right-col .section::before {
  content: '';
  position: absolute;
  left: -31px; /* Adjust to sit exactly on the vertical border */
  top: 6px;
  width: 10px;
  height: 10px;
  background-color: #fff;
  border: 1.5px solid var(--primary-dark);
  border-radius: 50%;
}

.section-title {
  color: var(--primary-dark);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;
  z-index: 1;
}

/* Light blue circle behind the first letter of headings */
.section-title::after {
  content: '';
  position: absolute;
  left: -8px;
  top: -5px;
  width: 28px;
  height: 28px;
  background-color: var(--accent-blue);
  border-radius: 50%;
  z-index: -1;
}

/* --- LEFT COLUMN CONTENT --- */
.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--primary-dark);
}

.contact-item i {
  width: 25px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

.contact-item span {
  color: var(--text-gray);
}

.contact-item a {
  color: inherit;
  text-decoration: none;
}
.contact-item a:hover {
  text-decoration: underline;
}

.edu-item {
  margin-bottom: 20px;
}

.edu-item h4 {
  color: var(--primary-dark);
  font-size: 13px;
  margin-bottom: 3px;
  font-weight: 600;
}

.edu-item h3 {
  color: var(--primary-dark);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.edu-item ul, .skills-list, .lang-list {
  list-style-type: disc;
  padding-left: 18px;
}

.edu-item ul li, .skills-list li, .lang-list li {
  font-size: 13px;
  margin-bottom: 5px;
  line-height: 1.5;
  color: var(--text-gray);
}

.lang-list li strong {
  font-weight: 600;
  color: var(--text-gray);
}

/* --- RIGHT COLUMN CONTENT --- */
.summary-text {
  font-size: 13px;
  line-height: 1.8;
  text-align: justify;
  color: var(--text-gray);
  margin: 0;
}

.work-item {
  margin-bottom: 25px;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.work-header h3 {
  color: var(--primary-dark);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.work-header span {
  font-size: 13px;
  color: var(--text-gray);
  font-weight: 500;
}

.work-item h4 {
  color: var(--text-gray);
  font-size: 14px;
  font-weight: 500;
  margin: 5px 0 10px 0;
}

.work-item ul {
  list-style-type: disc;
  padding-left: 18px;
}

.work-item ul li {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 6px;
  color: var(--text-gray);
}

@media print {
  body {
    background: white;
    margin: 0;
    padding: 0;
  }
  .cv-container {
    box-shadow: none;
    max-width: 100%;
    width: 100%;
    overflow: visible !important;
  }
  .header {
    padding: 20px 0 !important;
  }
  .cv-body {
    display: block !important;
    padding: 15px 0 !important;
  }
  .cv-body::after {
    content: "";
    display: table;
    clear: both;
  }
  .left-col {
    display: block !important;
    float: left !important;
    width: 38% !important;
    padding: 0 25px 0 35px !important;
  }
  .right-col {
    display: block !important;
    float: right !important;
    width: 62% !important;
    padding: 0 35px 0 25px !important;
    border-left: 1.5px solid var(--primary-dark) !important;
  }
  .section {
    margin-bottom: 20px !important;
  }
  .section-title {
    margin-bottom: 12px !important;
    display: block !important;
    page-break-after: avoid !important;
    break-after: avoid-page !important;
  }
  .work-item {
    margin-bottom: 15px !important;
  }
  .edu-item {
    margin-bottom: 12px !important;
  }
  .contact-item {
    margin-bottom: 8px !important;
  }
  .edu-item, .work-item, .skills-list li, .lang-list li, .cert-section, .skills-section, .lang-section, .contact-section {
    display: block !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .contact-item {
    display: flex !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .summary-text, p, li {
    line-height: 1.4 !important;
  }
}
`
  }
};
