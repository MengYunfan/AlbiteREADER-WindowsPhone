/*
 * Albite READER
 *
 * Copyright (c) 2014 Svetlin Ankov
 * All Rights Reserved
 *
 * This product is protected by copyright and distributed under
 * licenses restricting copying, distribution, and decompilation.
 */

// Defines the Albite namespace
var Albite = {};

// Note:
// I am not using prototypes for the emulation of a class method, because
// the classes that use this are going to be available in very small counts,
// thus speed and encapsulation are more important than small memory concerns.

Albite.Debug = function(context) {

  // Log a message
  function log(msg) {
    if (!context.debugEnabled) {
      // Don't print logs for non-debug versions
      return;
    }

    context.host.log(msg);
  }

  function printProperties(element) {
    this.log("typeof: " + typeof element);
    for (var key in element) {
      this.log(key + ": " + element[key]);
    }
  }

  this.log              = log;
  this.printProperties  = printProperties;
};

Albite.Debug.isMobile = function() {
  return navigator.userAgent.match(/Windows Phone/i);
};

Albite.Benchmark = function() {
  this.start = function() {
    if (this.running) {
      throw new Error(0, "Benchmark already running");
    }

    this.running = true;
    this.startTime = Date.now();
  };

  this.end = function() {
    if (!this.running) {
      throw new Error(0, "Benchmark not running");
    }

    this.elapsedTime = this.elapsed();
    this.running = false;
    return this.elapsedTime;
  };

  this.elapsed = function() {
    if (this.running) {
      return Date.now() - this.startTime;
    } else {
      return this.elapsedTime;
    }
  };
};

Albite.Helpers = {
  createElement: function(element, doc) {
    var ns = doc.documentElement.namespaceURI;
    if (ns) {
      return doc.createElementNS(ns, element);
    } else {
      return doc.createElement(element);
    }
  },

  // Inject a CSS file into a document at runtime
  // and call a callback after that
  loadCssFile: function(filename, doc, callback) {
    var linkElement = this.createElement("link", doc);

    linkElement.setAttribute("rel", "stylesheet");
    linkElement.setAttribute("type", "text/css");
    linkElement.setAttribute("href", filename);

    if (callback) {
      linkElement.addEventListener('load', callback);
    }

    doc.getElementsByTagName("head")[0].appendChild(linkElement);
  },

  validateOptions: function(options, requiredOptions) {
    for (var key in requiredOptions) {
      var option = requiredOptions[key];

      if (typeof options[option] === "undefined") {
        throw("Required option `" + option + "` not found");
      }
    }
  },

  setDefaultOptions: function(options, defaultOptions) {
    for (var option in defaultOptions) {
      if (typeof options[option] === "undefined") {
        options[option] = defaultOptions[option];
      }
    }
  },

  shallowCopy: function(obj) {
    var newObj = { };

    for (var key in obj) {
      newObj[key] = obj[key];
    }

    return newObj;
  }
};

// Now add extender methods
HTMLElement.prototype.show = function() {
  this.style.visibility = "visible";
};

HTMLElement.prototype.hide = function() {
  this.style.visibility = "hidden";
};

// These must not use the prototype
Math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};

Math.sign = function(value) {
  return value ? value < 0 ? -1 : 1 : 0;
};

Albite.FPSCounter = function() {
  var previousTime = null;
  var totalTime = 0;
  var iterations = 0;

  function tick() {
    var now = Date.now();

    if (previousTime != null) {
      totalTime += now - previousTime;
      iterations += 1;
    }

    previousTime = now;
  }

  function getAverageFps() {
    var averageTime = totalTime / iterations;
    var averageFPS = Math.round(1000 / averageTime);
    return averageFPS;
  }

  function reset() {
    previousTime = null;
    totalTime = 0;
    iterations = 0;
  }

  this.tick           = tick;
  this.getAverageFps  = getAverageFps;
  this.reset          = reset;
}

Albite.WindowScroller = function(window) {

  function scrollBy(dx) {
    window.scrollBy(dx, 0);
  }

  function scrollTo(x) {
    window.scrollTo(x, 0);
  }

  function getPosition() {
    return window.pageXOffset;
  }

  this.scrollBy     = scrollBy;
  this.scrollTo     = scrollTo;
  this.getPosition  = getPosition;
};

Albite.Notifications = function(context) {
  var mainDocument  = context.mainWindow.document;
  var notifications = mainDocument.getElementById("notifications");
  var notificationsBox = mainDocument.getElementById("notifications_box");
  var timer = null;

  notifications.addEventListener("transitionend", function() {
    if (notifications.className == "notifications_hidden_transition") {
      notifications.style.display = "none";
    }
  }, false);

  function hideNotifications() {
    notifications.className = "notifications_hidden_transition";
    cancelTimer();
  }

  function cancelTimer() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function showNotification(text, timeout) {
    if (typeof timeout === 'undefined') {
      timeout = 2000; // default
    }

    cancelTimer();

    if (context.loaded) {
      notificationsBox.innerText = text;
      notifications.style.display = "block";
      notifications.className = "notifications_visible_transition";
      if (timeout > 0) {
        timer = setTimeout(hideNotifications, timeout);
      }
    }
  }

  function showPageNumbers(timeout) {
    var currentPage = context.pager.getCurrentPage();
    var pageCount = context.pager.getPageCount();
    showNotification(currentPage + " / " + pageCount, timeout);
  }

  this.showNotification = showNotification;
  this.hideNotifications = hideNotifications;
  this.showPageNumbers = showPageNumbers;
}

