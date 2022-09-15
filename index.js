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
const session = require("express-session"); //functionObject //express-session module

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

//(Third party)
//middlewareCreationFunctionObject(argument) - argument is sessionOptionsObject
//middlewareCreationFunctionObject execution creates middlewareCallback
//Purpose:
//case1-
//On first (http strucuted) request, express-sessions middlewareCallback auto creates a session(jsObject) property on reqObject (associated to a newly created temporary data store)
//it creates a new  sessionStore property on reqObject containing the temporary data store(MemoryStore)
//it creates and pupulates sessionID property in reqObject with a unique sessionID
//it creates a signed cookie with HMACValue (HMACValue is created from (req.sessionID + "secretString" + sha256HashFunction))
//req.session.property is used to add the specifc clients data to the newly created temporary data store where id is current unique sessionID
//it sets the signed cookie in the resObjects header (Set-Cookie:key:value)
//case2-
//On subsequent (http strucutred) requests from same client contain signed cookie in its header (Cookie:key:value)
//express-sessions middlewareCallback unsigns the cookies HMACValue to get the unique sessionID associate to that unique client
//it creates and pupulates sessionID property in reqObject with the current unique sessionID of client
//it creates a session(jsObject) property on reqObject (assoicated with the pre existing temporary data store)
//it creates a sessionStore property on reqObject containing the pre existing temporary data store(MemoryStore)
//req.session.property is used to retrive the specfic clients stored data from the pre existing temporary data store where id is current unique sessionID from signed cookie received from unique client
//it creates signed cookie with HMACValue (HMACValue is created from (req.sessionID + "secretString" + sha256HashFunction))
//it sets this signed cookie in the resObjects header (Set-Cookie:key:value)
//sidenode - (http structure) request could be from unique browserClients or unique postmanClients
const sessionOptionsObject = {
  secret: "thisismysecret",
  saveUninitialized: true,
  resave: false,
  cookie: {
    //default true //cannot access signed cookie in client side script - minimize damage of (XSS)cross-site scripting attack
    httpOnly: true,
    //milliseconds time now + milliseconds time in a week
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
//saveUninitialized - save a newly created session to data store even if session was not modified during the request
//resave - save non updated session to data store even if session was not modified during the request
//cookies - properties of created/receieved signed cookies
app.use(session(sessionOptionsObject)); //app.use(middlewareCallback) //app.use() lets us execute middlewareCallback on any http method/every (http structured) request to any path
//middlewareCallback calls next() inside it to move to next middlewareCallback

//(custom middlewareCallback)
//use in specific routes ie specific method and specific path
const loggedinCheck = (req, res, next) => {
  //retriving a userId property on current sessionObject (ie using sessionObject.property to add/retrive the specifc clients data to/from the new/pre existing temporary data store where id is current unique sessionID)
  //if no userId property stored in current sessionObject ie not logged in
  if (!req.session.userId) {
    return res.redirect("/login"); //return to skip rest of code - else respond twice error occurs - "Cannot set headrs afther they are sent to client"
    //responseObject.redirect("loginPath") updates res.header, sets res.statusCode to 302-found ie-redirect ,sets res.location to /login
    //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
    //responseObject.redirect("loginPath") - converts and sends res jsObject as (http structure)response // default content-type:text/html
    //thus ending request-response cycle
    //browser sees (http structured) response with headers and makes a (http structured) GET request to location ie default(get)/login
  }
  //else there is userId stored in sessionObject ie logged in
  next(); //pass to next middlewareCallback to access specific route logged in contenet
};

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
  //responseObject.send("stringObject")
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.send() - converts and sends res jsObject as (http structure)response //content-type:text/plain
  //thus ending request-response cycle
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
  //responseObject.render(ejs filePath,variableObject) - sends variable to ejs file - executes js - converts ejs file into pure html
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.render() - converts and sends res jsObject as (http structure)response //content-type:text/html
  //thus ending request-response cycle
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
  //savedUser wont be null
  //create a userId property on current sessionObject (ie using sessionObject.property to add/retrive the specifc clients data to/from the new/pre existing temporary data store where id is current unique sessionID)
  req.session.userId = savedUser._id; //userId is usefull for later collection look ups for current user
  res.redirect("/secret");
  //responseObject.redirect("secretPath") updates res.header, sets res.statusCode to 302-found ie-redirect ,sets res.location to /secret
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.redirect("secretPath") - converts and sends res jsObject as (http structure)response // default content-type:text/html
  //thus ending request-response cycle
  //browser sees (http structured) response with headers and makes a (http structured) GET request to location ie default(get) /secret
});

