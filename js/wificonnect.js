/**
 * WiFi One-Click Connection Handler
 *
 * Wraps the existing IndexObj "pass" login flow to provide:
 *   - Loading state while the auth request is in flight
 *   - Success state with an auto-redirect to the configured post_url
 *   - Error state with a user-friendly message
 */
const WiFiConnectObj = {
  postUrl: '',
  /** Milliseconds to display the success state before redirecting. */
  REDIRECT_DELAY: 2000,

  init: function (data) {
    this.postUrl = data && data.post_url ? data.post_url : '';
    this._wrapLoginFlow();
  },

  /**
   * Intercept IndexObj.onLogin so that the "pass" (one-click) path goes
   * through our enhanced flow.  All other login types are handled by the
   * original function.
   */
  _wrapLoginFlow: function () {
    const self = this;
    const _orig = IndexObj.onLogin.bind(IndexObj);
    IndexObj.onLogin = function () {
      if (IndexObj.currentOption !== IndexObj.LOGIN_OPTION.PASS) {
        return _orig();
      }
      self._doConnect();
    };
  },

  /** Send the auth request and drive state transitions. */
  _doConnect: function () {
    const self = this;
    this._setState('connecting');

    var paramObj = {
      lang: I18nObj.currentLang,
      authType: IndexObj.LOGIN_OPTION.PASS,
      sessionId: IndexObj._getParamVal('sessionId'),
    };

    $.post({
      url: '/api/auth/general',
      data: JSON.stringify(paramObj),
      contentType: 'application/json',
      success: function (response) {
        if (response && response.success) {
          self._setState('success');
          // Redirect to the review / post-connection URL after a short pause
          RedirectObj.delayedRedirect(self.postUrl, self.REDIRECT_DELAY);
        } else {
          self._setState('error', response && response.message ? response.message : '');
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('WiFi connect error:', textStatus, errorThrown);
        self._setState('error', '');
      },
    });
  },

  /**
   * Update the UI to reflect the current connection state.
   * @param {'connecting'|'success'|'error'} state
   * @param {string} [msg] - Optional override message for the error state
   */
  _setState: function (state, msg) {
    var statusEl = $('#wifi_connect_status');
    var loginBtn = $('#login_btn');

    // Reset classes on the status container
    statusEl.removeClass('status-connecting status-success status-error');

    switch (state) {
      case 'connecting':
        loginBtn.prop('disabled', true);
        statusEl.removeClass('hide').addClass('status-connecting');
        statusEl.find('.status-text').text(
          I18nObj.$t('connecting') || 'Connecting to WiFi\u2026'
        );
        $('#login_msg').text('');
        break;

      case 'success':
        loginBtn.prop('disabled', false);
        statusEl.removeClass('hide').addClass('status-success');
        statusEl.find('.status-text').text(
          I18nObj.$t('connected') || 'Connected! Opening review page\u2026'
        );
        break;

      case 'error':
        loginBtn.prop('disabled', false);
        statusEl.addClass('hide');
        $('#login_msg').text(
          msg || I18nObj.$t('connection_failed') || 'Connection failed. Please try again.'
        );
        break;
    }
  },
};