Albite.Pager = function(context) {

  var scroller  = context.scroller;
  var bodyWidth = context.contentWindow.document.body.scrollWidth;
  var pageWidth = context.width;
  var bookmarkMaxLength = context.bookmarkMaxLength;

  var count;
  var current;

  function setUp() {
    // Sometimes pagination doesn't work absolutely correctly,
    // producing an extra pixel.
    // Change the strategy:
    // 1. Do not fail
    // 2. Floor the value
    var pages = bodyWidth / pageWidth;

    // Don't count the first and last dummy pages
    count = Math.floor(pages) - 2;

    // Clamp it just in case
    if (count < 1) {
      count = 1;
    }
  }

  // Helpers
  function firstPage() {
    return 1;
  }

  function lastPage() {
    return count;
  }

  function isFirstPage(page) {
    return page <= firstPage();
  }

  function isLastPage(page) {
    return page >= lastPage();
  }

  function validate(page) {
    if (typeof page !== "number") {
      page = 1;
    }

    // floor the value as it can be a float
    page = Math.floor(page);

    if (isFirstPage(page)) {
      page = firstPage();
    }

    if (isLastPage(page)) {
      page = lastPage();
    }

    return page;
  }


  var VERSIONS = {
    "V1" : 1
  }

  var LAST_VERSION = VERSIONS.V1;

  function importLocation(loc) {
    switch (loc.version) {
      case VERSIONS.V1:
        return importLocationV1(loc);
    }

    // Assume internal location, i.e.
    // there's nothing to import
    return loc;
  }

  function importLocationV1(loc) {
    // copy the old path
    var newPath = loc.elementPath.slice(0);

    // account for albite_root
    newPath.splice(0, 0, 0);

    // account for albite_start
    newPath[1] += 1;

    // Shallow copy of the the location
    var newLocation = Albite.Helpers.shallowCopy(loc);

    // Use new path
    newLocation["elementPath"] = newPath;

    return newLocation;
  }

  function exportLocation(loc) {
    // Copy the old path and account for albite_root
    var newPath = loc.elementPath.slice(1);

    // Account for albite_start
    newPath[0] -= 1;

    // Shallow copy of the the location
    var newLocation = Albite.Helpers.shallowCopy(loc);

    // Use new path
    newLocation["elementPath"] = newPath;

    // set correct version
    newLocation["version"] = LAST_VERSION;

    return newLocation;
  }

  function getPageForPoint(x) {
    return validate(Math.floor(x / pageWidth));
  }

  function getPageForLocation(location) {
    try {
      var iLoc  = importLocation(location);
      var path  = iLoc.elementPath;
      var doc   = context.contentWindow.document;
      var node  = doc.body;

      // First try to get the node
      for (var i = 0; i < path.length; i++) {
        node = node.childNodes[path[i]];
      }

      // default the offset to 0,
      var offset = iLoc.textOffset || 0;
      if (offset >= node.length) {
        // In case the offset was bad and range.setStart() would throw
        // an exception. We'd rather be a little off the right spot
        // than fail completely and go to the first page.
        //
        // Note also that for node.length the box returned would be
        // empty, so it would again mean we'd go to the first page.
        offset = node.length > 0 ? node.length - 1 : 0;
      }

      var range = doc.createRange();
      var box;
      var point;

      // Try the usual way: if there was text on the page,
      // it would've found the right textOffset.
      range.setStart(node, offset);
      range.setEnd(node, offset);
      box = range.getBoundingClientRect();
      point = box.left;

      if (box.height == 0) {
        // There wasn't text on the page, so it got either the text node on
        // the previous page or on the next page.

        // Try searching left to right, i.e. the text node was on the
        // previous page
        range.setStart(node, offset);
        range.setEnd(node, node.length > 0 ? node.length - 1 : 0);
        box = range.getBoundingClientRect();
        point = box.left;

        if (box.height == 0) {
          // Try searching right to left, i.e. the text node was on the
          // next page
          range.setStart(node, 0);
          range.setEnd(node, offset);
          box = range.getBoundingClientRect();
          point = box.right;
        }
      }
      return getPageForPoint(scroller.getPosition() + point);
    } catch(e) {
      // Something is wrong with the . Default ot 1
      return 1;
    }
  }

  // Actual Implementation
  function getPageCount() {
    return count;
  }

  function getCurrentPage() {
    return current;
  }

  function goToFirstPage() {
    goToPage(firstPage());
  }

  function goToLastPage() {
    goToPage(lastPage());
  }

  function goToPreviousPage() {
    goToPage(current - 1);
  }

  function goToNextPage() {
    goToPage(current + 1);
  }

  function getTextLocation() {
    function makeLocation(node, textOffset) {
      if (!node || node.nodeType !== Node.TEXT_NODE) {
        // It only makes sense for text nodes
        return {};
      }
      return { "node" : node, "textOffset" : textOffset };
    }

    // According to MDN:
    // The amount of scrolling that has been done of the viewport area (or any
    // other scrollable element) is taken into account when computing the
    // bounding rectangle. ... If this is not the desired behaviour just add
    // the current scrolling position to the top and left property (via
    // window.scrollX and window.scrollY) to get constant values independent
    // from the current scrolling position.
    var widthOffset = scroller.getPosition();

    // This holds the positioning data for a particular text node
    function PageContent(element, rect) {

      // Need to take into account the current page
      var page = Math.floor((rect.left + widthOffset) / pageWidth);

      this.element  = element;
      this.left     = rect.left;
      this.right    = rect.right;
      this.top      = rect.top;
      this.bottom   = rect.bottom;

      // As if the pages were positioned vertically
      this.start    = rect.top    + (page * pageWidth);
      this.end      = rect.bottom + (page * pageWidth);
    }

    var doc       = context.contentWindow.document;
    var range     = doc.createRange();
    var content   = [];

    // Get all text nodes that are on this page, or prior to this page
    var nodeIterator = doc.createNodeIterator(
      doc.body,
      NodeFilter.SHOW_TEXT,
      function(node) {
        // Select the node
        range.selectNodeContents(node);

        // Get the bounding box
        var box = range.getBoundingClientRect();
        if (box.height > 0) {
          // It's not a dummy text node
          content.push(new PageContent(node, box));
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_SKIP;
      },
      false
    );

    // Exhaust the iterator
    while (nodeIterator.nextNode()) { }

    if (content.length === 0) {
      // No nodes. Perhaps an empty document?
      // Default to the beginning of the document
      return makeLocation();
    }

    // Sort in reverse the content rectangles using their left value,
    // (the page they start at)
    content.sort( function(a, b) { return b.left - a.left; } );

    var c;

    // Are there nodes that come through our page?
    var contentOnPage = [];
    for (var i = 0; i < content.length; i++) {
      c = content[i];
      if (c.right > 0) {
        // goes through the current page, we want this one
        contentOnPage.push(c);
      }
    }

    function getHalf(start, end) {
      // We want it to be at least 1, or the search might loop indefinitely
      return Math.max(Math.floor((end - start) / 2), 1);
    }

    function intersectsPage(start, end, node, range) {
      range.setStart(node, start);
      range.setEnd(node, end);
      var box = range.getBoundingClientRect();

      // The box does not intersect the page if its left edge is right of the
      // page or its right edge is left of the page. Don't forget that those
      // values are relative to the current scroll (and therefore page)
      return !(box.left > pageWidth || box.right < 0);
    }

    function onThisPage(offset, range, node) {
      range.setStart(node, offset);
      range.setEnd(node, offset);
      var box = range.getBoundingClientRect();

      // It's a zero-width selection, so checking either horizontal edge is
      // enough. However, it might be comprised only of spaces so the height
      // might be zero
      return box.left >= 0 && box.height > 0;
    }

    if (contentOnPage.length > 0) {
      // We have content on the page. Use the one that's high up
      contentOnPage.sort( function(a, b) { return a.start - b.start; } );
      c = contentOnPage[0];
      var node = c.element;

      // Sort of Newton's Method, i.e. sort of binary search but not quite
      var start = 0;
      var end = node.length;
      var half;
      var offset;

      // Phase #1: Find an offset that is on this page
      while (start < end) {
        half = getHalf(start, end);
        offset = start + half;

        // Does the left interval intersect the page?
        var leftHasIt = intersectsPage(start, offset, node, range);

        // Does the right interval intersect the page?
        var rightHasIt = intersectsPage(offset, end, node, range);

        if (leftHasIt && rightHasIt) {
          // Both halfs have intersect the page. Done
          break;
        } else if (leftHasIt) {
          // Search left
          end -= half;
        } else if (rightHasIt) {
          // Search right
          start += half;
        } else {
          // Something's wrong. Default to the start of the found node
          return makeLocation(node, 0);
        }
      }

      if (start >= end) {
        if (start !== end) {
          // Something's wrong. Default to the start of the found node
          return makeLocation(node, 0);
        }

        // No point looking further
        return makeLocation(node, start);
      }

      // Phase #2: Look for the uppermost point on the page
      // We might end right after onThisPage returns false. So we need the
      // last valid offset
      var validOffset = start;

      while (start < end) {
        half = getHalf(start, end);
        offset = start + half;

        if (onThisPage(offset, range, node)) {
          validOffset = offset;
          end -= half;
        } else {
          start += half;
        }
      }

      // Note due to the requirement that the offset is at least 1,
      // the return validOffset will be at least 1. That shouldn't be
      // a problem tough.
      return makeLocation(node, validOffset);
    } else {
      // No content on this page. Use the one that ends last
      content.sort( function(a, b) { return b.end - a.end; } );

      // Sort was in reverse, so it should be the first element
      c = content[0];

      // Use the last character's offset
      // No need to care that Range.setStart() would fail as it would
      // return an empty box. It will be remedied in getPageForLocation()
      return makeLocation(c.element, c.element.length);
    }
  }

  function makeDomLocation(node, textOffset, relativeLocation) {
      if (!node || node.nodeType !== Node.TEXT_NODE) {
      // It only makes sense for text nodes
      return {};
    }

    function findPath(node, elementPath) {
      // Loop until we've reached the body element. No need to go further
      while (node && !(node.tagName && node.tagName.toLowerCase() === 'body')) {
        var parent = node.parentNode;
        if (!parent) {
          // parent should never be null, but better make sure we don't
          // loop forever
          return;
        }

        var children = parent.childNodes;
        var i = children.length;
        while(i--) {
          if (children[i] === node) {
            // That's the index
            elementPath.push(i);
            node = parent;
            break;
          }
        }
      }
    }

    // We need to construct the element path. This is done by going up the
    // tree and recording the index in the parent object. The ultimate parent
    // is the body element
    var elementPath = [];

    // This will fill the elementPath array.
    findPath(node, elementPath);

    // The path is leaf to root, but we need it root to leaf, so reverse it
    elementPath.reverse();

    return exportLocation( { "elementPath" : elementPath, "textOffset" : textOffset, "relativeLocation" : relativeLocation} );
  }

  function getRelative() {
    // getCurrentPage() is always > 0, because of the dummy pages
    // getPageCount() should always be > 0 as well
    // This way, the first non-dummy page would be 0, and the last non-dummy page: 1
    return (getCurrentPage() - 1) / (getPageCount() - 1);
  }

  function getDomLocation() {
    var location = getTextLocation();
    var relativeLocation = getRelative();
    return makeDomLocation(location.node, location.textOffset, relativeLocation);
  }

  function getBookmarkText(node, textOffset) {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
      // It only makes sense for text nodes
      return "";
    }

    function searchBackwards(regex, text, startOffset, including) {
      if (regex.test(text[startOffset])) {
        return startOffset;
      }

      for (var offset = startOffset - 1; offset >= 0; offset--) {
        if (regex.test(text[offset])) {
          // offset + 1 is valid, because we have made at least one iteration
          return including ? offset : offset + 1;
        }
      }

      // Not found
      return 0;
    }

    function searchForwards(regex, text, startOffset, including) {
      if (regex.test(text[startOffset])) {
        return startOffset;
      }

      var length = text.length;
      for (var offset = startOffset + 1; offset < length; offset++) {
        if (regex.test(text[offset])) {
          // offset - 1 is valid, because we have made at least one iteration
          return including ? offset : offset - 1;
        }
      }

      // Not found. String is suppose not be empty
      return length - 1;
    }

    var text = node.data;

    if (text.length === 0) {
      // Nothing to do
      return "";
    }

    // Make sure the offset is valid
    textOffset = Math.clamp(textOffset, 0, text.length - 1);

    // Patterns we'll use
    var spaceRegex  = /\s/;
    var textRegex   = /\S/;

    // Find the left offset
    var leftOffset = textOffset;

    if (spaceRegex.test(text[leftOffset])) {
      // Look right for a word
      leftOffset = searchForwards(textRegex, text, leftOffset, true);
    } else {
      // Look left for the start of the word
      leftOffset = searchBackwards(spaceRegex, text, leftOffset, false);
    }

    // Now the right offset
    var rightOffset = Math.clamp(leftOffset + bookmarkMaxLength - 1, leftOffset, text.length - 1);

    // If we are in the middle (but not at the end) of a word, remove it.
    if (textRegex.test(text[rightOffset]) &&
      rightOffset < text.length - 1 && textRegex.test(text[rightOffset + 1])) {
      // We are in a word that comes a bit too much, so look backwards for
      // whitespace
      rightOffset = searchBackwards(spaceRegex, text, rightOffset, true);
    }

    // Remove any white space in case:
    //  - A word was removed because of the previous if clause
    //  - We were at a whitespace character anyway
    if (spaceRegex.test(text[rightOffset])) {
      rightOffset = searchBackwards(textRegex, text, rightOffset, true);
    }

    // In case something went wrong
    if (rightOffset < leftOffset) {
      return "";
    }

    // Keep in mind that string.substring(x, y) won't take the character
    // at string[y] so we need to use y + 1 for the right limit
    return text.substring(leftOffset, rightOffset + 1);
  }

  function getBookmark() {
    var location = getTextLocation();
    var relativeLocation = getRelative();
    return {
      "location"  : makeDomLocation(location.node, location.textOffset, relativeLocation),
      "text"      : getBookmarkText(location.node, location.textOffset)
    };
  }

  function goToDomLocation(location) {
    goToPage(getPageForLocation(location));
  }

  function goToLocation(location) {
    var showStatusBar = false;

    // Find what type of location it is by
    // asking the duck to squawk
    if (typeof location.firstPage !== 'undefined')
    {
      goToFirstPage();
    } else if (typeof location.lastPage !== 'undefined') {
      goToLastPage();
    } else if (typeof location.page !== 'undefined') {
      showStatusBar = true;
      goToPage(location.page);
    } else if (typeof location.elementId !== 'undefined') {
      showStatusBar = true;
      goToElementById(location.elementId);
    } else if ((typeof location.elementPath !== 'undefined') && (typeof location.textOffset !== 'undefined')) {
      showStatusBar = true;
      goToDomLocation(location);
    } else if (typeof location.relativeLocation !== 'undefined') {
      // test for relative location last, as all other locations would have it
      showStatusBar = true;
      goToRelative(location.relativeLocation);
    } else {
      context.debug.log("Unknown location type");
    }

    return showStatusBar;
  }

  function IETextIterator(text, range) {
    var stopped = false;

    function next() {
      if (stopped) {
        return null;
      }

      var found = range.findText(text);
      if (found) {
        var page = getPageForPoint(scroller.getPosition() + range.boundingLeft);

        // Prepare for next search
        if (range.moveStart('character', 1) !== 1) {
          // Something's wrong, perhaps we're wrapping. Better stop now, but
          // we still have to return what we found.
          stopped = true;
        }

        // Return object with the page number (and perhaps other info
        // in the future).
        return { "page" : page };
      }

      stopped = true;
      return null;
    }

    this.next = next;
  }

  function findText(text) {
    var doc = context.contentWindow.document;

    if (doc.body.createTextRange) {
      // IE only
      var range = doc.body.createTextRange();
      return text ? new IETextIterator(text, range) : null;
    }

    // TODO: Use window.find() on Chrome & Safari.
    // Check: http://help.dottoro.com/ljkjvqqo.php
    return null;
  }

  // Useful function to save the results into an array
  function findPagesForText(text) {
    var it = findText(text);
    var pages = [];

    if (it) {
      for (var current = it.next(); current; current = it.next()) {
        var page = current.page;
        if (pages.indexOf(page) === -1) {
          pages.push(page);
        }
      }
    }
    return pages;
  }

  function goToElementById(id) {
    var doc  = context.contentWindow.document;
    var node = doc.getElementById(id);

    if (node) {
      var range = doc.createRange();
      range.selectNodeContents(node);
      var box = range.getBoundingClientRect();
      goToPage(getPageForPoint(scroller.getPosition() + box.left));
      return true;
    }

    return false;
  }

  function goToRelative(ratio) {
    // Check getRelative() for more info on the computation
    var page = (ratio * (getPageCount() - 1)) + 1

    // Even if the ratio is not in [0, 1], goToPage()
    // calls validate() and would eventually clamp it.
    goToPage(page);
  }

  function goToPageInternal(page) {
    // Scroll the pages
    scroller.scrollTo(page * pageWidth);

    // Update the current page number
    current = page;
  }

  function goToPage(page) {
    page = validate(page);

    // this is the wrapper
    goToPageInternal(page);
  }

  // Don't forget to set up
  setUp();

  // Go to the first page as an initial state
  goToPageInternal(1);

  // Public API
  this.isFirstPage      = function() { return isFirstPage(current); };
  this.isLastPage       = function() { return isLastPage(current); };
  this.getPageCount     = getPageCount;
  this.getCurrentPage   = getCurrentPage;
  this.goToFirstPage    = goToFirstPage;
  this.goToLastPage     = goToLastPage;
  this.goToPreviousPage = goToPreviousPage;
  this.goToNextPage     = goToNextPage;
  this.getDomLocation   = getDomLocation;  // Retrieves the current DOM location
  this.goToDomLocation  = goToDomLocation;
  this.goToPage         = goToPage;
  this.goToElementById  = goToElementById;
  this.goToLocation     = goToLocation;
  this.getRelative      = getRelative;
  this.goToRelative     = goToRelative;
  this.findText         = findText;
  this.findPagesForText = findPagesForText;
  this.getBookmark      = getBookmark;
};