//route3
//httpMethod=GET,path/resource- /secret -(direct match/exact path)
//(READ) name-secret,purpose- secret ejs template only rendered if logged in - secret ejs template allows us to logout
//router.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) GET request arrives at path /secret
//arguments passed in to handlerMiddlewareCallback -
//-if not already converted convert (http structured) request to req jsObject
//-if not already created create res jsObject
//-nextCallback
app.get("/secret", loggedinCheck, (req, res) => {
  //res.send("You have accessed secret route, you cannot see this unless you are logged in");
  res.render("secret");
  //responseObject.render(ejs filePath,variableObject) - sends variable to ejs file - executes js - converts ejs file into pure html
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.render() - converts and sends res jsObject as (http structure)response //content-type:text/html
  //thus ending request-response cycle
});

//route4
//httpMethod=GET,path/resource- /secret -(direct match/exact path)
//(READ) name-secret,purpose- secret ejs template only rendered if logged in - secret ejs template allows us to logout
//router.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) GET request arrives at path /secret
//arguments passed in to handlerMiddlewareCallback -
//-if not already converted convert (http structured) request to req jsObject
//-if not already created create res jsObject
//-nextCallback
app.get("/topsecret", loggedinCheck, (req, res) => {
  res.send(
    "You have accessed topsecret route, you cannot see this unless you are logged in"
  );
  //responseObject.send("stringObject")
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.send() - converts and sends res jsObject as (http structure)response //content-type:text/plain
  //thus ending request-response cycle
});

//route5
//httpMethod=GET,path/resource- /login  -(direct match/exact path)
//(READ) name-edit,purpose-display form to submit username and password into comparison post route
//router.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) GET request arrives at path /register
//arguments passed in to handlerMiddlewareCallback -
//-if not already converted convert (http structured) request to req jsObject
//-if not already created create res jsObject
app.get("/login", (req, res) => {
  res.render("login");
  //responseObject.render(ejs filePath,variableObject) - sends variable to ejs file - executes js - converts ejs file into pure html
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.render() - converts and sends res jsObject as (http structure)response //content-type:text/html
  //thus ending request-response cycle
});

