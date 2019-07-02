//Defines some global variables

//The URL of a server where Casa is installed e.g. https://my.company.com
var issuer = "https://some.gluu.info"
var OIDCUrl = issuer + "/.well-known/openid-configuration"
var endpoints_root = issuer + "/casa/rest/enrollment"

//This client should exist already in the Gluu server pointed above
//Ensure you add the domain you are using to serve these pages in the "Add authorized Javascript origin" text field
var clientId= "0911eac5-41ec-425c-857b-d92927647028"
var clientSecret = "secret"

//leave this blank
var token=""
