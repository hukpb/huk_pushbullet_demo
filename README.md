# huk_pushbullet_demo
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
No restrictions, a simple way to show registered users.  Registered user list is only maintained for lifespan of server

POST: localhost:8080/api/notify
Only required to send username.  Supply the access token in header e.g. Access-Token: 12345example
example JSON body:
{
    "username": "myuser"
}
