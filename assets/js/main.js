/**
 * Khipro Keyboard Website - Main JavaScript
 * Modular, dependency-free vanilla JS
 */

const ThemeToggle = (() => {
  const STORAGE_KEY = "khipro-theme";
  const THEMES = { LIGHT: "light", DARK: "dark", SYSTEM: "system" };

  const getSystemPreference = () => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return THEMES.DARK;
    }
    return THEMES.LIGHT;
  };

  const resolveTheme = (theme) => {
    if (theme === THEMES.SYSTEM) {
      return getSystemPreference();
    }
    return theme;
  };

  const getStoredTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && Object.values(THEMES).includes(stored)) {
      return stored;
    }
    return THEMES.SYSTEM;
  };

  const setTheme = (themePreference) => {
    localStorage.setItem(STORAGE_KEY, themePreference);
    document.documentElement.setAttribute("data-theme", themePreference);

    const systemPref = getSystemPreference();
    document.documentElement.setAttribute("data-system-pref", systemPref);

    const actualTheme = resolveTheme(themePreference);
    document.documentElement.setAttribute("data-actual-theme", actualTheme);

    window.dispatchEvent(
      new CustomEvent("themeChanged", { detail: { theme: actualTheme, preference: themePreference } })
    );
  };

  const init = () => {
    const themePreference = getStoredTheme();
    setTheme(themePreference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      const currentPreference = getStoredTheme();
      if (currentPreference === THEMES.SYSTEM) {
        setTheme(THEMES.SYSTEM);
      }
      document.documentElement.setAttribute("data-system-pref", getSystemPreference());
    });
  };

  const toggle = () => {
    const current = document.documentElement.getAttribute("data-theme");
    let newTheme;

    if (current === THEMES.SYSTEM) {
      newTheme = THEMES.LIGHT;
    } else if (current === THEMES.LIGHT) {
      newTheme = THEMES.DARK;
    } else {
      newTheme = THEMES.SYSTEM;
    }

    setTheme(newTheme);
  };

  return { init, toggle };
})();

// MOBILE MENU MODULE
const MobileMenu = (() => {
  let toggleButton = null;
  let menu = null;
  let overlay = null;
  let isOpen = false;

  const open = () => {
    if (!menu || !toggleButton) return;
    menu.hidden = false;
    toggleButton.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    isOpen = true;
  };

  const close = () => {
    if (!menu || !toggleButton) return;
    menu.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    isOpen = false;
  };

  const toggle = () => {
    isOpen ? close() : open();
  };

  const init = () => {
    toggleButton = document.querySelector("[data-mobile-menu-toggle]");
    menu = document.getElementById("mobile-menu");
    overlay = document.querySelector("[data-mobile-menu-overlay]");

    if (!toggleButton || !menu) return;

    // Toggle button click
    toggleButton.addEventListener("click", toggle);

    // Overlay click to close
    if (overlay) {
      overlay.addEventListener("click", close);
    }

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    });

    // Close on link click
    const menuLinks = menu.querySelectorAll(".mobile-menu__link");
    menuLinks.forEach((link) => {
      link.addEventListener("click", close);
    });
  };

  return { init };
})();

// FAQ ACCORDION MODULE
const FAQAccordion = (() => {
  const init = () => {
    const faqItems = document.querySelectorAll(".faq-question");

    faqItems.forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        const answer = item.querySelector(".faq-answer");
        const isExpanded = button.getAttribute("aria-expanded") === "true";

        // Close all other items
        document.querySelectorAll(".faq-item").forEach((otherItem) => {
          if (otherItem !== item) {
            const otherButton = otherItem.querySelector(".faq-question");
            const otherAnswer = otherItem.querySelector(".faq-answer");
            otherButton.setAttribute("aria-expanded", "false");
            otherAnswer.hidden = true;
          }
        });

        // Toggle current item
        button.setAttribute("aria-expanded", !isExpanded);
        answer.hidden = isExpanded;
      });
    });
  };

  return { init };
})();

