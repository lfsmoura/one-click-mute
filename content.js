console.log("Twitter Quick Mute extension loaded.");

// --- Configuration ---
const TWEET_SELECTOR = 'article[role="article"]';
const USERNAME_SELECTOR = 'a[href^="/"][dir="ltr"]:not([href*="/status/"])';
const ACTIONS_BAR_SELECTOR = 'div[role="group"]';
const PROCESSED_MARKER = "data-quick-mute-added";
const CHECK_INTERVAL = 2000; // Check for new tweets every 2 seconds

// --- Functions ---

function getUsernameFromTweet(tweetElement) {
  try {
    // First try to find the username in the User-Name section
    const userNameSection = tweetElement.querySelector(
      '[data-testid="User-Name"]'
    );
    if (userNameSection) {
      // Look for the @username span
      const spans = userNameSection.querySelectorAll("span");
      for (const span of spans) {
        const text = span.textContent?.trim();
        if (text?.startsWith("@")) {
          return text;
        }
      }
    }

    // Try to find username in the avatar container
    const avatarContainer = tweetElement.querySelector(
      '[data-testid="UserAvatar-Container-"]'
    );
    if (avatarContainer) {
      const username = avatarContainer
        .getAttribute("data-testid")
        ?.replace("UserAvatar-Container-", "");
      if (username) {
        return `@${username}`;
      }
    }

    // Look for any link that contains the username
    const links = tweetElement.querySelectorAll('a[href^="/"]');
    for (const link of links) {
      const href = link.getAttribute("href");
      if (href && !href.includes("/status/") && !href.includes("/i/")) {
        const text = link.textContent?.trim();
        if (text?.startsWith("@")) {
          return text;
        }
      }
    }

    // Last resort: look for any text that starts with @
    const allTextNodes = tweetElement.querySelectorAll("span");
    for (const node of allTextNodes) {
      const text = node.textContent?.trim();
      if (text?.startsWith("@")) {
        return text;
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

  setTimeout(() => {
    try {
      const menu = document.querySelector('div[role="menu"]');
      if (!menu) {
        document.body.click();
        return;
      }

      const menuItems = menu.querySelectorAll('div[role="menuitem"]');
      let muteMenuItem = null;
      const muteTextIdentifier = `Mute ${username}`;

      for (const item of menuItems) {
        const textContent = item.textContent || "";
        if (textContent.trim().includes(muteTextIdentifier)) {
          muteMenuItem = item;
          break;
        }
      }

      if (!muteMenuItem) {
        document.body.click();
        return;
      }

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
  // Find all tweets that don't have the processed marker
  const tweets = document.querySelectorAll(
    `${TWEET_SELECTOR}:not([${PROCESSED_MARKER}])`
  );

  // Process each tweet
  tweets.forEach(addMuteButtonToTweet);

  // Also check for tweets in any iframes (like embedded tweets)
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const iframeTweets = iframeDoc.querySelectorAll(
        `${TWEET_SELECTOR}:not([${PROCESSED_MARKER}])`
      );
      iframeTweets.forEach(addMuteButtonToTweet);
    } catch (e) {
      // Skip iframes we can't access due to same-origin policy
    }
  });
}

// --- Initialization and Observation ---

// Initial processing
setTimeout(processVisibleTweets, 1000);

// Set up periodic checks
const periodicCheck = setInterval(processVisibleTweets, CHECK_INTERVAL);

// Set up mutation observer with more comprehensive options
const observer = new MutationObserver((mutations) => {
  let shouldProcess = false;

  for (const mutation of mutations) {
    // Check for child list changes
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      shouldProcess = true;
      break;
    }

    // Check for attribute changes that might indicate new content
    if (
      mutation.type === "attributes" &&
      (mutation.target.matches(TWEET_SELECTOR) ||
        mutation.target.closest(TWEET_SELECTOR))
    ) {
      shouldProcess = true;
      break;
    }
  }

  if (shouldProcess) {
    processVisibleTweets();
  }
});

// Start observing with more comprehensive options
setTimeout(() => {
  const mainContent = document.querySelector('main[role="main"]');
  const targetNode = mainContent || document.body;

  observer.observe(targetNode, {
    childList: true, // Watch for changes to child elements
    subtree: true, // Watch all descendants, not just direct children
    attributes: true, // Watch for attribute changes
    characterData: true, // Watch for text content changes
  });
}, 2000);

// Clean up when the page is unloaded
window.addEventListener("unload", () => {
  observer.disconnect();
  clearInterval(periodicCheck);
});
