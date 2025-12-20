// Khipro Keyboard - Main JavaScript functionality
// Moved from inline scripts in layouts/_default/single.html

document.addEventListener('DOMContentLoaded', function() {
    // Wrap tables in responsive containers
    const tables = document.querySelectorAll('article table');
    tables.forEach(function(table) {
        // Skip if already wrapped
        if (table.parentElement.classList.contains('table-responsive-wrapper')) {
            return;
        }

        // Create scroll indicator paragraph (before table)
        const indicator = document.createElement('p');
        indicator.className = 'scroll-indicator text-sm text-gray-600 mb-2 flex items-center';
        indicator.innerHTML = '<i class="fas fa-arrows-alt-h mr-2"></i>পাশে স্ক্রল করে সম্পূর্ণ টেবিল দেখুন';
        indicator.style.display = 'none';

        // Insert indicator before table
        table.parentNode.insertBefore(indicator, table);

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive-wrapper';

        // Insert wrapper before table and move table inside
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);

        // Show/hide scroll indicator based on content overflow
        function checkOverflow() {
            const hasOverflow = wrapper.scrollWidth > wrapper.clientWidth;
            indicator.style.display = hasOverflow ? 'flex' : 'none';
        }

        // Check on load and resize with debouncing
        checkOverflow();
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(checkOverflow, 100);
        });

        // Also check after fonts load
        if (document.fonts) {
            document.fonts.ready.then(checkOverflow);
        }
    });

    // Add anchor links to headings
    const headings = document.querySelectorAll('h2, h3, h4, h5, h6');
    headings.forEach(function(heading) {
        if (heading.id) {
            const anchor = document.createElement('a');
            anchor.href = '#' + heading.id;
            anchor.className = 'anchor-link opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-gray-400 hover:text-gray-600';
            anchor.innerHTML = '<i class="fas fa-link text-sm"></i>';
            anchor.setAttribute('aria-label', 'Link to this section');

            heading.classList.add('group');
            heading.appendChild(anchor);
        }
    });

    // Add copy buttons to code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(function(codeBlock) {
        const pre = codeBlock.parentElement;

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper group relative';

        // Create button
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fas fa-copy mr-1.5"></i>কপি';
        button.setAttribute('aria-label', 'Copy code');

        // Insert wrapper before pre and move pre inside
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        wrapper.appendChild(button);

        button.addEventListener('click', function() {
            // Get text content without the $ prefix for shell commands
            let textToCopy = codeBlock.textContent;
            if (codeBlock.className.includes('language-sh') ||
                codeBlock.className.includes('language-bash') ||
                codeBlock.className.includes('language-shell')) {
                textToCopy = textToCopy.replace(/^\$ /gm, '');
            }

            navigator.clipboard.writeText(textToCopy).then(function() {
                button.innerHTML = '<i class="fas fa-check mr-1.5"></i>কপি হয়েছে!';
                button.classList.remove('bg-gray-800', 'hover:bg-gray-700');
                button.classList.add('bg-primary', 'hover:bg-primary-dark');
                setTimeout(function() {
                    button.innerHTML = '<i class="fas fa-copy mr-1.5"></i>কপি';
                    button.classList.remove('bg-primary', 'hover:bg-primary-dark');
                    button.classList.add('bg-gray-800', 'hover:bg-gray-700');
                }, 2000);
            }).catch(function() {
                button.innerHTML = '<i class="fas fa-exclamation mr-1.5"></i>ত্রুটি';
                button.classList.add('bg-red-600');
                setTimeout(function() {
                    button.innerHTML = '<i class="fas fa-copy mr-1.5"></i>কপি';
                    button.classList.remove('bg-red-600');
                }, 2000);
            });
        });
    });

    // TOC Mobile Sheet Toggle
    const tocToggle = document.getElementById('toc-mobile-toggle');
    const tocSheet = document.getElementById('toc-mobile-sheet');
    const tocOverlay = document.getElementById('toc-mobile-overlay');
    const tocClose = document.getElementById('toc-mobile-close');

    function openTocSheet() {
        if (tocSheet && tocOverlay) {
            tocSheet.classList.add('open');
            tocOverlay.classList.add('open');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeTocSheet() {
        if (tocSheet && tocOverlay) {
            tocSheet.classList.remove('open');
            tocOverlay.classList.remove('open');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    if (tocToggle) {
        tocToggle.addEventListener('click', openTocSheet);
    }

    if (tocClose) {
        tocClose.addEventListener('click', closeTocSheet);
    }

    if (tocOverlay) {
        tocOverlay.addEventListener('click', closeTocSheet);
    }

    // Close TOC sheet when clicking on a link
    const tocSheetLinks = document.querySelectorAll('#toc-mobile-sheet a[href^="#"]');
    tocSheetLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            setTimeout(closeTocSheet, 100); // Small delay for smooth navigation
        });
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && tocSheet && tocSheet.classList.contains('open')) {
            closeTocSheet();
        }
    });

    // Header height for scroll offset calculations
    const header = document.getElementById('header');
    const headerHeight = header ? header.offsetHeight : 80; // fallback to 80px
    const scrollOffset = headerHeight + 20; // Add 20px padding

    // TOC Active Link Highlighting (works for both desktop and mobile TOC)
    const tocLinks = document.querySelectorAll('.toc a[href^="#"], #toc-mobile-sheet a[href^="#"]');
    const sections = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

    function updateActiveLink() {
        let current = '';
        const scrollPos = window.scrollY + scrollOffset;

        // Find the current section based on scroll position
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            const sectionTop = section.offsetTop;

            if (scrollPos >= sectionTop) {
                current = section.getAttribute('id');
                break;
            }
        }

        // If we're at the very top, highlight the first section
        if (!current && sections.length > 0 && window.scrollY < scrollOffset) {
            current = sections[0].getAttribute('id');
        }

        // Update active states
        tocLinks.forEach(function(link) {
            link.classList.remove('active');
            if (current && link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    // Smooth scroll with header offset for anchor links
    function smoothScrollToAnchor(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const targetPosition = targetElement.offsetTop - scrollOffset;
            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
        }
    }

    // Handle TOC and anchor link clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            const href = link.getAttribute('href');
            const targetId = href.substring(1);

            if (targetId && document.getElementById(targetId)) {
                e.preventDefault();
                smoothScrollToAnchor(targetId);

                // Update URL without jumping
                if (history.pushState) {
                    history.pushState(null, null, href);
                } else {
                    location.hash = href;
                }

                // Close mobile TOC if open
                if (link.closest('#toc-mobile-sheet')) {
                    setTimeout(closeTocSheet, 100);
                }
            }
        }
    });

    // Handle direct hash navigation (e.g., page load with #anchor)
    function handleHashNavigation() {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            const targetId = hash.substring(1);
            // Small delay to ensure page is fully loaded
            setTimeout(function() {
                smoothScrollToAnchor(targetId);
            }, 100);
        }
    }

    // Handle hash navigation on page load and hash change
    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);

    // Update active link on scroll (only for main content, not TOC scroll)
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                updateActiveLink();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial active link update
    updateActiveLink();


    // Initialize KaTeX for math rendering
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\[', right: '\\]', display: true},
                {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false
        });
    }

    // Convert GitHub-style alerts to proper HTML
    document.querySelectorAll('blockquote p').forEach(function(block) {
        const text = block.textContent;
        if (text.startsWith('[!NOTE]')) {
            block.parentElement.classList.add('alert', 'alert-note');
            block.innerHTML = text.replace('[!NOTE]', '<strong>লক্ষ্য করুন</strong>');
        } else if (text.startsWith('[!TIP]')) {
            block.parentElement.classList.add('alert', 'alert-tip');
            block.innerHTML = text.replace('[!TIP]', '<strong>টিপস</strong>');
        } else if (text.startsWith('[!IMPORTANT]')) {
            block.parentElement.classList.add('alert', 'alert-important');
            block.innerHTML = text.replace('[!IMPORTANT]', '<strong>গুরুত্বপূর্ণ</strong>');
        } else if (text.startsWith('[!WARNING]')) {
            block.parentElement.classList.add('alert', 'alert-warning');
            block.innerHTML = text.replace('[!WARNING]', '<strong>সতর্কতা</strong>');
        } else if (text.startsWith('[!CAUTION]')) {
            block.parentElement.classList.add('alert', 'alert-caution');
            block.innerHTML = text.replace('[!CAUTION]', '<strong>সাবধান</strong>');
        }
    });
});