// TABS MODULE
const Tabs = (() => {
  const init = () => {
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tabName = button.getAttribute("data-tab");
        const tabPanel = document.getElementById(`panel-${tabName}`);

        // Deactivate all tabs
        document.querySelectorAll(".tab-button").forEach((btn) => {
          btn.classList.remove("tab-button--active");
          btn.setAttribute("aria-selected", "false");
        });

        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.classList.remove("tab-panel--active");
          panel.hidden = true;
        });

        // Activate clicked tab
        button.classList.add("tab-button--active");
        button.setAttribute("aria-selected", "true");

        if (tabPanel) {
          tabPanel.classList.add("tab-panel--active");
          tabPanel.hidden = false;
        }
      });
    });
  };

  return { init };
})();

// DOCS TOC MODULE - Collapsible Tree Implementation
const DocsTOC = (() => {
  class TreeTOC {
    constructor() {
      this.activeSection = null;
    }

    init() {
      // Clone desktop TOC to mobile drawer
      const desktopToc = document.querySelector(".doc-toc");
      const mobileTocClone = document.querySelector("[data-doc-toc-clone]");

      if (desktopToc && mobileTocClone) {
        mobileTocClone.innerHTML = "";
        const clonedToc = desktopToc.cloneNode(true);
        mobileTocClone.appendChild(clonedToc);
      }

      // Build collapsible structure
      document.querySelectorAll(".doc-toc__nav").forEach((nav) => {
        this.buildCollapsibleGroups(nav);
      });

      // Set up arrow click handlers
      document.querySelectorAll(".doc-toc__nav").forEach((nav) => {
        this.setupArrowHandlers(nav);
      });

      // Set up scroll listener
      this.setupScrollListener();

      // Set up mobile drawer
      this.setupMobileDrawer();
    }

    buildCollapsibleGroups(nav) {
      if (!nav) return;

      const items = nav.querySelectorAll(".doc-toc__item");
      const itemsArray = Array.from(items);

      itemsArray.forEach((item, index) => {
        // Only process items that Hugo marked as having children
        if (item.classList.contains("doc-toc__item--has-children")) {
          // Resolve current item level
          let currentLevel = 1;
          for (let l = 1; l <= 6; l++) {
            if (item.classList.contains(`doc-toc__item--level-${l}`)) {
              currentLevel = l;
              break;
            }
          }

          const children = [];
          let nextIndex = index + 1;

          while (nextIndex < itemsArray.length) {
            const nextItem = itemsArray[nextIndex];

            // Resolve next item level
            let nextLevel = 1;
            for (let l = 1; l <= 6; l++) {
              if (nextItem.classList.contains(`doc-toc__item--level-${l}`)) {
                nextLevel = l;
                break;
              }
            }

            // If next level is same or higher (smaller number), it's not a child
            if (nextLevel <= currentLevel) {
              break;
            }

            children.push(nextItem);
            nextIndex++;
          }

          if (children.length > 0) {
            // Create children container
            const childrenContainer = document.createElement("div");
            childrenContainer.className =
              "doc-toc__children doc-toc__children--collapsed";
            childrenContainer.setAttribute("data-toc-children", "");

            // Create a nested list for children
            const childList = document.createElement("ul");
            childList.className = "doc-toc__list doc-toc__list--nested";
            childList.setAttribute("role", "list");

            // Move children into the container
            // appendChild handles moving from previous parent automatically
            children.forEach((child) => {
              childList.appendChild(child);
            });

            childrenContainer.appendChild(childList);
            item.appendChild(childrenContainer);
          }
        }
      });
    }

    setupArrowHandlers(nav) {
      if (!nav) return;

      nav.querySelectorAll("[data-toc-arrow]").forEach((arrow) => {
        arrow.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const link = arrow.closest(".doc-toc__link");
          const item = link?.closest(".doc-toc__item");

          if (item) {
            this.toggleCollapse(item);
          }
        });
      });

      // Set up link click handlers
      nav.querySelectorAll("[data-toc-link]").forEach((link) => {
        link.addEventListener("click", (e) => {
          if (!e.target.closest("[data-toc-arrow]")) {
            e.preventDefault();
            const href = link.getAttribute("href");
            if (href && href.startsWith("#")) {
              const targetId = href.replace("#", "");
              this.navigateToSection(targetId);
              this.closeMobileDrawer();
            }
          }
        });
      });
    }

    toggleCollapse(item) {
      const children = item.querySelector("[data-toc-children]");
      const arrow = item.querySelector("[data-toc-arrow]");
      const folderIcon = item.querySelector("[data-toc-folder] i");

      if (!children) return;

      const isExpanded = item.classList.contains("doc-toc__item--expanded");

      if (isExpanded) {
        // Collapse
        children.classList.remove("doc-toc__children--expanded");
        children.classList.add("doc-toc__children--collapsed");
        item.classList.remove("doc-toc__item--expanded");

        if (folderIcon) {
          folderIcon.classList.remove("fa-folder-open");
          folderIcon.classList.add("fa-folder");
        }
      } else {
        // Expand
        children.classList.remove("doc-toc__children--collapsed");
        children.classList.add("doc-toc__children--expanded");
        item.classList.add("doc-toc__item--expanded");

        if (folderIcon) {
          folderIcon.classList.remove("fa-folder");
          folderIcon.classList.add("fa-folder-open");
        }
      }

      // Sync with other TOC instances (desktop/mobile)
      this.syncTOCState(item);
    }

    syncTOCState(sourceItem) {
      const link = sourceItem.querySelector(".doc-toc__link");
      if (!link) return;

      const href = link.getAttribute("href");
      const isExpanded = sourceItem.classList.contains(
        "doc-toc__item--expanded"
      );

      // Find the matching item in other TOC instances
      document
        .querySelectorAll(`.doc-toc__link[href="${href}"]`)
        .forEach((otherLink) => {
          const otherItem = otherLink.closest(".doc-toc__item");
          if (otherItem && otherItem !== sourceItem) {
            const otherChildren = otherItem.querySelector(
              "[data-toc-children]"
            );
            const otherFolderIcon = otherItem.querySelector(
              "[data-toc-folder] i"
            );

            if (isExpanded) {
              otherChildren?.classList.remove("doc-toc__children--collapsed");
              otherChildren?.classList.add("doc-toc__children--expanded");
              otherItem.classList.add("doc-toc__item--expanded");

              if (otherFolderIcon) {
                otherFolderIcon.classList.remove("fa-folder");
                otherFolderIcon.classList.add("fa-folder-open");
              }
            } else {
              otherChildren?.classList.remove("doc-toc__children--expanded");
              otherChildren?.classList.add("doc-toc__children--collapsed");
              otherItem.classList.remove("doc-toc__item--expanded");

              if (otherFolderIcon) {
                otherFolderIcon.classList.remove("fa-folder-open");
                otherFolderIcon.classList.add("fa-folder");
              }
            }
          }
        });
    }

    expandToSection(sectionId) {
      // Find all links for this section
      document
        .querySelectorAll(`.doc-toc__link[href="#${sectionId}"]`)
        .forEach((link) => {
          const item = link.closest(".doc-toc__item");
          if (!item) return;

          // Expand parent H2 if this is a child item
          const parentItem = item.parentElement?.closest(
            ".doc-toc__item--has-children"
          );
          if (
            parentItem &&
            !parentItem.classList.contains("doc-toc__item--expanded")
          ) {
            const children = parentItem.querySelector("[data-toc-children]");
            const folderIcon = parentItem.querySelector("[data-toc-folder] i");

            if (children) {
              children.classList.remove("doc-toc__children--collapsed");
              children.classList.add("doc-toc__children--expanded");
              parentItem.classList.add("doc-toc__item--expanded");

              if (folderIcon) {
                folderIcon.classList.remove("fa-folder");
                folderIcon.classList.add("fa-folder-open");
              }
            }
          }
        });
    }

    updateActiveState(activeId) {
      // Store previously active links for collapse
      const previouslyActiveLinks = Array.from(
        document.querySelectorAll(".doc-toc__link--active, .doc-toc__link.active")
      );

      // Remove active class from all links
      document.querySelectorAll(".doc-toc__link").forEach((link) => {
        link.classList.remove("doc-toc__link--active", "active");
      });

      if (!activeId) {
        // Collapse all previously expanded items when no active section
        this.collapsePreviouslyActive(previouslyActiveLinks);
        return;
      }

      // Find and activate the matching link
      document
        .querySelectorAll(`.doc-toc__link[href="#${activeId}"]`)
        .forEach((link) => {
          link.classList.add("doc-toc__link--active", "active");

          // Expand the active item itself if it has children
          const activeItem = link.closest(".doc-toc__item");
          if (activeItem && activeItem.classList.contains("doc-toc__item--has-children")) {
            this.expandItem(activeItem);
          }

          // Expand all parent items
          let parentItem = activeItem?.parentElement?.closest(".doc-toc__item");
          while (parentItem) {
            const parentLink = parentItem.querySelector(".doc-toc__link");
            if (parentLink) {
              parentLink.classList.add("doc-toc__link--active", "active");
            }
            // Auto-expand parent if it has children
            if (parentItem.classList.contains("doc-toc__item--has-children")) {
              this.expandItem(parentItem);
            }
            parentItem = parentItem.parentElement?.closest(".doc-toc__item");
          }
        });

      // Collapse previously active items that are no longer active
      this.collapsePreviouslyActive(previouslyActiveLinks);
    }

    collapsePreviouslyActive(previouslyActiveLinks) {
      previouslyActiveLinks.forEach((oldLink) => {
        // Skip if this link is still active
        if (oldLink.classList.contains("doc-toc__link--active") ||
          oldLink.classList.contains("active")) {
          return;
        }

        // Find the parent item and collapse it if it's no longer in the active path
        const item = oldLink.closest(".doc-toc__item");
        if (!item) return;

        // Only collapse if this item has children and is currently expanded
        if (item.classList.contains("doc-toc__item--has-children") &&
          item.classList.contains("doc-toc__item--expanded")) {
          this.collapseItem(item);
        }
      });
    }

    expandItem(item) {
      if (!item.classList.contains("doc-toc__item--expanded")) {
        const children = item.querySelector("[data-toc-children]");
        const folderIcon = item.querySelector("[data-toc-folder] i");

        if (children) {
          children.classList.remove("doc-toc__children--collapsed");
          children.classList.add("doc-toc__children--expanded");
        }

        item.classList.add("doc-toc__item--expanded");

        if (folderIcon) {
          folderIcon.classList.remove("fa-folder");
          folderIcon.classList.add("fa-folder-open");
        }

        // Sync with other TOC instances
        this.syncTOCState(item);
      }
    }

    collapseItem(item) {
      const children = item.querySelector("[data-toc-children]");
      const folderIcon = item.querySelector("[data-toc-folder] i");

      if (!children) return;

      const isExpanded = item.classList.contains("doc-toc__item--expanded");
      if (!isExpanded) return;

      children.classList.remove("doc-toc__children--expanded");
      children.classList.add("doc-toc__children--collapsed");
      item.classList.remove("doc-toc__item--expanded");

      if (folderIcon) {
        folderIcon.classList.remove("fa-folder-open");
        folderIcon.classList.add("fa-folder");
      }

      // Sync with other TOC instances
      this.syncTOCState(item);
    }

    navigateToSection(linkId) {
      setTimeout(() => {
        const element = document.getElementById(linkId);
        if (element) {
          const header = document.querySelector(".header");
          const headerHeight = header ? header.offsetHeight : 64;
          const offset = element.offsetTop - 80;

          window.scrollTo({
            top: Math.max(0, offset),
            behavior: "smooth",
          });

          history.replaceState(null, null, `#${linkId}`);
        }
      }, 100);
    }

    setupScrollListener() {
      let ticking = false;

      window.addEventListener("scroll", () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const sections = document.querySelectorAll(
              ".doc-article__content h1[id], .doc-article__content h2[id], .doc-article__content h3[id], .doc-article__content h4[id]"
            );
            const header = document.querySelector(".header");
            const headerHeight = header ? header.offsetHeight : 64;
            const scrollPos = window.scrollY + headerHeight + 100;

            let currentSection = null;
            for (let i = sections.length - 1; i >= 0; i--) {
              const section = sections[i];
              if (scrollPos >= section.offsetTop) {
                currentSection = section.id;
                break;
              }
            }

            if (currentSection && currentSection !== this.activeSection) {
              this.activeSection = currentSection;
              this.updateActiveState(currentSection);
            }

            ticking = false;
          });

          ticking = true;
        }
      });
    }

    setupMobileDrawer() {
      const drawer = document.getElementById("doc-toc-drawer");
      const toggleButton = document.querySelector("[data-doc-toc-toggle]");
      const overlay = document.querySelector("[data-doc-toc-overlay]");
      const closeButton = document.querySelector("[data-doc-toc-close]");

      if (!drawer) return;

      const openDrawer = () => {
        drawer.setAttribute("aria-hidden", "false");
        if (toggleButton) {
          toggleButton.setAttribute("aria-expanded", "true");
        }
        document.body.style.overflow = "hidden";
      };

      const closeDrawer = () => {
        drawer.setAttribute("aria-hidden", "true");
        if (toggleButton) {
          toggleButton.setAttribute("aria-expanded", "false");
        }
        document.body.style.overflow = "";
      };

      this.closeMobileDrawer = closeDrawer;

      if (toggleButton) {
        toggleButton.addEventListener("click", () => {
          const isOpen = drawer.getAttribute("aria-hidden") === "false";
          isOpen ? closeDrawer() : openDrawer();
        });
      }

      if (overlay) {
        overlay.addEventListener("click", closeDrawer);
      }

      if (closeButton) {
        closeButton.addEventListener("click", closeDrawer);
      }

      document.addEventListener("keydown", (e) => {
        if (
          e.key === "Escape" &&
          drawer.getAttribute("aria-hidden") === "false"
        ) {
          closeDrawer();
        }
      });
    }

    closeMobileDrawer() {
      // Placeholder
    }
  }

  let tocInstance = null;

  const init = () => {
    if (!document.querySelector(".doc-article")) return;

    tocInstance = new TreeTOC();
    tocInstance.init();
  };

  return { init };
})();

