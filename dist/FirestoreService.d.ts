import { arrayRemove, // ✅ Fix missing import
arrayUnion, Query, // ✅ Fix missing imports
QueryConstraint, Timestamp } from "firebase/firestore";
export declare class FirestoreService {
    private static app;
    private static db;
    static initialize(firebaseConfig: Record<string, any>): void;
    private static requestTimestamps;
    private static maxRequestsPerMinute;
    private static documentRequestLog;
    private static collectionFetchRequestLog;
    private static subscriptionRequestLog;
    private static maxDocumentRequestsPerMinute;
    private static maxSubscriptionRequestsPerMinute;
    private static maxCollectionFetchRequestsPerMinute;
    private static logRequest;
    private static logDocumentRequest;
    static getDocument<T>(docPath: string): Promise<T | null>;
    static addDocument(collectionPath: string, data: Record<string, any>): Promise<string | undefined>;
    static updateDocument(docPath: string, data: Record<string, any>): Promise<void>;
    static setDocument(docPath: string, data: Record<string, any>, merge?: boolean): Promise<void>;
    static deleteDocument(docPath: string): Promise<void>;
    static subscribeToDocument<T>(docPath: string, callback: (data: T | null) => void): () => void;
    private static logSubscriptionRequest;
    static subscribeToCollection<T>(collectionPath: string, callback: (data: T[]) => void): () => void;
    private static logCollectionFetchRequest;
    static fetchCollection<T>(path: string, ...queryConstraints: QueryConstraint[]): Promise<T[]>;
    static copyCollection(sourceCollectionPath: string, targetCollectionPath: string): Promise<void>;
    static getFieldValue(): {
        arrayUnion: typeof arrayUnion;
        arrayRemove: typeof arrayRemove;
    };
    static getTimestamp(): Timestamp;
    static deleteField(): import("@firebase/firestore").FieldValue;
    static getBatch(): import("@firebase/firestore").WriteBatch;
    static getAuthUserId(): string | null;
    /**
     * Get a reference to a Firestore collection.
     * @param collectionPath The path to the collection
     * @returns The Firestore collection reference
     */
    static getCollectionRef(collectionPath: string): import("@firebase/firestore").CollectionReference<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>;
    /**
     * Execute a Firestore query and return the results.
     * @param queryInstance The Firestore query instance
     * @returns A promise resolving to an array of documents
     */
    static executeQuery<T>(queryInstance: Query): Promise<T[]>;
}
export default FirestoreService;
