import { arrayRemove, arrayUnion, Query, QueryConstraint, Timestamp } from "firebase/firestore";
export default class FirestoreService {
    private static app;
    private static db;
    private static requestLimits;
    static initialize(firebaseConfig: Record<string, any>): void;
    private static enforceRateLimit;
    static getDoc<T>(docPath: string): Promise<T | null>;
    static addDoc(collectionPath: string, data: Record<string, any>): Promise<string>;
    static updateDoc(docPath: string, data: Record<string, any>): Promise<void>;
    static setDoc(docPath: string, data: Record<string, any>, merge?: boolean): Promise<void>;
    static deleteDoc(docPath: string): Promise<void>;
    static subscribeToDoc<T>(docPath: string, callback: (data: T | null) => void): () => void;
    static subscribeToCollection<T>(collectionPath: string, callback: (data: T[]) => void): () => void;
    static queryDocs<T>(queryInstance: Query): Promise<T[]>;
    static getCollection<T>(collectionPath: string, ...queryConstraints: QueryConstraint[]): Promise<T[]>;
    static getFieldValue(): {
        arrayUnion: typeof arrayUnion;
        arrayRemove: typeof arrayRemove;
    };
    static getTimestamp(): Timestamp;
    static deleteField(): import("@firebase/firestore").FieldValue;
    static createBatch(): import("@firebase/firestore").WriteBatch;
    static getAuthUserId(): string | null;
}
