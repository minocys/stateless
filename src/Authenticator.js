import { generateXSRF } from './xsrfHelpers';
import { comparePass, hashPass } from './passwordHelpers';
import shortid from 'shortid';

export default function Authenticator({ generateJWT }, createUser, fetchUser, updateUser, useXsrf = true) {
  return {
    authenticate(email, password) {
      return new Promise((resolve, reject) => {
        fetchUser({ email })
          .then(user => {
            comparePass(password, user)
              .then(() => {
                const userObject = Object.assign({}, user);
                // Delete user password before storing in JWT
                delete userObject.password;

                resolve(userObject);
              })
              .catch(error => {
                reject(error || 'Password Incorrect');
              });
          })
          .catch(error => {
            reject(error);
          })
      })
    },

    register(newUser) {
      return new Promise((resolve, reject) => {
        hashPass(newUser.password)
          .then(hash => {
            newUser.password = hash;
            createUser(newUser)
              .then(user => {
                const userObject = Object.assign({}, user);
                delete userObject.password;
                resolve(userObject);
              })
              .catch(error => {
                reject(error);
              });
          })
          .catch(error => {
            reject(error);
          });
      })
    },

    changePassword(id, password, newPassword) {
      return new Promise((resolve, reject) => {
        fetchUser({ id })
          .then(user => {
            comparePass(password, user)
              .then(() => {
                // Hash new password
                hashPass(newPassword)
                  .then(hash => {
                    const userObject = {
                      query: {
                        id
                      },
                      fieldsToUpdate: {
                        password: hash
                      }
                    };

                    updateUser(userObject)
                      .then(user => {
                        const result = Object.assign({}, user);
                        delete result.password;
                        resolve(result);
                      })
                      .catch(error => reject(error));
                  })
                  .catch(error => reject(error));
              })
              .catch(error => reject(error || 'Password Incorrect'));
          })
          .catch(error => reject(error));
      });
    }
  },

  resetPassword({ email }) {
    return new Promise((resolve, reject) => {
      fetchUser({ email })
        .then(user => {
          const tempPassword = shortid.generate();
          hashPass(tempPassword)
            .then(() => {
              updateUser(id, { password: tempPassword })
                .then(() => {
                  resolve({ tempPassword });
                })
                .catch(error => reject(error))
            })
            .catch(error => reject(error))
        })
        .catch(error => reject(error))
    })
  }
}
