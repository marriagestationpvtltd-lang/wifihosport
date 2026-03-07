/**
 * Post-Connection Redirect Handler
 * Provides a simple delayed-redirect utility used after a successful WiFi auth.
 */
const RedirectObj = {
  _timer: null,

  /**
   * Navigate to `url` after `delay` milliseconds.
   * @param {string} url   - Destination URL
   * @param {number} delay - Delay in ms (default 2000)
   */
  delayedRedirect: function (url, delay) {
    if (!url) return;
    const self = this;
    this.cancel();
    this._timer = setTimeout(function () {
      self.goto(url);
    }, delay !== undefined ? delay : 2000);
  },

  /** Navigate immediately to `url`. */
  goto: function (url) {
    if (url) {
      location.href = url;
    }
  },

  /** Cancel a pending delayed redirect. */
  cancel: function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  },
};