Albite.Animation = function(context) {

  this.duration           = 0; // in ms
  this.speedRatio         = 1;
  this.from               = 1;
  this.to                 = 1;

  this.easingFunction     = null;
  this.animatingFunction  = null;
  this.finishedFunction   = null;

  var timer               = null;
  var renderCached        = null;

  // Debug: fps counter
  var fpsCounter = new Albite.FPSCounter();

  function isRunning() {
    return timer !== null;
  }

  function start() {
    stop(false);

    // actual duration
    var duration = this.duration / this.speedRatio;

    // cache the values in this closure
    var from                = this.from;
    var to                  = this.to;
    var easingFunction      = this.easingFunction;
    var animatingFunction   = this.animatingFunction;
    var finishedFunction    = this.finishedFunction;

    var distance  = to - from;
    var startTime = Date.now();

    if (context.debugEnabled) {
      fpsCounter.reset();
    }

    function render(time, fill) {
      // Will not use the passed time stamp as it is somewhat different
      // Date.now() and therefore elapsed may get to be negative
      var now = Date.now();
      var elapsed = now - startTime;
      var normalisedTime = elapsed / duration;
      var finished = false;

      if (context.debugEnabled) {
        fpsCounter.tick();
      }

      if (easingFunction) {
        normalisedTime = easingFunction(normalisedTime);
      }

      if (normalisedTime >= 1 || fill) {
        normalisedTime = 1;
        finished = true;
      }

      var value = from + normalisedTime * distance;
      animatingFunction(value);

      if (finished) {
        stop(false);

        if (context.debugEnabled) {
          context.debug.log("Animation average FPS: " + fpsCounter.getAverageFps());
        }

        if (finishedFunction) {
          finishedFunction();
        }
      } else {
        // Re-schedule
        timer = requestAnimationFrame(render);
      }
    }

    // Cache the render function so that it could be called from stop()
    renderCached = render;

    timer = requestAnimationFrame(render);
  }

  function stop(fill) {
    if (timer !== null) {
      cancelAnimationFrame(timer);
      timer = null;

      if (fill && renderCached) {
        // renderCached should *obviously* not be null, but still we don't
        // want to take any chances. first argument to render() is dummy
        renderCached(0, true);
      }
      renderCached = null;
    }
  }

  // Animation API
  this.isRunning  = isRunning;
  this.start      = start;
  this.stop       = stop;
};

