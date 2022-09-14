const express = require("express"); //functionObject //express module
const path = require("path"); //pathObject //path module
const app = express(); //appObject
// ********************************************************************************
//main express application/appObject - (RESTful) webApi - webApi using REST principles
// *******************************************************************************
//mongoose ODM - supports promises
const mongoose = require("mongoose"); //mongooseObject //mongoose module
const UserClassObject = require("./models/user"); //UserClassObject(ie Model) //self created module/file needs "./"
const bcrypt = require("bcrypt"); //bcryptObject //bcrypt module

// ********************************************************************************
// CONNECT - nodeJS runtime app connects to default mogod server port + creates db
// ********************************************************************************
//async(ie continues running outside code if it hits an await inside) named function expression
//implicit returns promiseObject(resolved,undefined) - can await a promiseObject inside
//async function expression without an await is just a normal syncronous function expression
async function main() {
  try {
    //mongooseObject.method(url/defaultPortNo/databaseToUse) //returns promiseObject pending
    await mongoose.connect("mongodb://localhost:27017/authentication-db");
    //promisObject resolved
    console.log("Database Connected");
  } catch (err) {
    //promisObject rejected
    //catches any initial error that occure when establising connection
    console.log("Mongo intial connection error has occured");
    console.log(err);
  }
}
main(); //execute async named function expression
//Dont need to wait for promiseObject to resolve - Operation Buffering
//mongoose lets us use models immediately after,without waiting for mongoose to eastablish a connection to MongoDB

// ******************************************
//Catch errors after initial connection
// ******************************************
//mongooseObject.property = connectionObject
const db = mongoose.connection; //db = connectionObject
//connectionObject.method(string,callback)
db.on("error", console.error.bind(console, "connection error:"));

// ******************************************
//Other initializations
// ******************************************
//when view engine is used express assumes our views ie ejs templates
//exist in a (default)views directory
app.set("view engine", "ejs"); //auto require("ejs")
//set path to views directory + change path to "absolute path to index.js" + "/views"   - due to not finding views directory when executing from outside this directory eg-cd..
app.set("views", path.join(__dirname, "/views"));

// ****************************************************************************************************************************************************************************************
//(Third party)middleware(hook) function expressions and (express built-in) middleware(hook)methods and (custom) middleware(hook)function expressions - Order matters for next() execution
// ****************************************************************************************************************************************************************************************
//(Application-level middleware) - bind middlewareCallback to appObject with app.use() or app.method()
//case 1  - app.use(middlewareCallback) lets us execute middlewareCallback on any http method/every (http structured) request to any path
//case 2 - app.use("pathString"-ie /resource,middlewareCallback) lets us execute middlewareCallback on any http method/every (http structured) request to specific path/resource
//case 3 - app.use("pathPrefixString",custom routerObject(ie middlewareCallback)) lets us execute custom routerObject(ie middelwareCallback) on any http method/every (http structured) request to specific path/resource

//(express built-in)
//expressFunctionObject.middlewareCreationMethod(argument) - argument is object
//middlewareCreationMethod execution creates middlewareCallback
//middlewareCallback - Purpose: Accept form data - (http structured) POST request body parsed to req.body before before moving to next middlewareCallback
//sidenode - (http structure) POST request could be from browser form or postman
app.use(express.urlencoded({ extended: true })); //app.use(middlewareCallback) //app.use() lets us execute middlewareCallback on any http method/every (http structured) request to any path
//middlewareCallback calls next() inside it to move to next middlewareCallback

// ***************************************************************************************************************************************************************
//Using RESTful webApi crud operations pattern (route/pattern matching algorithm - order matters) + MongoDB CRUD Operations using mongoose-ODM (modelClassObject)
// ***************************************************************************************************************************************************************

