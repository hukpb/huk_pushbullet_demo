# mph_pushbullet_demo
demo application

Please test using postman or something similar

Endpoints:

POST: localhost:8080/api/register

This registers you, you will need to supply your own username and Access Tokens
example JSON body:
{
    "username": "myuser",
    "accessToken": "12345example"
}

GET: localhost:8080/api/users

No restrictions, it's just a simple way to show the registered users.  The registered user list is only maintained for the lifespan of the server

POST: localhost:8080/api/notify

This only requires a username and the access token in header e.g. Access-Token: 12345example
example JSON body:
{
    "username": "myuser"
}
