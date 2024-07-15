document.addEventListener('DOMContentLoaded', () => {

    var db
    let notesUl = document.getElementById('notesList')
    let logUl = document.getElementById('logList')
    let subBtn = document.getElementById('subBtn')
    let noteInp = document.getElementById('noteInp')
    let startInp = document.getElementById('startInp')

    let connResult = window.indexedDB.open('notes')


    connResult.onupgradeneeded = (ev) => {
        db = connResult.result
        let notesObjStr = db.createObjectStore('notes', {
            keyPath: id,
            keyGenerator: true
        })
        db.onerror = (event) => {
            logUl.appendChild(createListItem('Error loading database.'));
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
    })

    function displayNotes() {
    // clear existing notes first
    while (notesUl.firstChild) {
        notesUl.removeChild(notesUl.firstChild);
    }

    const objectStore = db.transaction('toDoList').objectStore('toDoList');
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
      const noteText = `${note}`;
      const listItem = createListItem(noteText);


      // Put the item item inside the task list
      notesUl.appendChild(listItem);


      // continue on to the next item in the cursor
      cursor.continue();
    };
  
}

function addNote(text, start) {

    const objectStore = db.transaction('toDoList', 'readwrite').objectStore('toDoList');
    objectStore.add({
        start_time: start,
        end_time: start,
        note: text
    });

    
}

function addLog(text) {
    logUl.appendChild(createListItem(text)); 
}

function createListItem(contents) {
    const listItem = document.createElement('li');
    listItem.textContent = contents;
    return listItem;
};
})





