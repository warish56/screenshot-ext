import { 
    ActionTypes, 
    waitForMessage, 
    FILE_FORMAT,
    blobToBase64,
    DbData,
    MAX_HISTORY_ITEMS
} from '../utils.js';
import Database from '../indexdb/index.js';


export const addToHistory = async (blobs=[]) => {
  try{
    const allHistory = await getAllHistory();
    if(allHistory.length >= MAX_HISTORY_ITEMS){
      return;
    }
    const db = new Database(DbData.dbName, DbData.dbVersion);
    await db.createOrGetTable(DbData.tables.history.tableName, DbData.tables.history.keyPath);

    const history = [];
    for(let i = 0; i < blobs.length; i++){
      const base64 = await blobToBase64(blobs[i]);
      const data = {
        imageData: `data:image/${FILE_FORMAT};base64,${base64}`,
        id: Date.now()
      }
      history.push(data);
      await db.add(data);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await waitForMessage(tab.id, {action: ActionTypes.EXT_HISTORY_UPDATED, data: history });
  } catch(err){
    console.error("Error adding to history:", err);
  }
}

export const getAllHistory = async () => {
  const db = new Database(DbData.dbName, DbData.dbVersion);
  await db.createOrGetTable(DbData.tables.history.tableName, DbData.tables.history.keyPath);
  return db.getAllValues();
}

export const getHistory = async (screenshotId) => {
  const db = new Database(DbData.dbName, DbData.dbVersion);
  await db.createOrGetTable(DbData.tables.history.tableName, DbData.tables.history.keyPath);
  return db.getValue(screenshotId);
}


export const clearHistory = async () => {
  const db = new Database(DbData.dbName, DbData.dbVersion);
  await db.createOrGetTable(DbData.tables.history.tableName, DbData.tables.history.keyPath);
  await db.clearTable(DbData.tables.history.tableName);
}

export const deleteHistoryItem = async (id) => {
  const db = new Database(DbData.dbName, DbData.dbVersion);
  await db.createOrGetTable(DbData.tables.history.tableName, DbData.tables.history.keyPath);
  await db.deleteValue(id);
}
