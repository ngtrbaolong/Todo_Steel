/**
 * @typedef {import("./user").User} User
 */

/**
 * @typedef {Object} AuthState
 * @property {string|null} accessToken
 * @property {User|null} user
 * @property {boolean} loading
 *
 * @property {(accessToken: string) => void} setAccessToken
 * @property {() => void} clearState
 * @property {(username: string, password: string, email: string, firstName: string, lastName: string) => Promise<void>} signUp
 * @property {(username: string, password: string) => Promise<void>} signIn
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<void>} fetchMe
 * @property {() => Promise<void>} refresh
 */
