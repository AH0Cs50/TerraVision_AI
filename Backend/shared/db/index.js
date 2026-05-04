import Datastore from "nedb-promises";

// users collection
export const usersDB = Datastore.create({
  filename: "./data/users.db",
  autoload: true
});

// Unique email index
usersDB.ensureIndex({
  fieldName: "email",
  unique: true
});

// Unique UUID index
usersDB.ensureIndex({
  fieldName: "uuid",
  unique: true
});



// plants collection
export const plantsDB = Datastore.create({
  filename: "./data/plants.db",
  autoload: true
});

// Indexes
plantsDB.ensureIndex({
    fieldName: "uuid",
    unique: true
});
plantsDB.ensureIndex({ fieldName: "userId" });
plantsDB.ensureIndex({ fieldName: "createdAt" });


const collections = {
    users:usersDB,
    plants:plantsDB,
}

export default collections;