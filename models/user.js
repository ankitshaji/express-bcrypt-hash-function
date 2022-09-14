//user created module file - can contain functionObjects,variable,classObjects etc which we can export
//mongoose ODM - supports promises
const mongoose = require("mongoose"); //mongooseObject //mongoose module
const SchemaClassObject = mongoose.Schema; //SchemaClassObject
//dont need to connect nodejs runtime app to mongod server port since we are going to export model to where its already connected

//*********************************************************************************
//MODEL - UserClassObject ie(Model) - represents the (users) collection
//*********************************************************************************
//blueprint of a single document in users collection -
//mongooseObject.schemaMethod = schemaClassObject(objectArgument passed to constructor method)
//objectArgument-{key:nodejs value type} for collection {keys:value}
//creating userSchemaInstanceObject - with new keyword and schemaClassObject constructor method
//setting validtaions/constraints in object - shorthand vs longhand - [string] vs [{properties}] and String vs {type:String,required:true}
///cannot ommit username property,cannot ommit hashValuePassword property ,addtional key:values get neglected(no error)
//we can set some custom words in messageFromMongoose when implicit throw new Error("messageFromMongoose") occurs
const userSchemaInstanceObject = new SchemaClassObject({
  username: { type: String, required: [true, "Username cannot be blank"] },
  hashValuePassword: {
    type: String,
    required: [true, "Password cannot be blank"],
  },
});

//creating UserClassObject ie(Model) - represents a collection (users)
//mongooseObject.method("collectionNameSingular",collectionSchemaInstanceObject)
//exportsObject = ReviewsClassObject ie(Model)
module.exports = mongoose.model("User", userSchemaInstanceObject);