Albite.GestureHandler = function(targetElement) {

  function GestureAPI(handler) {
    var origin      = {"x" : 0, "y" : 0};
    var timestamp   = 0;
    var canHold     = false;
    var isInertial  = false;
    var gesture     = new MSGesture();

    gesture.target = targetElement;

    targetElement.addEventListener(
      "MSPointerDown",
      function(evt) {
        timestamp = Date.now();
        canHold = true;
        gesture.addPointer(evt.pointerId);
      },
      false
    );

    targetElement.addEventListener(
      "MSGestureStart",
      function(evt) {
        var x = evt.clientX;
        var y = evt.clientY;

        origin.x = x;
        origin.y = y;

        if (handler.onStart) {
          handler.onStart(x, y);
        }
      },
      false
    );

    targetElement.addEventListener(
      "MSGestureChange",
      function(evt) {
        if (!isInertial && handler.onChange) {
          handler.onChange(evt.translationX, evt.translationY);
        }
      },
      false
    );

    targetElement.addEventListener(
      "MSGestureEnd",
      function(evt) {
        if (!isInertial && handler.onEnd) {
          var dx = origin.x - evt.clientX;
          var dy = origin.y - evt.clientY;
          handler.onEnd(dx, dy, 0, 0);
        }

        isInertial = false;
      },
      false
    );

    targetElement.addEventListener(
      "MSInertiaStart",
      function(evt) {
        isInertial = true;

        if (handler.onEnd) {
          var dx = origin.x - evt.clientX;
          var dy = origin.y - evt.clientY;
          handler.onEnd(dx, dy, evt.velocityX, evt.velocityY);
        }
      },
      false
    );

    targetElement.addEventListener(
      "MSGestureTap",
      function(evt) {
        // Tap is reported for one finger only so the timestamp would
        // certainly be correct.
        var elapsed = Date.now() - timestamp;
        if (handler.onTap) {
          handler.onTap(evt.clientX, evt.clientY, elapsed);
        }
      },
      false
    );

    targetElement.addEventListener(
      "MSGestureHold",
      function(evt) {

        if (canHold) {
          canHold = false;

          if (handler.onHold) {
            handler.onHold(evt.clientX, evt.clientY);
          }
        }
      },
      false
    );
  }

  function LegacyAPI(handler) {
    var origin          = {"x" : 0, "y" : 0};
    var lastMove        = {"x" : 0, "y" : 0};
    var timestamp       = 0;
    var onHoldTreshold  = 1000;
    var down            = false;
    var moved           = false;

    targetElement.addEventListener(
      "mousedown",
      function(evt) {
        var x = evt.clientX;
        var y = evt.clientY;

        origin.x = x;
        origin.y = y;

        lastMove.x = x;
        lastMove.y = y;

        timestamp = Date.now();

        down = true;
        moved = false;

        if (handler.onStart) {
          handler.onStart(x, y);
        }
      },
      false
    );

    targetElement.addEventListener(
      "mousemove",
      function(evt) {
        if (down) {
          moved = true;

          if (handler.onChange) {
            var dx = lastMove.x - evt.clientX;
            var dy = lastMove.y - evt.clientY;

            lastMove.x = evt.clientX;
            lastMove.y = evt.clientY;

            handler.onChange(-dx, -dy);
          }
        }
      },
      false
    );

    targetElement.addEventListener(
      "mouseup",
      function(evt) {
        var dx, dy, elapsed;

        if (moved) {
          if (handler.onEnd) {
            dx = origin.x - evt.clientX;
            dy = origin.y - evt.clientY;
            handler.onEnd(dx, dy, 1, 1);
          }
        } else {
          elapsed = Date.now() - timestamp;
          if (elapsed > onHoldTreshold) {
            if (handler.onHold) {
              handler.onHold(evt.clientX, evt.clientY);
            }
          } else {
            if (handler.onTap) {
              handler.onTap(evt.clientX, evt.clientY, elapsed);
            }
          }
        }

        down = false;
        moved = false;
      },
      false
    );
  }

  // Add gesture support for IE10 on Windows 8 and WP8
  var api;

  if (typeof MSGesture !== "undefined") {
    api = new GestureAPI(this);
  } else {
    api = new LegacyAPI(this);
  }

  this.onStart        = null;
  this.onChange       = null;
  this.onEnd          = null;
  this.onTap          = null;
  this.onHold         = null;
};