//route root
//httpMethod=GET,path/resource-/(root) -(direct match/exact path)
//(READ) name-home,purpose-display home page
//appObject.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) GET request arrives at path /
//arguments passed in to handlerMiddlewareCallback -
//-if not already converted convert (http structured) request to req jsObject
//-if not already created create res jsObject
//-nextCallback
app.get("/", (req, res) => {
  res.send("This is home page");
});

//*************
//RANDOM ROUTES
//*************

//route1
//httpMethod=GET,path/resource- /register  -(direct match/exact path)
//(READ) name-new,purpose-display form to submit new document into (users)collection of (authentication-db)db
//router.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) GET request arrives at path /register
//arguments passed in to handlerMiddlewareCallback -
//-if not already converted convert (http structured) request to req jsObject
//-if not already created create res jsObject
//-nextCallback
app.get("/register", (req, res) => {
  res.render("register");
});

//route2
//httpMethod=POST,path/resource- /register  -(direct match/exact path)
//(CREATE) name-create,purpose-create new document in (users)collection of (authentication-db)db
//router.method(pathString ,async handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) POST request arrives at path /register
//arguments passed in to handlerMiddlewareCallback -
//-already converted (http structured) request to req jsObject - (http structured) request body contained form data,previous middlewareCallback parsed it to req.body
//-if not already created create res jsObject
//-nextCallback
//async(ie continues running outside code if it hits an await inside) handlerMiddlwareCallback implicit returns promiseObject(resolved,undefined) - can await a promiseObject inside
//async function expression without an await is just a normal syncronous function expression
app.post("/register", async (req, res) => {
  //object keys to variable - Object destructuring
  const { username, password } = req.body; //form data/req.body is jsObject //{key/name:inputValue,key/name:inputValue}}
  //bcryptObject.method(passordString,saltRound) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
  //hashValue is stringObject ,ie-computed hashValue of passwordStringWithSalt - (note - hashValue always random due to randomValue salt)
  const hashValue = await bcrypt.hash(password, 12);
  // ***************************************************************************************
  //CREATE - creating a single new document in the (users) collection of (authentication-db)db
  // ***************************************************************************************
  //modelClass
  //UserClassObject(objectArgument-passed to constructor method)
  //objectArgument- jsObject{key:value} ie the new document that abides to collectionSchemaInstanceObject
  //objectArgument has validations/contraints set by collectionSchemaInstanceObject
  //validations/contraints -
  //cannot ommit username property,cannot ommit hashValuePassword property ,addtional key:values get neglected(no error)
  //create modelInstanceObject(ie document) - with new keyword and UserClassObject constructor method
  const newUser = UserClassObject({
    username,
    hashValuePassword: hashValue,
  });
  //modelInstance.save() returns promiseObject - pending to resolved(dataObject),rejected(errorObject) ie(breaking validation/contraints)
  //creates (users)collection in (authentication-db)db if not existing already and adds (newUser)document into the (authentication-db)collection
  //implicitly throws new Error("messageFromMongoose") - break validation contraints
  const savedUser = await newUser.save(); //savedUser = dataObject ie created jsObject(document)
  res.redirect("/");
  //responseObject.redirect("rootPath") updates res.header, sets res.statusCode to 302-found ie-redirect ,sets res.location to /
  //responseObject.redirect("rootPath") - converts and sends res jsObject as (http structure)response // default content-type:text/html
  //thus ending request-response cycle
  //browser sees (http structured) response with headers and makes a (http structured) GET request to location ie default(get) /
});

//route3
//httpMethod=GET,path/resource- /secret -(direct match/exact path)
//(READ) name-index,purpose-display all documents in (x)collection from (x)db
//router.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) GET request arrives at path /secret
//arguments passed in to handlerMiddlewareCallback -
//-if not already converted convert (http structured) request to req jsObject
//-if not already created create res jsObject
//-nextCallback
app.get("/secret", (req, res) => {
  res.send(
    "You have accessed secret route, you cannot see this unless you are logged in"
  );
});

//address - localhost:3000
//appObject.method(port,callback) binds app to port
//execute callback when appObject start listening for (http structured) requests at port
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
