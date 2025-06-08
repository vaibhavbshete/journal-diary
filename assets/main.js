document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content loaded') 
    /**
     * @type {IDBDatabase | null}
     */
    let db
    let notesUl = document.getElementById('notesList')
   
    let subBtn = document.getElementById('subBtn')
    let noteInp = document.getElementById('noteInp')
    let startInp = document.getElementById('startInp')
    let formDateButton = document.getElementById('formDateBtn')
    let noteTemplate = document.getElementById('noteTemplate')
    let emptyNotesTemplate = document.getElementById('noNotesTemp')
    
    formDateButton.addEventListener('click', () => startInp.showPicker())
    startInp.addEventListener('change', displayFormDateTime)
    subBtn.addEventListener('click', () => {
        let noteVal = noteInp.value
        let startValParts = getDateParts(new Date(startInp.value))
        let startVal = startValParts.year + '-' + startValParts.month.padStart(2, '0') + '-' + startValParts.date.padStart(2, '0')
        addNote(noteVal, startVal)
        // displayNotes()
        resetForm()
        displayFormDateTime()
    })

    resetForm()
    displayFormDateTime()
    
    let connResult = window.indexedDB.open('notes',2)
    console.log('init done',connResult);

    connResult.onupgradeneeded = (ev) => {
        console.log('upgrade needed') 
        db = ev.target.result
        window.db = db
        const oldVersion = ev.oldVersion
        const newVersion = ev.newVersion || db.version
        db.onerror = (errorEv) => {
            console.error('Error caught on db');
            console.error(errorEv.target.error?.message); 
        };
        if (oldVersion < newVersion) {
            console.log(`db version upgrading from ${oldVersion} to ${newVersion}`);
        }
        if (!db.objectStoreNames.contains('notes')) {
            // this is the first time this is being created
            // as good as if checked newVersion == 1
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
            /** @type {IDBTransaction} */
            const transaction = ev.target.transaction
            let oldStore = transaction.objectStore('notes')
            // let cursorReq = oldStore.openCursor()
            let cursorReq = oldStore.index('start_time').openCursor(null,'next')
            let newEntry = {}
            let allNewEntries = []
            cursorReq.onsuccess = (evt) => {
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
        }

       
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

    /**
     * 
     * @param {*} str 
     * @returns string
     * @description Replaces line-breaks (\n, \r, \r\n) with <br> in string.
     * Coerces to string if not already a string.
     * @example
     * nl2br('Hello\nWorld!') // returns 'Hello<br>World!'
     */
    function nl2br(str) {
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
    }

    function createNoteLi(noteText, date, noteId) {
        const listItemDocFrag = noteTemplate.content.cloneNode(true)
        const listItem = listItemDocFrag.children[0]
        const closeBtn = listItem.querySelector('button[data-close]')
        const textHolder = listItem.querySelector('div[data-note-text]')
        const weekDayHolder = listItem.querySelector('[data-weekday]')
        const monthDayHolder = listItem.querySelector('[data-day]')
        const monthHolder = listItem.querySelector('[data-month]')
        const yearHolder = listItem.querySelector('[data-year]')
        
        const dateTimeWrapper = listItem.querySelector('[data-date-time-wrapper]')
        textHolder && (textHolder.innerHTML = noteText);

        const noteDate = new Date(date)
        let currentDateParts = getDateParts(noteDate)
        monthDayHolder && (monthDayHolder.innerHTML = currentDateParts.date )
        monthHolder && (monthHolder.innerHTML = (currentDateParts.month ) )
        weekDayHolder && (weekDayHolder.innerHTML = currentDateParts.weekday)
        yearHolder && (yearHolder.innerHTML = currentDateParts.year)
        
        dateTimeWrapper && (dateTimeWrapper.dateTime = noteDate.toISOString())
        closeBtn.dataset.noteId = noteId;
        closeBtn.addEventListener('click', (ev) => deleteNote(ev));        

        return listItem
    }

    function insertNoteLi(noteText, date, noteId, appendAtEnd = true) {
        const noteLi = createNoteLi(noteText,date,noteId)
        // Put the list item inside the task list
        if (!noteLi.children.length || appendAtEnd) {
            notesUl.appendChild(noteLi);
            return
        }
        // if there are other lis, determine where to put the new one first
        let displayedDates = [...notesUl.children].map(el => el.querySelector('time[data-date-time-wrapper]').dateTime)
        let toDisplayNoteDate = new Date(date).toISOString()
        displayedDates.push(toDisplayNoteDate)
        displayedDates.sort()
        let toDisplayNoteIndex = displayedDates.indexOf(toDisplayNoteDate)
        if (toDisplayNoteIndex == noteLi.children.length) {
            notesUl.appendChild(noteLi);
            return
        }
        // means it's got a next li, which is sitting at its to-be index
        const nextNoteLi = notesUl.children[toDisplayNoteIndex]
        notesUl.insertBefore(noteLi, nextNoteLi)
        return noteLi
    }

    function displayNotes() {
        // clear existing notes first
        while (notesUl.firstChild) {
            notesUl.removeChild(notesUl.firstChild);
        }
        
        let countRes = db.transaction('notes').objectStore('notes').count()
        countRes.onsuccess = (event) => {
            console.log('count', event.target.result);
            if (event.target.result == 0) {
                let emptyNotesLi = emptyNotesTemplate.content.cloneNode(true)
                notesUl.appendChild(emptyNotesLi)
            }
            else {
                
                
                const objectStore = db.transaction('notes').objectStore('notes');
                const request = objectStore.index("date").openCursor(null, "next" )
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    // Check if there are no (more) cursor items to iterate through
                    if (!cursor) {
                        // No more items to iterate through, we quit.
                        console.log('All entries displayed.');
                        return;
                    }
                
                    // Check which suffix the deadline day of the month needs
                    const { date, note } = cursor.value;
                
                    
        
                    // Build the entry and put it into the list item.
                    const noteText = nl2br(note)
                    // const noteText =  `${nt}`;
                    insertNoteLi(noteText, date, cursor.primaryKey)
                    
        
        
                    // continue on to the next item in the cursor
                    cursor.continue();
                };
            }
        }
  
    }

    function addNote(text, start) {
        if(text === '' || start === '') {
            return
        }
        const objectStore = db.transaction('notes', 'readwrite').objectStore('notes');
        let addreq = objectStore.add({
            date: start,
            note: text
        });
        addreq.onerror = (ev) => {
            console.error('Error adding note:',ev.target.error?.message);
        }
        addreq.onsuccess = (successEv) => {
            console.log('sucess', successEv.target)
            const noteId = successEv.target.result
            console.log('Note added successfully. ID:', noteId);
            
            const insertedNoteLi = insertNoteLi(nl2br(text), start, noteId, false)
            if(insertedNoteLi.scrollIntoView) {
                insertedNoteLi.scrollIntoView({ behavior: 'smooth' })
            }
            else {
                console.log('insertedNoteLi',insertedNoteLi);
            }
        }

    }

    function deleteNote(ev) {
        const noteId = Number( ev.target.dataset.noteId )
        // console.log(noteId);
        const transaction = db.transaction(['notes'], 'readwrite');
        // console.log(transaction);
        const delres = transaction.objectStore('notes').delete(noteId)
        // console.log('delres',delres);
        const parentElement = ev.target.parentElement
        delres.onsuccess = (event) => {
            console.log('delres',event);
            console.log('Note deleted successfully.');
            parentElement.remove();
        }
        transaction.oncomplete = ((event) => {
            console.log('transaction complete',event);
            return 
        })
        transaction.onerror = ((event) => {
            console.error('delete transaction error',event.target);
            console.log('Error deleting note.');
        })
        transaction.onabort = ((event) => {
            console.error('delete transaction aborted',event.target.error);
            console.log('Error deleting note.');
        })

    }

    function createListItem(contents) {
        const listItem = document.createElement('li');
        listItem.textContent = contents;
        return listItem;
    };

    function resetForm() {
        noteInp.value = ''
        
        let dt = new Date()
        let dp = getDateParts(dt)
        startInp.value = dp.ymd
    }

    function displayFormDateTime() {

        let enteredDate = startInp.value!='' ? (new Date(startInp.value)) : (new Date())
        // console.log(enteredDate);
        let monthDayDisplay = document.querySelector('[data-form-display="date"]')
        let monthDisplay = document.querySelector('[data-form-display="month"]')
        let weekDayDisplay = document.querySelector('[data-form-display="weekday"]')

        let formDateParts = getDateParts(enteredDate)
        monthDayDisplay && (monthDayDisplay.innerText = formDateParts.date)
        weekDayDisplay && (weekDayDisplay.innerText = formDateParts.weekday)
        monthDisplay && (monthDisplay.innerText = formDateParts.month)
        
    }

    /**
     * Returns date parts as object
     * @param {Date} date 
     * @returns {Object} {date, month, weekday, year, ymd}
     */
    function getDateParts(date) {
        let dateParts = {
            date: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleString('en-US', { month: 'short' }),
            weekday: date.toLocaleString('en-US', { weekday: 'short' }),
            year: date.getFullYear()
        }
        dateParts.ymd = dateParts.year + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + dateParts.date.padStart(2, '0')
        return dateParts
    }
        
})





