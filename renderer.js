// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const path = require('path')
const api = require('instagram-private-api').V1
const $ = require('jquery')

const
	phone = $('#phone'),
	code = $('#code'),
	phoneBtn = $('#phone-button'),
	codeBtn = $('#code-button'),
	authBtn = $('#auth-button'),
	userField = $('#username'),
	passField = $('#password');

///////////////////////////////////////////
///////////////////////////////////////////

let user, password;

authBtn.click(() => {
	user = userField.val()
	password = passField.val()
	var device = new api.Device(user)
	var storage = new api.CookieFileStorage(path.join(__dirname, 'cookies', `${user}.json`))
	api.Session.create(device, storage, user, password)
		.then(function(session) {
			session.getAccount()
				.then(function(account) {
					$('#output').val(account.params)
				})
		})
	console.log('auth')
	loginAndFollow(device, storage, user, password)
		.catch(api.Exceptions.CheckpointError, function(error){
			// Ok now we know that Instagram is asking us to
			// prove that we are real users
			console.error(error)
			return challengeMe(error);
		})
		.then(function(relationship) {
			console.log(relationship.params)
			// {followedBy: ... , following: ... }
			// Yey, you just followed an account
		});
})

function challengeMe(error){
	return api.Web.Challenge.resolveHtml(error,'phone')
	.then(function(challenge){
		// challenge instanceof Client.Web.Challenge
		console.log(challenge.type);
		// can be phone or email
		// let's assume we got phone
		if(challenge.type !== 'phone') return;

		return new Promice(function(resolve){
			phoneBth.click(function(){
				console.log('click phone')
				resolve(challenge)
			})
		})
		//Let's check if we need to submit/change our phone number
	})
	.then(function(challenge){
		return challenge.phone(phone.val())
			.then(function(){return challenge});
	})
	.then(function(challenge){
		return new Promice(function(resolve){
			codeBtn.click(function(){
				console.log('click code')
				resolve(challenge)
			})
		})
	})
	.then(function(challenge){
		// Ok we got to the next step, the response code expected by Instagram
		return challenge.code(code.val());
	})
	.then(function(challenge){
		// And we got the account confirmed!
		// so let's login again
		return loginAndFollow(device, storage, user, password);
	})
}


function loginAndFollow(device, storage, user, password) {
	return api.Session.create(device, storage, user, password)
		.then(function(session) {
			// Now you have a session, we can follow / unfollow, anything...
			// And we want to follow Instagram official profile
			return [session, api.Account.searchForUser(session, 'instagram')]   
		})
		.spread(function(session, account) {
			return api.Relationship.create(session, account.id);
		})
}


