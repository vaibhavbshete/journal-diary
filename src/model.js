import { runmigrations } from "./migrations";
import { displayNotes } from "./ui";
/**
 * @type {IDBDatabase | null}
 */
export var db 
export function addNote(text, start, onsuccess) {
    if(text === '' || start === '') {
        return
    }
    console.log(text,start);
    
    const objectStore = db.transaction('notes', 'readwrite').objectStore('notes');
    let addreq = objectStore.add({
        start_time: start,
        note: text
    });
    addreq.onerror = (ev) => {
        console.error('Error adding note:',ev.target.error?.message);
    }
    addreq.onsuccess = (successEv) => {
        console.log('sucess', successEv.target)
        const noteId = successEv.target.result
        console.log('Note added successfully. ID:', noteId);
        
        onsuccess(noteId)
    }

}

export function initdb() {
    let connResult = window.indexedDB.open('notes',3)
    console.log('init done',connResult);

    connResult.onupgradeneeded = (ev) => {
        console.log('upgrade needed') 
        db = ev.target.result
        window.db = db
        const oldVersion = ev.oldVersion
        const newVersion = ev.newVersion || db.version
        const transaction = ev.target.transaction
        db.onerror = (errorEv) => {
            console.error('Error caught on db');
            console.error(errorEv.target.error?.message); 
        };
        runmigrations(db, transaction, oldVersion, newVersion);

       
    }
    connResult.onsuccess = (ev) => {
        db = ev.target.result
        window.db = db
        displayNotes() 
        console.log('db ready');
        
    }

    connResult.onerror = (event) => {
        console.error('Error loading database',event.target.error);
    }
}