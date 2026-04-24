import { collection, doc } from "firebase/firestore";

const ROLE_COLLECTIONS = {
  advocate: "advocates",
  client: "clients",
};

export function getUserCollectionName(role) {
  return ROLE_COLLECTIONS[role] || "clients";
}

export function userDocRef(db, role, uid) {
  return doc(db, getUserCollectionName(role), uid);
}

export function userCollectionRef(db, role) {
  return collection(db, getUserCollectionName(role));
}
