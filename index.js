//main file that gets passed in other npm package modules or user created modules
//library supports promises
const bcrypt = require("bcrypt"); //bcrptyObject //bcrypt module
//saltRound(ie difficulty to compute hash(low no means easy/fast)(1-x)(standard is 12)) - controls time it takes to compute hash - make it slow for safty

//async(ie continues running outside code if it hits an await inside) function epxression implicit returns promiseObject(resolved,undefined) - can await a promiseObject inside
//async function expression without an await is just a normal syncronous function expression
const hashPassword = async (passwordString) => {
  //bcryptObject.method(saltRound) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
  //salt a stringObject,ie-randomValue to add onto password string
  const salt = await bcrypt.genSalt(10); //salt is dataObject
  //bcryptObject.method(passordString,salt) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
  //hashValue is stringObject ,ie-computed hashValue of passwordStringWithSalt - (note - hashValue always random due to randomValue salt)
  const hashValue = await bcrypt.hash(passwordString, salt); //hashValue is dataObject
  //Note -
  //promiseObject takes time to resolve due to the salt being used having hight difficulty set
  //dont need to store salt sepertaly, it is extractable from hashValue - quirk of bcrypt
  //ie - when verifying/comparing a request from client with passwordString to login
  //bcrypt uses a compareMethod that can automatically seperate salt from hashValue
  //to add it onto the recieved passwordString to recreate the hashValue for comparison
};

//alternative hashValue creation - without seperatly creating salt randomValue stringObject
//async(ie continues running outside code if it hits an await inside) function epxression implicit returns promiseObject(resolved,undefined) - can await a promiseObject inside
//async function expression without an await is just a normal syncronous function expression
const altHashPassword = async (passwordString) => {
  //bcryptObject.method(passordString,saltRound) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
  //hashValue is stringObject ,ie-computed hashValue of passwordStringWithSalt - (note - hashValue always random due to randomValue salt)
  const hashValue = await bcrypt.hash(passwordString, 12); //
  console.log(hashValue);
};

const login = async (recievedPasswordString, comparingHashValue) => {
  //bcryptObject.method(recievedPasswordString,comparingHashValue) returns promiseObject pending(pending,undefined) to resolved(resolved,dataObject)
  //boolResult is booleanObject - true - if same hashValue in database generated with extracted salt added onto recivedPasswordString ie same passwordStrings
  const boolResult = await bcrypt.compare(
    recievedPasswordString,
    comparingHashValue
  ); //boolResult is dataObject
  //Note -
  //dont need to store salt sepertaly, it is extractable from hashValue - quirk of bcrypt
  //ie - when verifying/comparing a request from client with recievedPasswordString to login
  //bcrypt uses its compareMethod that can automatically seperate salt from comparingHashValue
  //to add it onto the recievedPasswordString to recreate the hashValue for comparison
  //if(true)
  if (boolResult) {
    console.log("Logged you in! successfull passwordString match");
  } else {
    console.log("incorrect passwordString");
  }
};

//Note - async function expression exectutions resolve at diffrent times

//hashPassword("monkey"); //hashValue stored in database - $2b$10$3.6ibcsEWxco4vvLLD2fbeDWRnbQM/PtOxJhgyNx228VBCgKt708S
login("monkey", "$2b$12$o34bJMBvuIaQxdVceYC88.2pi6h3Cs4pJcxJQ9YMk2M5RWTCG3zni"); //check if receivedPasswordStrings hashValue after using the extracted salt from comparingHashValue is same as comparingHashValue in database
//Logged you in!
login(
  "monkey1",
  "$2b$10$3.6ibcsEWxco4vvLLD2fbeDWRnbQM/PtOxJhgyNx228VBCgKt708S"
); //incorrect passwordString
altHashPassword("monkey"); //hashValue stored in database - $2b$12$o34bJMBvuIaQxdVceYC88.2pi6h3Cs4pJcxJQ9YMk2M5RWTCG3zni