Albite.PresentationController = function(context) {

  var mainDocument    = context.mainWindow.document;
  var contentDocument = context.contentWindow.document;
  var pageWidth       = context.width;
  var scroller        = context.scroller;
  var pager           = context.pager;

  var animation = new Albite.Animation(context);
  var scrollingPageType;

  // If the total delta is within these bounds
  // the scroll will be back to the current page
  var noScrollInterval = pageWidth * context.noScrollIntervalRatio;

  // Velocity under this amount will not be
  // considered important even if it's in
  // the opposite direction of the drag
  var negligibleVelocity = pageWidth * context.negligibleVelocityRatio;

  var samePageVelocityRatio = context.samePageVelocityRatio;

  var pageTapWidth = pageWidth * context.pageTapRatio;

  var PageType = { "previous" : 0 , "current" : 1, "next" : 2 };

  function scrollPageDelta(dx) {
    // As we are scrolling the window rather than moving the content
    // we are actually doing it in the opposite direction
    scroller.scrollBy(-dx);
  }

  function scrollPageStart(xDelta, xVelocity) {
    // Scroll back to the current page if:
    //   1. The drag was too insignificant, most probably a mistake
    //   2. There's a considerable amount of velocity and it's in the direction
    //      opposite of the drag
    if (Math.abs(xDelta) <= noScrollInterval || (Math.abs(xVelocity) > negligibleVelocity && Math.sign(xVelocity) !== Math.sign(xDelta)))
    {
      scrollToPage(PageType.current, samePageVelocityRatio);
      return;
    }

    // If xDelta is negative, then the user is dragging left
    // and therefore wants to go to the next page
    var pageType = xDelta > 0 ? PageType.next : PageType.previous;

    // The duration of the animation should reflect the current position
    var ratio = Math.abs(pageWidth + Math.abs(xDelta)) / pageWidth;

    // Take into account the velocity of the flick
    var velocityRatio = Math.abs(xVelocity);

    // Clamp the velocity into some sane limits. It definitely shouldn't
    // go under 1.0, i.e. shouldn't be able to slow down the animation
    // only speed it up.
    velocityRatio = Math.clamp(velocityRatio, 1.0, 3.0);

    // Ready to scroll
    scrollToPage(pageType, ratio * velocityRatio);
  }

  function scrollToPage(pageType, speedRatio) {
    var page = pager.getCurrentPage();

    switch (pageType)
    {
      case PageType.previous:
        page -= 1;
        break;

      case PageType.current:
        // Nothing to adjust
        break;

      case PageType.next:
        page += 1;
        break;

      default:
        throw("Bad page type");
    }

    scrollingPageType = pageType;

    animation.from          = scroller.getPosition();
    animation.to            = page * pageWidth;
    animation.speedRatio    = speedRatio;
    animation.start();
  }

  // Set up the animation
  animation.duration = context.animationDuration;

  animation.easingFunction = function(x) {
    // Ease In:    f(t)
    // Ease Out:   1 - f(1 - t)
    // Power Ease: f(t) = t ^ a
    return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 6);
  };

  animation.animatingFunction = function(x) {
    scroller.scrollTo(x);
  };

  animation.finishedFunction = function() {
    switch (scrollingPageType) {
      case PageType.current:
        break;

      case PageType.previous:
        if (pager.isFirstPage())
        {
          if (!context.isFirstChapter)
          {
              // Notify the host
              context.host.goToPreviousChapter();
              break;
          }
          else
          {
            // That's the first chapter.
            context.notifications.showNotification("start of book");
            scrollToPage(PageType.current, samePageVelocityRatio);
            break;
          }
        }

        pager.goToPreviousPage();
        break;

      case PageType.next:
        if (pager.isLastPage())
        {
          if (!context.isLastChapter)
          {
              // Notify the host
              context.host.goToNextChapter();
              break;
          }
          else
          {
            // That's the last chapter.
            context.notifications.showNotification("end of book");
            scrollToPage(PageType.current, samePageVelocityRatio);
            break;
          }
        }

        pager.goToNextPage();
        break;

      default:
        throw("Bad page type");
    }
  };

  var gestureHandler = new Albite.GestureHandler(contentDocument.documentElement);

  gestureHandler.onChange = function(dx, dy) {
    if (animation.isRunning()) {
      animation.stop(true);
    }

    scrollPageDelta(dx);
  };

  gestureHandler.onEnd = function(dx, dy, velocityX, velocityY) {
    if (animation.isRunning()) {
      return;
    }

    scrollPageStart(dx, velocityX);
  };

  function getAnchor(element) {
    while (element) {
      if (element.tagName && element.tagName.toLowerCase() === 'a' && element.href) {
        // True if it is a <a> element with a non-empty href string
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  gestureHandler.onTap = function(x, y, elapsed) {
    // get the tapped element first, so that animation filling wouldn't
    // have an effect on the chosen element
    var tappedElement = contentDocument.elementFromPoint(x, y);

    if (animation.isRunning()) {
      // stop and fill the animation so that one can rapidly change the pages
      animation.stop(true);
    }

    var anchor = getAnchor(tappedElement);
    if (anchor) {
      // Don't scroll when tapping on anchors and notify the host
      context.host.navigate(anchor.href, anchor.text);
      return;
    }

    // Short taps scroll faster, while longer ones scroll slower.
    // Feels quite natural.
    //
    // Tap speed is 0.5 for elapsed >= 1000, 2.0 for elapsed <= 0 and linear
    // in between, i.e.: f(x) = a * x + b, satisfying
    //
    // f(0)    = 2.0
    // f(1000) = 0.5
    var tapSpeed = Math.clamp(-0.0015 * elapsed + 2, 0.5, 2.0);

    if (x <= pageTapWidth) {
      scrollToPage(PageType.previous, tapSpeed);
    } else if (pageWidth - pageTapWidth <= x) {
      scrollToPage(PageType.next, tapSpeed);
    } else {
      /* Not used for now
      // Notify the host
      context.host.toggleFullscreen();
      */
    }
  };

  function getImage(element) {
    while (element) {
      if (element.tagName && element.tagName.toLowerCase() === 'img' && element.href) {
        // True if it is an <img> element with a non-empty href string
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  gestureHandler.onHold = function(x, y) {
    /* Not used for now
    if (animation.isRunning()) {
      return;
    }

    var tappedElement = contentDocument.elementFromPoint(x, y);
    var image   = getImage(tappedElement);
    var anchor  = getAnchor(tappedElement);
    var options = {};

    // The host needs to know the coords so that they'll know where to
    // show the menu.
    options["position_x"] = x;
    options["position_y"] = y;

    // Add extra info
    options["image"]  = image   ? image.href : null;
    options["anchor"] = anchor  ? anchor.href  : null;

    // Notify the host
    context.host.contextMenu(options);
    */
  };

  function processKey(evt) {
    if (animation.isRunning()) {
      // stop and fill the animation so that one can rapidly change the pages
      animation.stop(true);
    }

    var key = "unknown";
    if (evt.key) {
      key = evt.key;
    } else if (evt.keyIdentifier) {
      key = evt.keyIdentifier;
    }

    if (key === "Left") {
      scrollToPage(PageType.previous, 2);
    } else if (key === "Right") {
      scrollToPage(PageType.next, 2);
    }
  }

  mainDocument.addEventListener("keyup", processKey, false);
  contentDocument.addEventListener("keyup", processKey, false);
};

Albite.HostAdapter = function(mainWindow) {

  function send(message) {
    window.external.notify(message);
  }

  // Public API

  // Send a string message to the host
  this.send = send;
};

Albite.Host = function(context) {
  var hostAdapter = new Albite.HostAdapter(context.mainWindow);

  var typeField       = context.typeField;
  var typeNamespace   = context.typeNamespace;

  var Message = function(type) {
    // Note that on IE after serialisation, i.e. after calling JSON.stringify
    // the properties are serialised in the order they had been defined
    // Thefore the type property would be the first property in the
    // serialised output. This is especially important when working with
    // WCF as they required it this way:
    //   Type Hint Position in JSON Objects
    //     Note that the type hint must appear first in the JSON representation.
    //     This is the only case where order of key/value pairs is important in
    //     JSON processing. For example, the following is not a valid way to
    //     specify the type hint.
    // Source: http://msdn.microsoft.com/en-us/library/bb412170.aspx
    this[typeField] = type + typeNamespace;

    var me = this;

    function send() {
      hostAdapter.send(serialize());
    }

    function serialize() {
      return JSON.stringify(me);
    }

    this.send       = send;
    this.serialize  = serialize;
  };

  // Messages from client
  var ClientMessages = {
    "log"                 : "client_log",
    "loaded"              : "client_loaded",
    "loading"             : "client_loading",
    "goToPreviousChapter" : "client_goToPreviousChapter",
    "goToNextChapter"     : "client_goToNextChapter",
    "navigate"            : "client_navigate",
    "toggleFullscreen"    : "client_toggleFullscreen",
    "contextMenu"         : "client_contextMenu"
  };

  function log(msg) {
    var message = new Message(ClientMessages.log);
    message.message = msg;
    message.send();
  }

  function notifyLoaded() {
    var message = new Message(ClientMessages.loaded);
    message.page = context.pager.getCurrentPage();
    message.pageCount = context.pager.getPageCount();
    message.send();
  }

  function goToPreviousChapter() {
    var message = new Message(ClientMessages.goToPreviousChapter);
    message.send();
  }

  function goToNextChapter() {
    var message = new Message(ClientMessages.goToNextChapter);
    message.send();
  }

  function navigate(url, title) {
    var message = new Message(ClientMessages.navigate);
    message.url = url;
    message.title = title;
    message.send();
  }

  function toggleFullscreen() {
    var message = new Message(ClientMessages.toggleFullscreen);
    message.send();
  }

  function contextMenu(options) {
    var message = new Message(ClientMessages.contextMenu);
    message.options = options;
    message.send();
  }

  // Error reporting to host
  function makeErrorMessage(exception) {
    var message = new Message("error");
    message.name = exception.name ? exception.name : "";
    message.message = exception.message ? exception.message : "";
    message.stack = exception.stack ? exception.stack : "";
    return message;
  }

  function reportError(exception) {
    var message = makeErrorMessage(exception);
    message.send();
  }

  // Messages from host
  var HostMessages = {
    "getPageCount"        : "getPageCount",
    "getPage"             : "getPage",
    "goToPage"            : "goToPage",
    "goToLocation"        : "goToLocation",
    "getDomLocation"      : "getDomLocation",
    "findText"            : "findText",
    "showStatusBar"       : "showStatusBar",
    "hideStatusBar"       : "hideStatusBar",
    "getBookmark"         : "getBookmark"
  };

  function receive(message) {
    var returnMessage;

    try {
      // deserialize
      message = JSON.parse(message);

      // normalise the type
      var type  = message[typeField];
      var end   = type.length - typeNamespace.length;

      if (end <= 0 || end > type.length) {
        throw new Error(0, "Invalid type: " + type);
      }

      type = type.substr(0, end);

      returnMessage = new Message("result_" + type);

      switch(type) {
        case HostMessages.getPageCount:
          returnMessage.pageCount = context.pager.getPageCount();
          break;

        case HostMessages.getPage:
          returnMessage.page = context.pager.getCurrentPage();
          break;

        case HostMessages.goToPage:
          context.pager.goToPage(message.page);
          break;

        case HostMessages.goToLocation:
          context.pager.goToLocation(message.location);
          break;

        case HostMessages.getDomLocation:
          returnMessage.location = context.pager.getDomLocation();
          break;

        case HostMessages.findText:
          returnMessage.pages = context.pager.findPagesForText(message.text);
          break;

        case HostMessages.showStatusBar:
          context.notifications.showPageNumbers(0);
          break;

        case HostMessages.hideStatusBar:
          context.notifications.hideNotifications();
          break;

        case HostMessages.getBookmark:
          returnMessage.bookmark = context.pager.getBookmark();
          break;

        default:
          throw new Error(0, "Host sent message with unknown type: " + message.type);
      }
    } catch (exception) {
      returnMessage = makeErrorMessage(exception);
    }

    return returnMessage.serialize();
  }

  // Public API

  // Send to Host
  this.log                  = log;
  this.notifyLoaded         = notifyLoaded;
  this.goToPreviousChapter  = goToPreviousChapter;
  this.goToNextChapter      = goToNextChapter;
  this.navigate             = navigate;
  this.toggleFullscreen     = toggleFullscreen;
  this.contextMenu          = contextMenu;

  // Receive from Host
  this.receive  = receive;

  // Errors
  this.reportError = reportError;
};

Albite.Main = function(options) {

  var context;

  var requiredOptions = [ "mainWindow", "width", "height", "cssLocation", "contentLocation" ];

  var defaultOptions = {
    "initialLocation" : "",
    "isFirstChapter"  : true,
    "isLastChapter"   : true,
    "debugEnabled"    : false,

    // Bookmark maximum text length
    "bookmarkMaxLength"       : 100,

    // scrolling and animation
    "noScrollIntervalRatio"   : 0.030,
    "negligibleVelocityRatio" : 0.075,
    "samePageVelocityRatio"   : 1.5,
    "pageTapRatio"            : 0.3,
    "animationDuration"       : 800,

    // messaging
    "typeField"       : "__type",
    "typeNamespace"   : ""
  };

  Albite.Helpers.validateOptions(options, requiredOptions);
  Albite.Helpers.setDefaultOptions(options, defaultOptions);

  // We want to add new properties and we want them private
  context = Albite.Helpers.shallowCopy(options);

  // Set up the host early on so that one could send
  // error reports
  context.host = new Albite.Host(context);

  // Set up debug
  context.debug = new Albite.Debug(context);

  // Set up loading state
  context.loaded = false;

  function contentLoaded(contentFrame) {
    try {
      // Add the contentFrame from the start
      context.contentWindow = contentFrame.contentWindow;

      // Cache content document
      var doc = context.contentWindow.document;

      // Fix SVGs
      fixSVGs(doc);

      // Fix SVG images with absolute urls
      fixImages(doc, context.contentLocation);

      // Fix imgs with absolute urls
      fixImgs(doc, context.contentLocation);

      // Add a div around the content in order to fix the problem
      // with the margins
      var rootElement = Albite.Helpers.createElement('div', doc);
      rootElement.id = 'albite_root';

      // Add a div at the start and one at the end
      // which have break-before/after CSS styling
      // in order to add the first/last dummy pages
      var startPage = Albite.Helpers.createElement('div', doc);
      startPage.id = 'albite_start';

      var endPage = Albite.Helpers.createElement('div', doc);
      endPage.id = 'albite_end';

      // Add the separator for the first dummy page
      rootElement.appendChild(startPage);

      // Append all the current children
      while (doc.body.firstChild) {
        rootElement.appendChild(doc.body.firstChild);
      }

      // Add the last dummy page
      rootElement.appendChild(endPage);

      // Now add back the element to the body
      doc.body.appendChild(rootElement);

      // Finally load the CSS that will apply the rules
      // for pagination
      Albite.Helpers.loadCssFile(
        options.cssLocation,
        context.contentWindow.document,
        cssLoaded
      );
    } catch (exception) {
      context.host.reportError(exception);
    }
  }

  function getElement(id) {
    return options.mainWindow.document.getElementById(id);
  }

  function fixSVGs(doc) {
    var svgs = doc.getElementsByTagName('svg');

    for (var i = 0; i < svgs.length; i++) {
      svgs[i].setAttribute("preserveAspectRatio", "xMidyMid meet");
    }
  }

  function fixImages(doc, contentLocation) {
    // Fix all svg images
    var images = doc.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'image');
    fixUrls(images, 'http://www.w3.org/1999/xlink', 'href', contentLocation);
  }

  function fixImgs(doc, contentLocation) {
    var ns = doc.documentElement.namespaceURI;
    var imgs = doc.getElementsByTagNameNS(ns, 'img');
    fixUrls(imgs, null, 'src', contentLocation);
  }

  // Fix absolute urls
  function fixUrls(items, attrNS, attr, contentLocation) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      // Getting the url this way would result in a relative one,
      // i.e. path only - both for img and svg image.
      var url = item.getAttributeNS(attrNS, attr);

      // If it starts with a '/' or '\', then it's an absolute path
      // Add the content location to the start of the url
      // and do *not* forget to add a '/' as contentLocation might not
      // be an absolute path, and we now need an absolute path
      if ((url != null) && (url.length > 0) && (url[0] == '/' || url[0] == '\\')) {
        item.setAttributeNS(attrNS, attr, '/' + contentLocation + url);
      }
    }
  }

  function setUpAnchors(doc) {
    function anchorClicked(evt) {
      // Prevent the anchor from navigating us away
      evt.preventDefault();

      // The host would be notified by the function handling the tap
    }

    var anchors = doc.getElementsByTagName('a');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener("click", anchorClicked, true);
    }
  }

  function cssLoaded() {
    // On some occasions, the CSS is not applied atomically, i.e.
    // some columns are created, but not all of them at the same time,
    // the effect being Albite.Pager reporting a lesser number of pages.
    // There doesn't seem to be any certain way to fix this.

    // Current solution checks if there's only one page. At a minimum
    // there should be 2 pages because of the left/right separators
    // we've just added and their style forcing new pages

    // Note: This is not a fool-proof method because columnization
    // may be done on *more than one step*, i.e. the following check
    // might succeed *without* columnization beeing fully completed.

    // It tries to read the scrollWidth which should cause a reflow
    // and wait for the most recent value. As columninzation can
    // happend on multiple successions (i.e. trigger multiple reflows)
    // this is not a winner, but at least makes certain that the initial
    // reflow was triggered.
    var bodyWidth = context.contentWindow.document.body.scrollWidth;
    if (bodyWidth > context.width) {
      // Finally, scheduling for some milliseconds will make it even less
      // likely that the columnization is not complete, because of the
      // fixed wait interval (rather than waiting for the next paint).
      setTimeout(function() { waitFrames(10, cssApplied); }, 250);
    } else {
      // Scheduling for the next paint makes it more likely that
      // the reflow would've finished
      requestAnimationFrame(cssLoaded);
    }
  }

  function cssApplied() {
    try {
      var pageElement = getElement("page");

      // Set up the notifications element
      context.notifications = new Albite.Notifications(context);

      // Set up the scroller
      context.scroller = new Albite.WindowScroller(context.contentWindow);

      // Set up page handler
      context.pager = new Albite.Pager(context);

      // Go to the page location specified by the host
      var shouldShowStatusBar = context.pager.goToLocation(context.initialLocation);

      // Set up the presentation controller
      context.controller = new Albite.PresentationController(context);

      // Set up the anchors of the content document: They should not be
      // clickable and rather report to the navigation to the host
      setUpAnchors(context.contentWindow.document);

      // Unhide the content
      pageElement.show();

      // Wait some frames, to make sure it has rendered it all
      waitFrames(10, function() {
        // Fade in the content
        pageElement.className = "opacity_visible_transition";

        // We are done
        context.loaded = true;

        if (shouldShowStatusBar) {
          // Display page numbers
          context.notifications.showPageNumbers();
        }

        // Notify the host we are done
        context.host.notifyLoaded();
      });
    } catch (exception) {
      context.host.reportError(exception);
    }
  }

  function waitFrames(frameCount, callback) {
    var loadingFramesLeft = frameCount;

    function waiter() {
      if (loadingFramesLeft > 0) {
        loadingFramesLeft -= 1;
        requestAnimationFrame(waiter);
      } else {
        if (callback) {
          callback();
        }
      }
    }

    waiter();
  }

  function notify(message) {
    return context.host.receive(message);
  }

  // Public API

  // Called when an iframe has loaded
  this.contentLoaded  = contentLoaded;
  this.notify         = notify;
};
