//user created module file - can contain functionObjects,variable,classObjects etc which we can export
//mongoose ODM - supports promises
const mongoose = require("mongoose"); //mongooseObject //mongoose module
const SchemaClassObject = mongoose.Schema; //SchemaClassObject
const bcrypt = require("bcrypt"); //bcryptObject //bcrypt module
//dont need to connect nodejs runtime app to mongod server port since we are going to export model to where its already connected

//*********************************************************************************
//MODEL - UserClassObject ie(Model) - represents the (users) collection
//*********************************************************************************
//blueprint of a single document in users collection -
//mongooseObject.schemaMethod = schemaClassObject(objectArgument passed to constructor method)
//objectArgument-{key:nodejs value type} for collection {keys:value}
//creating userSchemaInstanceObject - with new keyword and schemaClassObject constructor method
//setting validtaions/constraints in object - shorthand vs longhand - [string] vs [{properties}] and String vs {type:String,required:true}
//cannot ommit username property,cannot ommit hashValuePassword property ,addtional key:values get neglected(no error)
//we can set some custom words in messageFromMongoose when implicit throw new Error("messageFromMongoose") occurs
const userSchemaInstanceObject = new SchemaClassObject({
  username: { type: String, required: [true, "Username cannot be blank"] },
  hashValuePassword: {
    type: String,
    required: [true, "Password cannot be blank"],
  },
});

// **********************************************************************************************************
//adding custom methods on userSchemaInstanceObject //thus adding custom methods to model - (case2) UserClassObject(ie modelClassObject)
// ***********************************************************************************************************
//grouping model logic - adding custom methods to each specifc model
//usually a classObject has prototypeObject with methods available to all instanceObject through references to that prototypeObject in __proto__ property

//(case 2) - adding custom methods to UserClassObject (ie modelClassObject)
//built with existing model methods - fancier way to create/find/update/delete
//this keyword refers to modelClassObject //left of dot (execution scope)
//userSchemaInstanceObject.property.customeStaticMethodName
userSchemaInstanceObject.statics.findByUsernameAndValidatePassword =
  async function (username, password) {
    // ***********************************************************
    //READ - querying a collection(users) for a document by username
    // ***********************************************************
    //UserClassObject.method(queryObject) ie modelClassObject.method() - same as - db.campgrounds.findOne({username:"text"})
    //returns thenableObject - pending to resolved(dataObject),rejected(errorObject)
    //implicitly throws new Error("messageFromMongoose") if anything goes wrong during mongoose method
    const foundUser = await this.findOne({ username: username }); //foundUser = dataObject ie single first matching jsObject(document)
    //foundUser null value auto set by mongodb for valid format username not in collection - calling hashValuePassword property on null causes error
    //note - unlike before we do not give hint on why login failed - say incorrect username AND/OR incorrect password
    //!null   = true
    if (!foundUser) return false; //return to not run rest of code
    //NOTE - username=test,password=monkey
    //bcryptObject.method(recievedPasswordString,comparingHashValue) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject) or rejected(rejected,errorObject)
    //isValidPassword is booleanObject - true - if same hashValue in database generated with extracted salt added onto recivedPasswordString ie same passwordStrings
    const isValidPassword = await bcrypt.compare(
      password,
      foundUser.hashValuePassword
    ); //isValidPassword is dataObject //booleanObject
    //tenernary operator used to return ie resolve(dataObject)
    return isValidPassword ? foundUser : false;
  };

// *****************************************************************************************************************************
//adding mongoose middleware(hook)Callback on userSchemaInstanceObject  - types - 1.modelInstanceObject OR 2.queryObject
// mongoose middleware(hook)Callback executes code before or after a mongoose method
// ******************************************************************************************************************************
//type 1
//async modelInstanceMiddlwareCallbacks (this keyword refers to modelInstanceObject)
//async default returns promiseObject - auto calls next() to go to next middlewareCallback
//async modelFunctions(mongoose methods) - save(),remove(),updateOne() etc
//exectue pre/post async modelInstanceMiddlewareCallback when modelFunction(mongoose method) is called
//example - pre async modelMiddlwareCallbacks added to remove() modelFunctions(mongoose method) that removes other associated info

//userSchemaInstanceObject.method("mongooseMethod",async modelInstanceMiddlwareCallback to execute after mongooseMethod(parameter-next))
//modelFunction - (mongoose method) - save
//async(ie continues running outside code if it hits an await inside) callback implicit returns promiseObject(resolved,undefined) - can await a promiseObject inside
//async function expression without an await is just a normal syncronous function expression
userSchemaInstanceObject.pre("save", async function (next) {
  //modelInstanceObject.method("property")
  //check if specific property on modelInstanceObject was modified - so we dont update hashValuePassword property on every mongooseMethod save execution eg.if only username saved dont rehash value of hashValuePassword
  if (!this.isModified("hashValuePassword")) return next(); //skip rest of code and call next mongoose middlewareCallback (ie execute mongooseMethod)
  //updating hashValuePassword property of modelInstanceObject before mongooseMethod save exectues on it
  //bcryptObject.method(passordString,saltRound) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
  //this.hashValuePassword is new stringObject ,ie-computed hashValue of passwordStringWithSalt - (note - hashValue always random due to randomValue salt)
  this.hashValuePassword = await bcrypt.hash(this.hashValuePassword, 12);
  //note - async implicit returns promiseObject(resolved,undefined) thus auto calls next mongoose middlewareCallback (ie execute mongooseMethod)
});

//creating UserClassObject ie(Model) - represents a collection (users)
//mongooseObject.method("collectionNameSingular",collectionSchemaInstanceObject)
//exportsObject = ReviewsClassObject ie(Model)
module.exports = mongoose.model("User", userSchemaInstanceObject);
