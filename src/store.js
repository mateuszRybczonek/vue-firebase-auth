import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios-auth'
import globalAxios from 'axios'
import router from './router/index'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
		user: null,
  },
  mutations: {
    authUser (state, userData) {      // storing the token in the vuex store
      state.idToken = userData.token
      state.userId = userData.userId
    },

		storeUser (state, user) {
    	state.user = user
		},

		clearAuthData (state) {
    	state.idToken = null
			state.userId = null
		}
  },
  actions: {
  	setLogoutTimer({ commit }, expirationTime) {
  		setTimeout(() => {
  			commit('clearAuthData')
			}, expirationTime * 1000)
		},

    login({ commit, dispatch }, authData) { // login action dispatched in the component
			axios.post('/verifyPassword?key=AIzaSyD0D6Dtj5f6-lXxC8jZyKv46_mMc13TDHI',
				{ email: authData.email,
					password: authData.password,
					returnSecureToken: true
				})
				.then(res => {
				  console.log(res)
					commit('authUser', {
					  token: res.data.idToken,
            userId: res.data.localId,
          })

					const now = new Date()
					const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
					localStorage.setItem('token', res.data.idToken)  // store token in local storage for auto login
					localStorage.setItem('userId', res.data.localId)
					localStorage.setItem('expirationDate', expirationDate)

					dispatch('setLogoutTimer', res.data.expiresIn)
        })
				.catch(error => console.log(error))
    },

		tryAutoLogin({ commit }) {
  		const token = localStorage.getItem('token')
			if (!token) {
  			return
			}
			const expirationDate = localStorage.getItem('expirationDate')
			const now = new Date()

			if (now >= expirationDate) {
  			return
			}
			const userId = localStorage.getItem('userId')
			commit('authUser', {
				token,
				userId
			})
		},

		logout({ commit }) {
    	commit('clearAuthData')
			localStorage.removeItem('expirationDate')
			localStorage.removeItem('token')
			localStorage.removeItem('userId')
			router.replace('/signin') // redirect after logout
		},

    signup({ commit, dispatch }, authData) { // signup action dispatched in the component
			axios.post('/signupNewUser?key=AIzaSyD0D6Dtj5f6-lXxC8jZyKv46_mMc13TDHI', // store user in auth database
				{ email: authData.email,
					password: authData.password,
					returnSecureToken: true
				})
				.then(res => {
					console.log(res)
					commit('authUser', {
						token: res.data.idToken,
						userId: res.data.localId,
					})


					const now = new Date()
					const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
					localStorage.setItem('token', res.data.idToken)  // store token in local storage for auto login
					localStorage.setItem('userId', res.data.localId)
					localStorage.setItem('expirationDate', expirationDate)

					dispatch('storeUser', authData) // save user to firebase users
					dispatch('setLogoutTimer', res.data.expiresIn)
				})
        .catch(error => console.log(error))
    },

		storeUser({ commit, state }, userData) { // save user to firebase users
			if (!state.idToken) {
				return
			}
			globalAxios.post(`/users.json?auth=${state.idToken}`, userData) //path from main.js axios defaults
				.then(res => console.log(res))
				.catch(error => console.log(error))
		},

		fetchUser({ commit, state }) {
			globalAxios.get(`/users.json?auth=${state.idToken}`)
				.then(res => {
					console.log(res)
					const data = res.data
					const users = []
					for (let key in data) {
						const user = data[key]
						user.id = key
						users.push(user)
					}
					console.log(users)
					commit('storeUser', users[0])
				})
				.catch(error => console.log(error))
		}
  },
  getters: {
		user (state) {
			return state.user
		},
		isAuthenticated (state) {
			return state.idToken !== null
		}
  }
})