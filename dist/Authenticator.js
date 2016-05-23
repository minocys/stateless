'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _JwtHelpers = require('./JwtHelpers');

var _JwtHelpers2 = _interopRequireDefault(_JwtHelpers);

var _xsrfHelpers = require('./xsrfHelpers');

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _MakeCheckAuth = require('./MakeCheckAuth');

var _MakeCheckAuth2 = _interopRequireDefault(_MakeCheckAuth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Authenticator {
  constructor({ secret, authRules = [] }) {
    this.jwtHelpers = new _JwtHelpers2.default(secret);
    this.authRules = authRules;

    this.patchCheckAuth();
  }

  logIn(user, password) {
    return new Promise((resolve, reject) => {
      _bcryptNodejs2.default.compare(password, user.password, (error, isAuth) => {
        if (isAuth) {
          // Delete user password before storing in JWT
          delete user.password;

          // Generate XSRF and JWT Auth tokens
          const XSRF = (0, _xsrfHelpers.generateXSRF)();
          const JWT = this.jwtHelpers.generateJWT(user, XSRF.secret);

          resolve({
            JWT,
            XSRF: XSRF.token
          });
        } else {
          reject(error || 'Password Incorrect');
        }
      });
    });
  }

  encryptPass(newUser) {
    return new Promise((resolve, reject) => {
      _bcryptNodejs2.default.hash(newUser.password, null, null, (error, hash) => {
        if (error) {
          return reject(error);
        } else {
          newUser.password = hash;
          return resolve(newUser);
        }
      });
    });
  }

  patchCheckAuth() {
    _http2.default.IncomingMessage.prototype.checkAuth = (0, _MakeCheckAuth2.default)(this.jwtHelpers, this.authRules);
  }
}
exports.default = Authenticator;