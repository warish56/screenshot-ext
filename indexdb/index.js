
export default class Database{

    dbResolver;
    dbRejecter;

    db;
    dbName;

    tableDetails={}

    constructor(dbName, dbVersion){
        this.dbName = dbName;
        this.dbVersion = dbVersion;
    }

    async createOrGetTable(tableName, keyPath){
        return new Promise((resolve, reject) => {   
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (event) => {
                console.log("===DB Open error ===", event);
                reject(event);
            };
            request.onsuccess  = () => {
                this.db = request.result;
                this.tableDetails = {
                    ...this.tableDetails,
                    tableName,
                    keyPath
                };
                if (this.db.objectStoreNames.contains(tableName)) {
                    resolve(this.db);
                    return;
                }
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log("===DB Upgrade needed ===", {event,names:db.objectStoreNames});
                this.tableDetails = {
                    ...this.tableDetails,
                    tableName,
                    keyPath
                };

                if (db.objectStoreNames.contains(tableName)) {
                    resolve(this.db);
                    return;
                }

                const objectStore = db.createObjectStore(tableName, { keyPath });
                objectStore.transaction.oncomplete= () => {
                    resolve(this.db);
                }
            };
        })
    }
    


    async getDb(){
        console.log("===getDb ===", this.db);
        if(this.db){
            return this.db;
        }
        return this.createOrGetTable(this.tableDetails.tableName, this.tableDetails.keyPath);
    }

    async add(data){
        return new Promise((resolve, reject) => {
            const process = async () => {
                const db = await this.getDb();
                const transaction = db.transaction(this.tableDetails.tableName, 'readwrite');
                const store = transaction.objectStore(this.tableDetails.tableName);
                store.add(data).onsuccess = () => {
                    resolve(true);
                }
            }
            process();
        })
    }

    async clearTable(key){
        return new Promise((resolve, reject) => {
            const process = async () => {
                const db = await this.getDb();
                const transaction = db.transaction(this.tableDetails.tableName, 'readwrite');
                const store = transaction.objectStore(this.tableDetails.tableName);
                store.clear(key).onsuccess = () => {
                    resolve(true);
                }
            }
            process();
        })
    } 
    
    async getAllValues(){
        return new Promise((resolve, reject) => {
            const process = async () => {
                const values = [];
                const db = await this.getDb();
                const transaction = db.transaction(this.tableDetails.tableName, 'readwrite');
                const store = transaction.objectStore(this.tableDetails.tableName);
                const cursor = store.openCursor();
                cursor.onsuccess = (event) => {
                    const rowCursor = event.target.result;
                    if (rowCursor) {
                        values.push(rowCursor.value);
                        rowCursor.continue();
                    } else {
                        resolve(values);
                    }
                }
            }
            process();
        })
    }


    async deleteValue(key){
        return new Promise((resolve, reject) => {
            const process = async () => {
                const db = await this.getDb();
                const transaction = db.transaction(this.tableDetails.tableName, 'readwrite');
                const store = transaction.objectStore(this.tableDetails.tableName);
                store.delete(key).onsuccess = () => {
                    resolve(true);
                }
            }
            process();
        })
    }


   
}