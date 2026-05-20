document.addEventListener('DOMContentLoaded', () => {
    // 1. Calculate path depth & root path prefix
    const scriptSrc = document.currentScript ? document.currentScript.src : '';
    let rootPath = '';
    
    if (scriptSrc && scriptSrc.includes('assets/js/navbar.js')) {
        rootPath = scriptSrc.substring(0, scriptSrc.indexOf('assets/js/navbar.js'));
    } else {
        // Fallback: check location pathname
        const path = window.location.pathname;
        if (path.includes('/projects/')) {
            const afterProjects = path.split('/projects/')[1];
            // Remove leading slash if any, then split by slash
            const segments = afterProjects.replace(/^\//, '').split('/');
            rootPath = '../../' + '../'.repeat(Math.max(0, segments.length - 2));
        } else {
            rootPath = './';
        }
    }

    // 2. Inject CSS stylesheets dynamically
    if (!document.getElementById('theme-module-css')) {
        const linkTheme = document.createElement('link');
        linkTheme.id = 'theme-module-css';
        linkTheme.rel = 'stylesheet';
        linkTheme.href = `${rootPath}assets/css/theme-module.css`;
        document.head.appendChild(linkTheme);
    }

    if (!document.getElementById('navbar-css')) {
        const linkNav = document.createElement('link');
        linkNav.id = 'navbar-css';
        linkNav.rel = 'stylesheet';
        linkNav.href = `${rootPath}assets/css/navbar.css`;
        document.head.appendChild(linkNav);
    }

    // Ensure Google Fonts is loaded
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Plus+Jakarta+Sans"]')) {
        const linkFont = document.createElement('link');
        linkFont.rel = 'stylesheet';
        linkFont.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(linkFont);
    }

    // Ensure Ionicons is loaded
    if (!document.querySelector('script[src*="ionicons"]')) {
        const scriptIon1 = document.createElement('script');
        scriptIon1.type = 'module';
        scriptIon1.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
        document.head.appendChild(scriptIon1);
        
        const scriptIon2 = document.createElement('script');
        scriptIon2.noModule = true;
        scriptIon2.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js';
        document.head.appendChild(scriptIon2);
    }

    // 3. Construct Navbar HTML
    const isHomePage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') || 
                       (!window.location.pathname.includes('.html') && !window.location.pathname.includes('/projects/'));

    const getLink = (hash) => {
        if (isHomePage) {
            return hash;
        } else {
            return `${rootPath}index.html${hash}`;
        }
    };

    const navHTML = `
        <div class="nav-container">
            <a href="${isHomePage ? '#' : rootPath + 'index.html'}" class="nav-brand">Adish Yermal</a>
            <button class="nav-toggle" aria-label="Toggle navigation">
                <span class="hamburger"></span>
            </button>
            <div class="nav-menu">
                <a href="${getLink('#home')}" class="nav-link" data-hash="#home">Home</a>
                <a href="${rootPath}links.html" class="nav-link" data-page="links">Links</a>
                <a href="${getLink('#about')}" class="nav-link" data-hash="#about">About</a>
                <a href="${getLink('#resume')}" class="nav-link" data-hash="#resume">Resume</a>
                <a href="${getLink('#portfolio')}" class="nav-link" data-hash="#portfolio">Portfolio</a>
                <a href="${getLink('#projects')}" class="nav-link" data-hash="#projects">Projects</a>
                <a href="${rootPath}achievement.html" class="nav-link" data-page="achievement">Achievements</a>
                <a href="${getLink('#schedule')}" class="nav-link" data-hash="#schedule">Schedule</a>
                <a href="${getLink('#contact')}" class="nav-link" data-hash="#contact">Contact</a>
            </div>
        </div>
    `;

    // 4. Create nav element and prepend to body
    const navElement = document.createElement('nav');
    navElement.className = 'navbar';
    navElement.innerHTML = navHTML;
    document.body.prepend(navElement);
    
    // Add padding class to body to avoid overlapping content
    document.body.classList.add('has-unified-navbar');

    // 5. Mobile Toggle Logic
    const navToggle = navElement.querySelector('.nav-toggle');
    const navMenu = navElement.querySelector('.nav-menu');
    
    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navElement.classList.toggle('nav-active');
    });

    // Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
        if (!navElement.contains(e.target)) {
            navElement.classList.remove('nav-active');
        }
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navElement.classList.remove('nav-active');
        });
    });

    // 6. Highlight Active Link
    const highlightActive = () => {
        const path = window.location.pathname;
        let activeLink = null;
        
        if (path.includes('achievement.html')) {
            activeLink = navMenu.querySelector('[data-page="achievement"]');
        } else if (path.includes('links.html')) {
            activeLink = navMenu.querySelector('[data-page="links"]');
        } else if (isHomePage) {
            // handle scroll-based activation
            let currentSection = 'home';
            const sections = document.querySelectorAll('section[id]');
            const scrollPosition = window.scrollY + 120;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    currentSection = section.getAttribute('id');
                }
            });
            
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-hash') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        }
        
        if (activeLink) {
            navMenu.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            activeLink.classList.add('active');
        }
    };

    highlightActive();
    if (isHomePage) {
        window.addEventListener('scroll', highlightActive);
    }
});
