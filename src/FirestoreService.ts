import { FirebaseApp, initializeApp } from "@firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  Firestore,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  Query,
  QueryConstraint,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export default class FirestoreService {
  private static app: FirebaseApp;
  private static db: Firestore;

  private static requestLimits = {
    documentRead: {
      maxRequestsPerMinute: 50,
      timestamps: new Map<string, number[]>(),
    },
    documentWrite: {
      maxRequestsPerMinute: 30,
      timestamps: new Map<string, number[]>(),
    },
    collectionRead: {
      maxRequestsPerMinute: 20,
      timestamps: new Map<string, number[]>(),
    },
    subscription: {
      maxRequestsPerMinute: 25,
      timestamps: new Map<string, number[]>(),
    },
  };

  static initialize(firebaseConfig: Record<string, any>) {
    if (!this.app) {
      this.app = initializeApp(firebaseConfig);
      this.db = initializeFirestore(this.app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }
  }

  private static enforceRateLimit(
    category: keyof typeof FirestoreService.requestLimits,
    key?: string
  ): void {
    const now = Date.now();
    const limitConfig = FirestoreService.requestLimits[category];

    if (key) {
      if (!limitConfig.timestamps.has(key)) {
        limitConfig.timestamps.set(key, []);
      }
      const timestamps = limitConfig.timestamps.get(key)!;
      timestamps.push(now);
      limitConfig.timestamps.set(
        key,
        timestamps.filter((ts) => now - ts < 60000)
      );
      if (timestamps.length > limitConfig.maxRequestsPerMinute) {
        throw new Error(
          `Rate limit exceeded for ${category}: ${key}. Please try again later.`
        );
      }
    }
  }

  static async getDoc<T>(docPath: string): Promise<T | null> {
    this.enforceRateLimit("documentRead", docPath);
    const docSnap = await getDoc(doc(this.db, docPath));
    return docSnap.exists() ? (docSnap.data() as T) : null;
  }

  static async addDoc(
    collectionPath: string,
    data: Record<string, any>
  ): Promise<string> {
    this.enforceRateLimit("documentWrite", collectionPath);
    const docRef = await addDoc(collection(this.db, collectionPath), data);
    return docRef.id;
  }

  static async updateDoc(
    docPath: string,
    data: Record<string, any>
  ): Promise<void> {
    this.enforceRateLimit("documentWrite", docPath);
    await updateDoc(doc(this.db, docPath), data);
  }

  static async setDoc(
    docPath: string,
    data: Record<string, any>,
    merge = true
  ): Promise<void> {
    this.enforceRateLimit("documentWrite", docPath);
    await setDoc(doc(this.db, docPath), data, { merge });
  }

  static async deleteDoc(docPath: string): Promise<void> {
    this.enforceRateLimit("documentWrite", docPath);
    await deleteDoc(doc(this.db, docPath));
  }

  static subscribeToDoc<T>(
    docPath: string,
    callback: (data: T | null) => void
  ): () => void {
    this.enforceRateLimit("subscription", docPath);
    return onSnapshot(doc(this.db, docPath), (docSnap) => {
      callback(docSnap.exists() ? (docSnap.data() as T) : null);
    });
  }

  static async queryDocs<T>(queryInstance: Query): Promise<T[]> {
    this.enforceRateLimit("collectionRead");
    const snapshot = await getDocs(queryInstance);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
  }

  static async getCollection<T>(
    collectionPath: string,
    ...queryConstraints: QueryConstraint[]
  ): Promise<T[]> {
    this.enforceRateLimit("collectionRead", collectionPath);
    const snapshot = await getDocs(
      queryConstraints.length > 0
        ? query(collection(this.db, collectionPath), ...queryConstraints)
        : collection(this.db, collectionPath)
    );
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
  }

  static getFieldValue() {
    return { arrayUnion, arrayRemove };
  }

  static getTimestamp() {
    return Timestamp.now();
  }

  static deleteField() {
    return deleteField();
  }

  static createBatch() {
    this.enforceRateLimit("documentWrite");
    return writeBatch(this.db);
  }

  static getAuthUserId(): string | null {
    return getAuth().currentUser?.uid || null;
  }
}

// import { FirebaseApp, initializeApp } from "@firebase/app";
// import {
//   addDoc,
//   arrayRemove, // ✅ Fix missing import
//   arrayUnion,
//   collection,
//   deleteDoc,
//   deleteField,
//   doc,
//   Firestore,
//   getDoc,
//   getDocs,
//   initializeFirestore, // ✅ Fix missing import
//   onSnapshot, // ✅ Fix missing import
//   persistentLocalCache, // ✅ Fix missing import
//   persistentMultipleTabManager, // ✅ Fix missing import
//   query,
//   Query, // ✅ Fix missing imports
//   QueryConstraint,
//   setDoc,
//   Timestamp,
//   updateDoc, // ✅ Fix missing import
//   writeBatch,
// } from "firebase/firestore";
// import { getAuth, User } from "firebase/auth";

// export class FirestoreService {
//   private static app: FirebaseApp;
//   private static db: Firestore;

//   // Initialize Firebase app and Firestore
//   static initialize(firebaseConfig: Record<string, any>) {
//     if (!this.app) {
//       this.app = initializeApp(firebaseConfig);
//       this.db = initializeFirestore(this.app, {
//         localCache: persistentLocalCache({
//           tabManager: persistentMultipleTabManager(),
//         }),
//       });
//     }
//   }

//   private static requestTimestamps: number[] = [];
//   private static maxRequestsPerMinute = 500;
//   private static documentRequestLog: Map<string, number[]> = new Map();
//   private static collectionFetchRequestLog: Map<string, number[]> = new Map();
//   private static subscriptionRequestLog: Map<string, number[]> = new Map();
//   private static maxDocumentRequestsPerMinute = 30;
//   private static maxSubscriptionRequestsPerMinute = 30;
//   private static maxCollectionFetchRequestsPerMinute = 20;

//   private static logRequest(): void {
//     const now = Date.now();
//     FirestoreService.requestTimestamps.push(now);

//     // Remove timestamps older than 1 minute
//     FirestoreService.requestTimestamps.splice(
//       0,
//       FirestoreService.requestTimestamps.findIndex((ts) => now - ts < 60000)
//     );

//     if (
//       FirestoreService.requestTimestamps.length >
//       FirestoreService.maxRequestsPerMinute
//     ) {
//       throw new Error("Rate limit exceeded. Please try again later.");
//     }
//   }

//   private static logDocumentRequest(docPath: string): void {
//     const now = Date.now();
//     if (!FirestoreService.documentRequestLog.has(docPath)) {
//       FirestoreService.documentRequestLog.set(docPath, []);
//     }

//     const timestamps = FirestoreService.documentRequestLog.get(docPath)!;
//     timestamps.push(now);

//     // Remove timestamps older than 1 minute
//     FirestoreService.documentRequestLog.set(
//       docPath,
//       timestamps.filter((ts) => now - ts < 60000)
//     );

//     if (timestamps.length > FirestoreService.maxDocumentRequestsPerMinute) {
//       throw new Error(
//         `Rate limit exceeded for document: ${docPath}. Please try again later.`
//       );
//     }
//   }

//   static async getDocument<T>(docPath: string): Promise<T | null> {
//     FirestoreService.logDocumentRequest(docPath);
//     const docSnap = await getDoc(doc(this.db, docPath));
//     const data = docSnap.exists() ? (docSnap.data() as T) : null;
//     return data;
//   }

//   static async addDocument(
//     collectionPath: string,
//     data: Record<string, any>
//   ): Promise<string | undefined> {
//     FirestoreService.logRequest();
//     const docRef = await addDoc(collection(this.db, collectionPath), data);
//     return docRef.id;
//   }

//   static async updateDocument(
//     docPath: string,
//     data: Record<string, any>
//   ): Promise<void> {
//     FirestoreService.logRequest();
//     await updateDoc(doc(this.db, docPath), data);
//   }

//   static async setDocument(
//     docPath: string,
//     data: Record<string, any>,
//     merge: boolean = true // Default to true but allows overriding
//   ): Promise<void> {
//     FirestoreService.logRequest();
//     await setDoc(doc(this.db, docPath), data, { merge });
//   }

//   static async deleteDocument(docPath: string): Promise<void> {
//     FirestoreService.logRequest();
//     await deleteDoc(doc(this.db, docPath));
//   }

//   static subscribeToDocument<T>(
//     docPath: string,
//     callback: (data: T | null) => void
//   ): () => void {
//     FirestoreService.logRequest();
//     const unsubscribe = onSnapshot(doc(this.db, docPath), (docSnap) => {
//       const data = docSnap.exists() ? (docSnap.data() as T) : null;
//       callback(data);
//     });
//     return unsubscribe;
//   }

//   private static logSubscriptionRequest(subPath: string): void {
//     const now = Date.now();
//     if (!FirestoreService.subscriptionRequestLog.has(subPath)) {
//       FirestoreService.subscriptionRequestLog.set(subPath, []);
//     }

//     const timestamps = FirestoreService.subscriptionRequestLog.get(subPath)!;
//     timestamps.push(now);

//     // Remove timestamps older than 1 minute
//     FirestoreService.subscriptionRequestLog.set(
//       subPath,
//       timestamps.filter((ts) => now - ts < 60000)
//     );

//     if (timestamps.length > FirestoreService.maxSubscriptionRequestsPerMinute) {
//       throw new Error(
//         `Rate limit exceeded for subscription: ${subPath}. Please try again later.`
//       );
//     }
//   }

//   static subscribeToCollection<T>(
//     collectionPath: string,
//     callback: (data: T[]) => void
//   ): () => void {
//     FirestoreService.logSubscriptionRequest(collectionPath);
//     const unsubscribe = onSnapshot(
//       query(collection(this.db, collectionPath)),
//       (snapshot) => {
//         const data = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as T[];
//         callback(data);
//       }
//     );
//     return unsubscribe;
//   }

//   private static logCollectionFetchRequest(collectionPath: string): void {
//     const now = Date.now();
//     if (!FirestoreService.collectionFetchRequestLog.has(collectionPath)) {
//       FirestoreService.collectionFetchRequestLog.set(collectionPath, []);
//     }

//     const timestamps =
//       FirestoreService.collectionFetchRequestLog.get(collectionPath)!;
//     timestamps.push(now);

//     // Remove timestamps older than 1 minute
//     FirestoreService.collectionFetchRequestLog.set(
//       collectionPath,
//       timestamps.filter((ts) => now - ts < 60000)
//     );

//     if (
//       timestamps.length > FirestoreService.maxCollectionFetchRequestsPerMinute
//     ) {
//       throw new Error(
//         `Rate limit exceeded for collection fetch: ${collectionPath}. Please try again later.`
//       );
//     }
//   }

//   static async fetchCollection<T>(
//     path: string,
//     ...queryConstraints: QueryConstraint[]
//   ): Promise<T[]> {
//     FirestoreService.logCollectionFetchRequest(path);
//     const snapshot = await getDocs(
//       queryConstraints.length > 0
//         ? query(collection(this.db, path), ...queryConstraints)
//         : collection(this.db, path)
//     );
//     return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
//   }

//   static async copyCollection(
//     sourceCollectionPath: string,
//     targetCollectionPath: string
//     //   firestore: db
//   ): Promise<void> {
//     const sourceCollectionRef = collection(this.db, sourceCollectionPath);
//     const sourceColSnapshot = await getDocs(sourceCollectionRef);

//     if (sourceColSnapshot.empty) {
//       console.log("No matching documents.");
//       return;
//     }

//     const batch = writeBatch(this.db);

//     sourceColSnapshot.docs.forEach((docSnap) => {
//       const targetDocRef = doc(
//         this.db,
//         targetCollectionPath + "/" + docSnap.id
//       ); // Keeping the same document ID
//       batch.set(targetDocRef, docSnap.data());
//     });

//     await batch.commit();
//     console.log(
//       `Successfully copied ${sourceColSnapshot.size} documents from ${sourceCollectionPath} to ${targetCollectionPath}.`
//     );
//   }

//   static getFieldValue() {
//     return { arrayUnion, arrayRemove };
//   }

//   // Add the getTimestamp method
//   static getTimestamp() {
//     return Timestamp.now();
//   }

//   static deleteField() {
//     return deleteField(); // Use deleteField directly
//   }

//   static getBatch() {
//     FirestoreService.logRequest();
//     return writeBatch(this.db);
//   }

//   // Get the authenticated user's ID
//   //
//   static getAuthUserId(): string | null {
//     const auth = getAuth();
//     const user: User | null = auth.currentUser;
//     return user ? user.uid : null;
//   }

//   /**
//    * Get a reference to a Firestore collection.
//    * @param collectionPath The path to the collection
//    * @returns The Firestore collection reference
//    */
//   static getCollectionRef(collectionPath: string) {
//     return collection(this.db, collectionPath);
//   }

//   /**
//    * Execute a Firestore query and return the results.
//    * @param queryInstance The Firestore query instance
//    * @returns A promise resolving to an array of documents
//    */
//   static async executeQuery<T>(queryInstance: Query): Promise<T[]> {
//     const snapshot = await getDocs(queryInstance);
//     return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];
//   }
// }

// export default FirestoreService;
