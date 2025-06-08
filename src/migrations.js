export function runmigrations(db, transaction, oldVersion, newVersion) {
    if (oldVersion < newVersion) {
            console.log(`db version upgrading from ${oldVersion} to ${newVersion}`);
        }
        if (!db.objectStoreNames.contains('notes')) {
            // this is the first time this is being created
            // as good as if checked newVersion == 1
            console.log('if ! contains notes');

            let notesObjStr = db.createObjectStore('notes', {
                keyPath: 'id',
                keyGenerator: true,
                autoIncrement: true
            })
            
            notesObjStr.createIndex('start_time','start_time',{unique:false})
            notesObjStr.createIndex('end_time','end_time',{unique:false})
            notesObjStr.createIndex('note','note',{unique:false})
        }
        if (oldVersion < 2) {
            console.log('if < 2');
            
            /** @type {IDBTransaction} */
            // const transaction = ev.target.transaction
            let oldStore = transaction.objectStore('notes')
            let countReq = oldStore.count()
            countReq.onsuccess = (ev) => {
                if (ev.target.result > 0) {
                    
                    // let cursorReq = oldStore.openCursor()
                    let cursorReq = oldStore.index('start_time').openCursor(null,'next')
                    let newEntry = {}
                    let allNewEntries = []
                    cursorReq.onsuccess = (evt) => {
                        console.log('2 cursor req success');
                        
                        /** @type {IDBCursor | null} */
                        const cursor = evt.target.result
                        if (!cursor) {
                            allNewEntries.push(newEntry)
                            // console.log('new entries',allNewEntries);
                            // delete old store
                            oldStore.clear()
                            oldStore.deleteIndex('start_time')
                            oldStore.deleteIndex('end_time')
                            oldStore.createIndex('date','date',{unique:true})
                         
                            // add new entries
                            allNewEntries.forEach(ent => {
                                console.log(ent.date, ent.note);
                                oldStore.add(ent)
                            })
        
                            // displayNotes()
                            return;
                        }
                        const { start_time, end_time, note } = cursor.value;
                        console.log('currOldEnt',start_time, end_time, note);
                        let currOldEntryStrt = new Date(start_time)
                        let currOldEntTime = currOldEntryStrt.toLocaleTimeString()
        
                        if (newEntry.date) {
                            // console.log('e');
                            let dt = new Date(newEntry.date)
                            console.log(getDateParts( dt).ymd ,getDateParts( currOldEntryStrt).ymd);
                            if (getDateParts( dt).ymd != getDateParts( currOldEntryStrt).ymd ) {
                                // cursor.update(newEntry)
                                allNewEntries.push(newEntry)
                                newEntry = {}
                                newEntry.date = getDateParts(currOldEntryStrt).ymd // .toISOString().slice(0,10)
                                newEntry.note = currOldEntTime + "-----\n" + note
                            }
                            else {
                                newEntry.note = newEntry.note + "\n\n" + currOldEntTime + "-----\n" + note
                            }
                        }
                        else {
                            newEntry.date = getDateParts(currOldEntryStrt).ymd //.toISOString().slice(0,10)
                            newEntry.note = currOldEntTime + "-----\n" + note
                        }
                    
                        cursor.continue()
                    }
                    cursorReq.onerror = (ev) => {
                        console.log(ev);
                        
                        let transaction = ev.target.transaction;
                        let oldStore = transaction.objectStore('notes')
                        oldStore.deleteIndex('start_time')
                            oldStore.deleteIndex('end_time')
                            oldStore.createIndex('date','date',{unique:true})
                    }
                }
                else{
                     oldStore.deleteIndex('start_time')
                            oldStore.deleteIndex('end_time')
                            oldStore.createIndex('date','date',{unique:true})
                }
                console.log(ev.target.result);
            }
            countReq.onerror = (ev) => {
                console.error(ev);
                
            }
            console.log(oldStore.indexNames);
            
        }
        if (oldVersion < 3) {
            console.log('if < 3');
          
            // const transaction = ev.target.transaction
            /** @type {IDBObjectStore} */
            let oldStore = transaction.objectStore('notes')
            console.log(oldStore.indexNames);

            let countReq = oldStore.count()
            countReq.onsuccess = (ev) => {
                if (ev.target.result > 0) {
                    // let cursorReq = oldStore.openCursor()
                    let cursorReq = oldStore.index('date').openCursor(null,'next')
                    let allNewEntries = []
                   
                    cursorReq.onsuccess = (evt) => {
                        /** @type {IDBCursor | null} */
                        const cursor = evt.target.result
                        if (!cursor) {
                            // allNewEntries.push(newEntry)
                            // console.log('new entries',allNewEntries);
                            // delete old store
                            oldStore.clear()
                            oldStore.deleteIndex('date')
                            oldStore.createIndex('start_time','start_time',{unique:true})
                         
                            // add new entries
                            allNewEntries.forEach(ent => {
                                // console.log(ent.date, ent.note);
                                oldStore.add(ent)
                            })
        
                            // displayNotes()
                            return;
                        }
                        const { date, note } = cursor.value;
                        // console.log('currOldEnt',start_time, end_time, note);
                        let currOldEntryStrt = new Date(date)
                        let currOldEntTime = currOldEntryStrt.toLocaleTimeString()
                        let newEntry = {}
                        newEntry.start_time = currOldEntryStrt.toISOString() //.toISOString().slice(0,10)
                        newEntry.note = currOldEntTime + "-----\n" + note
                        allNewEntries.push(newEntry)
                        if (newEntry.date) {
                            // console.log('e');
                            let dt = new Date(newEntry.date)
                            console.log(getDateParts( dt).ymd ,getDateParts( currOldEntryStrt).ymd);
                            if (getDateParts( dt).ymd != getDateParts( currOldEntryStrt).ymd ) {
                                // cursor.update(newEntry)
                                allNewEntries.push(newEntry)
                                newEntry = {}
                                newEntry.date = getDateParts(currOldEntryStrt).ymd // .toISOString().slice(0,10)
                                newEntry.note = currOldEntTime + "-----\n" + note
                            }
                            else {
                                newEntry.note = newEntry.note + "\n\n" + currOldEntTime + "-----\n" + note
                            }
                        }
                        else {
                           
                        }
                    
                        cursor.continue()
                    }
                }
                else {
                    oldStore.deleteIndex('date')
                            oldStore.createIndex('start_time','start_time',{unique:true})
                }
            }
            
        }
}