//route6
//httpMethod=POST,path/resource- /login  -(direct match/exact path)
//(CREATE) name-compare,purpose-compare existing document in (users)collection of (authentication-db)db
//router.method(pathString ,async handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) POST request arrives at path /login
//arguments passed in to handlerMiddlewareCallback -
//-already converted (http structured) request to req jsObject - (http structured) request body contained form data,previous middlewareCallback parsed it to req.body
//-if not already created create res jsObject
//-nextCallback
//async(ie continues running outside code if it hits an await inside) handlerMiddlwareCallback implicit returns promiseObject(resolved,undefined) - can await a promiseObject inside
//async function expression without an await is just a normal syncronous function expression
app.post(
  "/login",
  async (req, res, next) => {
    //object keys to variable - Object destructuring
    const { username, password } = req.body; //form data/req.body is jsObject //{key/name:inputValue,key/name:inputValue}}
    // ***********************************************************
    //READ - querying a collection(users) for a document by username
    // ***********************************************************
    //UserClassObject.method(queryObject) ie modelClassObject.method() - same as - db.campgrounds.findOne({username:"text"})
    //returns thenableObject - pending to resolved(dataObject),rejected(errorObject)
    //implicitly throws new Error("messageFromMongoose") if anything goes wrong during mongoose method
    const foundUser = await UserClassObject.findOne({ username: username }); //foundUser = dataObject ie single first matching jsObject(document)
    //username=test,password=monkey
    //foundUser null value auto set by mongodb for valid format username not in collection - calling hashValuePassword property on null causes error
    //note unlike before we do not give hint on why login failed - say incorrect username AND/OR incorrect password
    //!null   = true
    if (!foundUser) {
      return next(); //return to not run rest of code //pass it to next middlewareCallback
    }
    //bcryptObject.method(recievedPasswordString,comparingHashValue) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
    //validPassword is booleanObject - true - if same hashValue in database generated with extracted salt added onto recivedPasswordString ie same passwordStrings
    const validPassword = await bcrypt.compare(
      password,
      foundUser.hashValuePassword
    ); //validPassword is dataObject //booleanObject
    if (validPassword) {
      //create a userId property on current sessionObject (ie using sessionObject.property to add/retrive the specifc clients data to/from the new/pre existing temporary data store where id is current unique sessionID)
      req.session.userId = foundUser._id; //userId is usefull for later collection look ups for current user
      res.redirect("/secret");
      //responseObject.redirect("secretPath") updates res.header, sets res.statusCode to 302-found ie-redirect ,sets res.location to /secret
      //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
      //responseObject.redirect("secretPath") - converts and sends res jsObject as (http structure)response // default content-type:text/html
      //thus ending request-response cycle
      //browser sees (http structured) response with headers and makes a (http structured) GET request to location ie default(get)/secret
    } else {
      next(); //pass it to next middlewareCallback
    }
  },
  (req, res) => {
    res.redirect("/login");
    //responseObject.redirect("loginPath") updates res.header, sets res.statusCode to 302-found ie-redirect ,sets res.location to /login
    //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
    //responseObject.redirect("loginPath") - converts and sends res jsObject as (http structure)response // default content-type:text/html
    //thus ending request-response cycle
    //browser sees (http structured) response with headers and makes a (http structured) GET request to location ie default(get)/login
  }
);

//route7
//httpMethod=POST,path/resource- /logout  -(direct match/exact path)
//(CREATE) name-delete,purpose-delete sessionObject or set userId property on sessionObject to null
//router.method(pathString ,handlerMiddlewareCallback) lets us execute handlerMiddlewareCallback on specifid http method/every (http structured) request to specified path/resource
//execute handlerMiddlwareCallback if (http structured) POST request arrives at path /logout
//arguments passed in to handlerMiddlewareCallback -
//-already converted (http structured) request to req jsObject - (http structured) request body contained form data,previous middlewareCallback parsed it to req.body
//-if not already created create res jsObject
//-nextCallback
app.post("/logout", (req, res) => {
  //retrieve userId property on current sessionObject (ie using sessionObject.property to add/retrive the specifc clients data to/from the new/pre existing temporary data store where id is current unique sessionID)
  //update userId property on current sessionObject to null - now cant pass if check in secret route - lost access
  req.session.userId = null;
  //alternatively -
  //req.session.destroy(); // sessionObject property on reqObject is deleted completly ie(undefined) - therefore all properties on sessionObject are gone
  res.redirect("/login");
  //responseObject.redirect("loginPath") updates res.header, sets res.statusCode to 302-found ie-redirect ,sets res.location to /login
  //resObjects header contains signed cookie created/set by express-sessions middlewareCallback
  //responseObject.redirect("loginPath") - converts and sends res jsObject as (http structure)response // default content-type:text/html
  //thus ending request-response cycle
  //browser sees (http structured) response with headers and makes a (http structured) GET request to location ie default(get)/login
});

//address - localhost:3000
//appObject.method(port,callback) binds app to port
//execute callback when appObject start listening for (http structured) requests at port
app.listen(3000, () => {
  console.log("Listening on port 3000");
});
