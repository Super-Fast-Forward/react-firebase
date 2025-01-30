var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { initializeApp } from "@firebase/app";
import { addDoc, arrayRemove, // ✅ Fix missing import
arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, getDocs, initializeFirestore, // ✅ Fix missing import
onSnapshot, // ✅ Fix missing import
persistentLocalCache, // ✅ Fix missing import
persistentMultipleTabManager, // ✅ Fix missing import
query, setDoc, Timestamp, updateDoc, // ✅ Fix missing import
writeBatch, } from "firebase/firestore";
export class FirestoreService {
    // Initialize Firebase app and Firestore
    static initialize(firebaseConfig) {
        if (!this.app) {
            this.app = initializeApp(firebaseConfig);
            this.db = initializeFirestore(this.app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager(),
                }),
            });
        }
    }
    static logRequest() {
        const now = Date.now();
        FirestoreService.requestTimestamps.push(now);
        // Remove timestamps older than 1 minute
        FirestoreService.requestTimestamps.splice(0, FirestoreService.requestTimestamps.findIndex((ts) => now - ts < 60000));
        if (FirestoreService.requestTimestamps.length >
            FirestoreService.maxRequestsPerMinute) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }
    }
    static logDocumentRequest(docPath) {
        const now = Date.now();
        if (!FirestoreService.documentRequestLog.has(docPath)) {
            FirestoreService.documentRequestLog.set(docPath, []);
        }
        const timestamps = FirestoreService.documentRequestLog.get(docPath);
        timestamps.push(now);
        // Remove timestamps older than 1 minute
        FirestoreService.documentRequestLog.set(docPath, timestamps.filter((ts) => now - ts < 60000));
        if (timestamps.length > FirestoreService.maxDocumentRequestsPerMinute) {
            throw new Error(`Rate limit exceeded for document: ${docPath}. Please try again later.`);
        }
    }
    static getDocument(docPath) {
        return __awaiter(this, void 0, void 0, function* () {
            FirestoreService.logDocumentRequest(docPath);
            const docSnap = yield getDoc(doc(this.db, docPath));
            const data = docSnap.exists() ? docSnap.data() : null;
            return data;
        });
    }
    static addDocument(collectionPath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            FirestoreService.logRequest();
            const docRef = yield addDoc(collection(this.db, collectionPath), data);
            return docRef.id;
        });
    }
    static updateDocument(docPath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            FirestoreService.logRequest();
            yield updateDoc(doc(this.db, docPath), data);
        });
    }
    static setDocument(docPath, data) {
        return __awaiter(this, void 0, void 0, function* () {
            FirestoreService.logRequest();
            yield setDoc(doc(this.db, docPath), data, { merge: true });
        });
    }
    static deleteDocument(docPath) {
        return __awaiter(this, void 0, void 0, function* () {
            FirestoreService.logRequest();
            yield deleteDoc(doc(this.db, docPath));
        });
    }
    static subscribeToDocument(docPath, callback) {
        FirestoreService.logRequest();
        const unsubscribe = onSnapshot(doc(this.db, docPath), (docSnap) => {
            const data = docSnap.exists() ? docSnap.data() : null;
            callback(data);
        });
        return unsubscribe;
    }
    static logSubscriptionRequest(subPath) {
        const now = Date.now();
        if (!FirestoreService.subscriptionRequestLog.has(subPath)) {
            FirestoreService.subscriptionRequestLog.set(subPath, []);
        }
        const timestamps = FirestoreService.subscriptionRequestLog.get(subPath);
        timestamps.push(now);
        // Remove timestamps older than 1 minute
        FirestoreService.subscriptionRequestLog.set(subPath, timestamps.filter((ts) => now - ts < 60000));
        if (timestamps.length > FirestoreService.maxSubscriptionRequestsPerMinute) {
            throw new Error(`Rate limit exceeded for subscription: ${subPath}. Please try again later.`);
        }
    }
    static subscribeToCollection(collectionPath, callback) {
        FirestoreService.logSubscriptionRequest(collectionPath);
        const unsubscribe = onSnapshot(query(collection(this.db, collectionPath)), (snapshot) => {
            const data = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
            callback(data);
        });
        return unsubscribe;
    }
    static logCollectionFetchRequest(collectionPath) {
        const now = Date.now();
        if (!FirestoreService.collectionFetchRequestLog.has(collectionPath)) {
            FirestoreService.collectionFetchRequestLog.set(collectionPath, []);
        }
        const timestamps = FirestoreService.collectionFetchRequestLog.get(collectionPath);
        timestamps.push(now);
        // Remove timestamps older than 1 minute
        FirestoreService.collectionFetchRequestLog.set(collectionPath, timestamps.filter((ts) => now - ts < 60000));
        if (timestamps.length > FirestoreService.maxCollectionFetchRequestsPerMinute) {
            throw new Error(`Rate limit exceeded for collection fetch: ${collectionPath}. Please try again later.`);
        }
    }
    static fetchCollection(path, ...queryConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            FirestoreService.logCollectionFetchRequest(path);
            const snapshot = yield getDocs(queryConstraints.length > 0
                ? query(collection(this.db, path), ...queryConstraints)
                : collection(this.db, path));
            return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        });
    }
    static copyCollection(sourceCollectionPath, targetCollectionPath
    //   firestore: db
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const sourceCollectionRef = collection(this.db, sourceCollectionPath);
            const sourceColSnapshot = yield getDocs(sourceCollectionRef);
            if (sourceColSnapshot.empty) {
                console.log("No matching documents.");
                return;
            }
            const batch = writeBatch(this.db);
            sourceColSnapshot.docs.forEach((docSnap) => {
                const targetDocRef = doc(this.db, targetCollectionPath + "/" + docSnap.id); // Keeping the same document ID
                batch.set(targetDocRef, docSnap.data());
            });
            yield batch.commit();
            console.log(`Successfully copied ${sourceColSnapshot.size} documents from ${sourceCollectionPath} to ${targetCollectionPath}.`);
        });
    }
    static getFieldValue() {
        return { arrayUnion, arrayRemove };
    }
    // Add the getTimestamp method
    static getTimestamp() {
        return Timestamp.now();
    }
    static deleteField() {
        return deleteField(); // Use deleteField directly
    }
    static getBatch() {
        FirestoreService.logRequest();
        return writeBatch(this.db);
    }
    // Get the authenticated user's ID
    // static getAuthUserId(): string | null {
    //   const auth = getAuth();
    //   const user: User | null = auth.currentUser;
    //   return user ? user.uid : null;
    // }
    /**
     * Get a reference to a Firestore collection.
     * @param collectionPath The path to the collection
     * @returns The Firestore collection reference
     */
    static getCollectionRef(collectionPath) {
        return collection(this.db, collectionPath);
    }
    /**
     * Execute a Firestore query and return the results.
     * @param queryInstance The Firestore query instance
     * @returns A promise resolving to an array of documents
     */
    static executeQuery(queryInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            const snapshot = yield getDocs(queryInstance);
            return snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        });
    }
}
FirestoreService.requestTimestamps = [];
FirestoreService.maxRequestsPerMinute = 500;
FirestoreService.documentRequestLog = new Map();
FirestoreService.collectionFetchRequestLog = new Map();
FirestoreService.subscriptionRequestLog = new Map();
FirestoreService.maxDocumentRequestsPerMinute = 30;
FirestoreService.maxSubscriptionRequestsPerMinute = 30;
FirestoreService.maxCollectionFetchRequestsPerMinute = 20;
export default FirestoreService;
