console.log("Twitter Quick Mute extension loaded.");

// --- Configuration ---
const TWEET_SELECTOR = 'article[role="article"]';
const USERNAME_SELECTOR = 'a[href^="/"][dir="ltr"]:not([href*="/status/"])';
const ACTIONS_BAR_SELECTOR = 'div[role="group"]';
const PROCESSED_MARKER = "data-quick-mute-added";

// --- Functions ---

function getUsernameFromTweet(tweetElement) {
  try {
    const userLinks = tweetElement.querySelectorAll(USERNAME_SELECTOR);
    for (const link of userLinks) {
      const href = link.getAttribute("href");
      const textContent = link.textContent?.trim();
      if (href && href.startsWith("/") && !href.includes("/") && textContent) {
        const userNameElement = link.closest('div[data-testid="User-Name"]');
        if (userNameElement) {
          const spans = userNameElement.querySelectorAll("span");
          for (const span of spans) {
            if (span.textContent?.startsWith("@")) {
              return span.textContent.trim();
            }
          }
        }
      }
      const userNameTestId = tweetElement.querySelector(
        '[data-testid="User-Name"]'
      );
      if (userNameTestId) {
        const spans = userNameTestId.querySelectorAll("span");
        for (const span of spans) {
          if (span.textContent?.startsWith("@")) {
            return span.textContent.trim();
          }
        }
      }
    }

    const headerSpans = tweetElement.querySelectorAll(
      'div[data-testid="Tweet-User-Avatar"] ~ div span'
    );
    for (const span of headerSpans) {
      if (span.textContent?.startsWith("@")) {
        return span.textContent.trim();
      }
    }
  } catch (error) {
    console.error("Quick Mute: Error finding username:", error, tweetElement);
  }
  return null;
}

function simulateMuteAction(tweetElement, username) {
  const moreButton = tweetElement.querySelector(
    'button[aria-label="More"][data-testid="caret"]'
  );
  if (!moreButton) {
    return;
  }

  moreButton.click();

  // Wait for menu to appear and be fully loaded
  setTimeout(() => {
    try {
      // Find the menu container
      const menu = document.querySelector('div[role="menu"]');
      if (!menu) {
        document.body.click();
        return;
      }

      // Find the mute option by looking for the text content
      const menuItems = menu.querySelectorAll('div[role="menuitem"]');
      let muteMenuItem = null;
      const muteTextIdentifier = `Mute ${username}`;

      // First try exact match
      for (const item of menuItems) {
        const textContent = item.textContent || "";
        if (textContent.trim() === muteTextIdentifier) {
          muteMenuItem = item;
          break;
        }
      }

      // If not found, try partial match
      if (!muteMenuItem) {
        for (const item of menuItems) {
          const textContent = item.textContent || "";
          if (textContent.trim().includes(muteTextIdentifier)) {
            muteMenuItem = item;
            break;
          }
        }
      }

      if (!muteMenuItem) {
        document.body.click();
        return;
      }

      // Ensure the menu item is visible and clickable
      if (muteMenuItem.offsetParent !== null) {
        muteMenuItem.click();
        tweetElement.style.outline = "2px solid orange";
        setTimeout(() => {
          tweetElement.style.outline = "none";
        }, 1500);
      } else {
        document.body.click();
      }
    } catch (error) {
      document.body.click();
    }
  }, 500);
}

function addMuteButtonToTweet(tweetElement) {
  if (tweetElement.hasAttribute(PROCESSED_MARKER)) {
    return;
  }

  const username = getUsernameFromTweet(tweetElement);
  if (!username) {
    tweetElement.setAttribute(PROCESSED_MARKER, "no-user");
    return;
  }

  const actionsBar = tweetElement.querySelector(ACTIONS_BAR_SELECTOR);
  if (!actionsBar) {
    tweetElement.setAttribute(PROCESSED_MARKER, "no-actions");
    return;
  }

  const muteButton = document.createElement("button");
  muteButton.textContent = "Quick Mute";
  muteButton.classList.add("quick-mute-button");
  muteButton.setAttribute("title", `Mute ${username}`);

  muteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    simulateMuteAction(tweetElement, username);
  });

  const shareButton = actionsBar.querySelector('button[data-testid="share"]');
  if (shareButton) {
    actionsBar.insertBefore(muteButton, shareButton);
  } else {
    actionsBar.appendChild(muteButton);
  }

  tweetElement.setAttribute(PROCESSED_MARKER, "true");
}

function processVisibleTweets() {
  const tweets = document.querySelectorAll(
    `${TWEET_SELECTOR}:not([${PROCESSED_MARKER}])`
  );
  tweets.forEach(addMuteButtonToTweet);
}

// --- Initialization and Observation ---

setTimeout(processVisibleTweets, 1000);

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      let foundNewTweets = false;
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches(TWEET_SELECTOR)) {
            addMuteButtonToTweet(node);
            foundNewTweets = true;
          } else {
            const subTweets = node.querySelectorAll(
              `${TWEET_SELECTOR}:not([${PROCESSED_MARKER}])`
            );
            if (subTweets.length > 0) {
              subTweets.forEach(addMuteButtonToTweet);
              foundNewTweets = true;
            }
          }
        }
      });
    }
  }
});

setTimeout(() => {
  const mainContent = document.querySelector('main[role="main"]');
  observer.observe(mainContent || document.body, {
    childList: true,
    subtree: true,
  });
}, 2000);
