const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
var request = require('request');
var async = require('async');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// dummy database for purposes of this demo.  It would normally be a db model, and assigned as new User()
global.users = [];


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// Initial test route, should be prefixed at /api
router.get('/', function (req, res) {
    res.json({ message: 'welcome to the API, please register at /register' });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// Error handling middleware - catch all 500 errors
app.use(function (err, req, res, next) {

    console.error(err);

    // We would normally shield clients from internal errors, and log them, but for purposes of this demo it is being logged here.
    res.status(500).send({ status: 500, message: 'internal error: ' + err.message, type: 'internal' });
})

function addUser(key, username, token) {
    // Add user to table, using "key" as a primary-key.  
    // Demo spec doesn't say anything about unique users, but I'm working on the assumption that the same user with the same access token can't be added twice'
    var user = { "key": key, "username": username, "accessToken": token, "creationTime": new Date().toISOString(), "numOfNotificationsPushed": 0 };
    users.push(user);
    return user;
}

// on routes that end in /register
// ----------------------------------------------------
router.route('/register')

    // register a user (accessed at POST http://localhost:8080/api/register)
    .post(function (req, res) {

        var username = req.body.username
        var accessToken = req.body.accessToken

        console.log('username is: ' + username)
        console.log('accessToken is: ' + accessToken)

        // I would check if username and token conforms to a standard, but we don't have that info 
        // I am assuming that as long as we have been given one, and it doesn't already exist then it's fair-game to register
        if (username && accessToken) {
            
            // When working with C# I use Linq lambda expressions, so I prefer this way instead of classic for loop, but I realise it's not always supported'
            var exists = users.find(o => o.username === username && o.accessToken === accessToken);
            
            if (!exists)
            {
                var user = addUser(uuidv1(), username, accessToken) // uuidv1 is a simple library that creates a uuid from timestamp
                
                res.status(200).send({ username: user.username, accessToken: user.accessToken, creationTime: user.creationTime, numOfNotificationsPushed: user.numOfNotificationsPushed });

            } else
            {
                  // A duplicate access token shouldn't exist at all, but for the purposes of the demo a different user can have the same access token.
                res.status(400).send({ status: 400, message: 'A user with that name and access token already exists' }); 
            }

        } else {

             // I'm going to return a 400, but there is debate if a missing property should mean 404
            res.status(400).send({ status: 400, message: 'Missing required paramaters: username was ' + username + ' and token was ' + accessToken});
        }
    });

// on routes that end in /users
// ----------------------------------------------------
router.route('/users')

    // fetch all users (accessed at GET http://localhost:8080/api/users)
    .get(function (req, res) {

        // Fetching a list of all users does not require that you have already registered a user in order to view them, so no auth required
        if (users.length > 0) {

            // remove the key propety before returning it in the response
            var copy = JSON.parse(JSON.stringify(users)); //this is the magic that actually creates a deep copy and stops it from keeping a reference to global users

            copy.forEach(function (element) {
                delete element["key"];
            });

            // return it using JSON.stringify to avoid serializing it as usercopy [ {"username":"bbcUser12","accessToken":"anAccessToken" }] i.e. strip off 'usercopy'
            res.status(200).send(JSON.stringify(copy));

        } else {

            // still returns a 200 status because it hasn't failed'
            res.status(200).send({ status: 200, message: 'There are currently no registered users' });
        }
    });


// on routes that end in /pushbullet
router.route('/notify')

    // post notification to a username with pushbullet (accessed at GET http://localhost:8080/api/pushbullet)
    .post(function (req, res) {

        var username = req.body.username
        console.log('username is: ' + username)

        if (username) {

            // Does this username exist in our user list?  A user can exist more than once, or at least spec doesn't say that they cannot'
            var existingUsers = users.filter(user => user.username === username); // existingUsers is a new array because filter explicitely does that

            // If we have atleast one user
            if (existingUsers.length > 0) {

                async.eachOfSeries(existingUsers, function (existinguser, i, callback) {

                    var uniqueUser = users.find(o => o.key == existinguser.key) // And this is why we assigned them a uuid key.'

                    //The notification we will send
                    var nofication = { "body": "I'm a notification, yay!", "title": "Example nofication", "type": "note" };

                    request({
                        url: "https://api.pushbullet.com/v2/pushes",
                        method: "POST",
                        body: JSON.stringify(nofication),
                        headers: {
                            'User-Agent': 'request',
                            'Content-Type': 'application/json',
                            'Access-Token': uniqueUser.accessToken
                        },
                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {

                            //need to up our notification count
                            uniqueUser.numOfNotificationsPushed += 1
                            
                            // The next iteration WON'T START until callback is called
                            callback()

                        } else {

                            callback(body)
                        }

                    });
                }, function (err) {

                    // This might be wrong because (if we allow users with same username) then 
                    // if we are sending a notification to two users with same name, and one of the users has an invalid token, 
                    // and the user with the invalid token was added first, then he would return an error and prevent the second users notification from sending,
                    // but we don't have a mechanism for verifying legitimate tokens in this demo, which would solve this.
                    // We could also pass both success and error objects into the callback and check both, but that's messy'
                    // because the async library I used specfically states its to be an error (err)

                    if (err) {
                        var errorList = JSON.parse(err); // the cat face doesn't parse without this...'

                        return res.status(400).send("Failed to send a notification" + JSON.stringify(errorList));
                    } else {
                        return res.status(200).send("Notifications sent successfully");
                    }

                });

            } else {

                // 200 OK request because that user doesn't happen to exist, but that's OK? - hmmm, debatable.
                res.status(200).send({ status: 200, message: 'There are no registered users with the username ' + username + ' , no notifcations were sent' });
            }

        } else {

            // I'm going to return a 400, but there is a debate on if missing property should be 404
            res.status(400).send({ status: 400, message: 'Missing required paramater: username was ' + username });
        }
    });


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);