// RESPONSIVE TABLES MODULE

// MERMAID DIAGRAM MODULE
const MermaidDiagrams = (() => {
  let mermaidLoaded = false;
  let mermaidInitializing = false;
  // Store original mermaid source code for each diagram
  const mermaidSources = new Map();

  const loadMermaid = async () => {
    if (mermaidLoaded || mermaidInitializing) return;
    mermaidInitializing = true;

    try {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
      script.onload = () => {
        mermaidLoaded = true;
        mermaidInitializing = false;
        initializeMermaid();
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("Failed to load Mermaid.js:", error);
      mermaidInitializing = false;
    }
  };

  const getTheme = () => {
    const actualTheme = document.documentElement.getAttribute("data-actual-theme");
    return actualTheme === "dark" ? "dark" : "default";
  };

  const initializeMermaid = () => {
    if (!window.mermaid || !mermaidLoaded) return;

    // Store original source before rendering
    document.querySelectorAll(".mermaid").forEach((element) => {
      const source = element.textContent;
      const id = Array.from(document.querySelectorAll(".mermaid")).indexOf(element);
      mermaidSources.set(id, source);
    });

    mermaid.initialize({
      startOnLoad: false,
      theme: getTheme(),
      securityLevel: "loose",
      fontFamily: "Baloo Da 2, sans-serif",
      maxTextSize: 50000,
      flowchart: {
        maxTextSize: 50000,
        htmlLabels: true,
        curve: "basis",
      },
      // Suppress mermaid syntax errors in console
      logLevel: "error",
    });

    mermaid
      .run({
        querySelector: ".mermaid",
        suppressErrorRendering: true,
      })
      .catch((error) => {
        console.error("Mermaid rendering error:", error);
      });
  };

  const reinitializeOnThemeChange = () => {
    if (!mermaidLoaded) return;

    const theme = getTheme();

    // Reset each mermaid element to its original source
    document.querySelectorAll(".mermaid").forEach((element, index) => {
      const originalSource = mermaidSources.get(index);
      if (originalSource) {
        // Reset to original state
        element.textContent = originalSource;
        element.removeAttribute("data-processed");
      }
    });

    // Reinitialize with new theme
    mermaid.initialize({
      theme: theme,
      startOnLoad: false,
      securityLevel: "loose",
      fontFamily: "Baloo Da 2, sans-serif",
      maxTextSize: 50000,
      flowchart: {
        maxTextSize: 50000,
        htmlLabels: true,
        curve: "basis",
      },
      logLevel: "error",
    });

    mermaid
      .run({
        querySelector: ".mermaid",
        suppressErrorRendering: true,
      })
      .catch((error) => {
        console.error("Mermaid re-rendering error:", error);
      });
  };

  const init = () => {
    const hasMermaid = document.querySelector(".mermaid");

    if (hasMermaid) {
      loadMermaid();
      window.addEventListener("themeChanged", reinitializeOnThemeChange);
    }
  };

  return { init };
})();

// CODE COPY BUTTON MODULE
const CodeCopyButton = (() => {
  const copyToClipboard = async (text, button) => {
    try {
      await navigator.clipboard.writeText(text);

      // Show copied state
      button.classList.add("code-copy-btn--copied");
      const icon = button.querySelector("i");
      const textSpan = button.querySelector("span");

      if (icon) {
        icon.className = "fas fa-check";
      }
      if (textSpan) {
        textSpan.textContent = "কপি হয়েছে";
      }

      // Reset after 2 seconds
      setTimeout(() => {
        button.classList.remove("code-copy-btn--copied");
        if (icon) {
          icon.className = "fas fa-copy";
        }
        if (textSpan) {
          textSpan.textContent = "কপি";
        }
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        button.classList.add("code-copy-btn--copied");
        const icon = button.querySelector("i");
        const textSpan = button.querySelector("span");

        if (icon) {
          icon.className = "fas fa-check";
        }
        if (textSpan) {
          textSpan.textContent = "কপি হয়েছে";
        }

        setTimeout(() => {
          button.classList.remove("code-copy-btn--copied");
          if (icon) {
            icon.className = "fas fa-copy";
          }
          if (textSpan) {
            textSpan.textContent = "কপি";
          }
        }, 2000);
      } catch (e) {
        console.error("Failed to copy:", e);
      }

      document.body.removeChild(textArea);
    }
  };

  const createCopyButton = () => {
    const codeBlocks = document.querySelectorAll(".doc-article__content pre");

    codeBlocks.forEach((pre) => {
      // Skip if already has copy button
      if (pre.querySelector(".code-copy-btn")) return;

      const code = pre.querySelector("code");
      if (!code) return;

      // Create wrapper for scrollable code
      const wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";

      // Move code into wrapper
      pre.insertBefore(wrapper, code);
      wrapper.appendChild(code);

      // Create copy button (outside wrapper, directly in pre)
      const button = document.createElement("button");
      button.className = "code-copy-btn";
      button.type = "button";
      button.setAttribute("aria-label", "কোড কপি করুন");
      button.innerHTML = '<i class="fas fa-copy"></i><span>কপি</span>';

      button.addEventListener("click", () => {
        const text = code.textContent;
        copyToClipboard(text, button);
      });

      pre.appendChild(button);
    });
  };

  const init = () => {
    if (!document.querySelector(".doc-article__content")) return;

    // Run on load
    createCopyButton();

    // Also run after a short delay to catch dynamically loaded content
    setTimeout(createCopyButton, 500);
  };

  return { init };
})();

// RESPONSIVE TABLES MODULE
const ResponsiveTables = (() => {
  const wrapTables = () => {
    const tables = document.querySelectorAll(".doc-article__content table");
    const isMobile = window.innerWidth < 768;

    tables.forEach((table) => {
      // Skip if already wrapped
      if (table.closest(".table-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";

      // Insert wrapper before table
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      // On mobile, check if table overflows and add indicator above wrapper
      if (isMobile) {
        // Check if table overflows wrapper
        if (table.scrollWidth > wrapper.clientWidth) {
          const indicator = document.createElement("div");
          indicator.className = "table-scroll-indicator";
          indicator.innerHTML =
            '<i class="fas fa-arrows-left-right"></i><span>সম্পূর্ণ টেবিল দেখতে পাশে স্ক্রোল করুন</span>';
          // Insert indicator BEFORE the wrapper (outside scroll area)
          wrapper.parentNode.insertBefore(indicator, wrapper);
        }
      }
    });
  };

  const init = () => {
    if (!document.querySelector(".doc-article__content")) return;

    // Run on load
    wrapTables();

    // Run on resize with debouncing
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(wrapTables, 250);
    });
  };

  return { init };
})();

// INITIALIZATION
const App = (() => {
  const init = () => {
    ThemeToggle.init();

    // Theme toggle buttons
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", ThemeToggle.toggle);
    });

    // Initialize other modules
    MobileMenu.init();
    FAQAccordion.init();
    Tabs.init();
    DocsTOC.init();
    CodeCopyButton.init();
    MermaidDiagrams.init();
    ResponsiveTables.init();
  };

  return { init };
})();

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", App.init);
} else {
  App.init();
}
