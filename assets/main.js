document.addEventListener('DOMContentLoaded', () => {

    var db
    let notesUl = document.getElementById('notesList')
    let logUl = document.getElementById('logList')
    let subBtn = document.getElementById('subBtn')
    let noteInp = document.getElementById('noteInp')
    let startInp = document.getElementById('startInp')
    let noteTemplate = document.getElementById('noteTemplate')

    let connResult = window.indexedDB.open('notes')

    addLog('items loaded') 
    resetForm()
    connResult.onupgradeneeded = (ev) => {
        addLog('creating db') 
        db = connResult.result
        let notesObjStr = db.createObjectStore('notes', {
            keyPath: 'id',
            keyGenerator: true,
            autoIncrement: true
        })
        db.onerror = (event) => {
            addLog('Error loading database.');
        };
        notesObjStr.createIndex('start_time','start_time',{unique:false})
        notesObjStr.createIndex('end_time','end_time',{unique:false})
        notesObjStr.createIndex('note','note',{unique:false})
    }

    connResult.onsuccess = (ev) => {
        db = connResult.result
        displayNotes() 
    }


    subBtn.addEventListener('click', () => {
        let noteVal = noteInp.value
        let startVal = startInp.value
        addNote(noteVal, startVal)
        displayNotes()
        resetForm()
    })
    function deleteNote(ev) {
        const noteId = Number( ev.target.dataset.noteId )
        // console.log(noteId);
        const transaction = db.transaction(['notes'], 'readwrite');
        // console.log(transaction);
        const delres = transaction.objectStore('notes').delete(noteId)
        // console.log('delres',delres);
        const parentElement = ev.target.parentElement
        delres.onsuccess = (ev) => {
            // console.log('compl',ev);
            displayNotes()
        }
        // transaction.oncomplete = ((event) => {
        //     event.target.parentElement.remove();
        // })
        // addLog('Error deleting note.');

    }
    function displayNotes() {
        // clear existing notes first
        while (notesUl.firstChild) {
            notesUl.removeChild(notesUl.firstChild);
        }
        

        const objectStore = db.transaction('notes').objectStore('notes');
        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            // Check if there are no (more) cursor items to iterate through
            if (!cursor) {
                // No more items to iterate through, we quit.
                addLog('Entries all displayed.');
                return;
            }
        
            // Check which suffix the deadline day of the month needs
            const { start_time, end_time, note } = cursor.value;
        
            

            // Build the to-do list entry and put it into the list item.
            let nt = (note + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
            const noteText =  `${nt}`;
            // const listItem = createListItem(noteText);
            const listItem = noteTemplate.content.cloneNode(true)
            // console.log(listItem);
            // listItem.append
            const closeBtn = listItem.querySelector('button[data-close]')
            // console.log(closeBtn);
            const textHolder = listItem.querySelector('div[data-note-text]')
            const dateHolder = listItem.querySelector('[data-datetime]')
            textHolder.innerHTML = noteText;
            dateHolder.innerHTML = (new Date(start_time).toLocaleDateString());
            // const note
            // closeBtn.innerHTML = '&times;';
            // closeBtn.classList.add('close');
            closeBtn.dataset.noteId = cursor.primaryKey;
            closeBtn.addEventListener('click', (ev) => {
                deleteNote(ev);
            });
            // listItem.prepend(closeBtn);


            // Put the item item inside the task list
            notesUl.appendChild(listItem);


            // continue on to the next item in the cursor
            cursor.continue();
        };
  
    }

   

    function addNote(text, start) {
        if(text === '' || start === '') {
            return
        }
        const objectStore = db.transaction('notes', 'readwrite').objectStore('notes');
        objectStore.add({
            start_time: start,
            end_time: start,
            note: text
        });

    
    }

    function clearInputs() {
        noteInp.value = ''
        startInp.value = ''

    }

    function addLog(text) {
        logUl.appendChild(createListItem(text)); 
    }

    function createListItem(contents) {
        const listItem = document.createElement('li');
        listItem.innerHTML = contents;
        return listItem;
    };

    function resetForm() {
        noteInp.value = ''
        startInp.value = new Date().toISOString().slice(0, 16) // 2024-07-20T10:00
    }
})





