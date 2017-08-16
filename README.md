# mph_pushbullet_demo
This is a demo application.  To run it, please install node and then navigate to the project directory using the command line, and then run the command 'node app.js'

Please test using postman or something similar

Endpoints:

POST: localhost:8080/api/register

This registers you, you will need to supply your own username and Access Token

example JSON body:
{
    "username": "myuser",
    "accessToken": "12345"
}

GET: localhost:8080/api/users

This has no restrictions, it's just a simple way to show the registered users.  The registered user list is only maintained for the lifespan of the server.

POST: localhost:8080/api/notify

This only requires a username and the access token in header e.g. Access-Token: 12345

example JSON body:
{
    "username": "myuser"
}
