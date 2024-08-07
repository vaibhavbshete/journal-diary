document.addEventListener('DOMContentLoaded', () => {
    addLog('DOM Content loaded') 
    var db
    let notesUl = document.getElementById('notesList')
   
    let subBtn = document.getElementById('subBtn')
    let noteInp = document.getElementById('noteInp')
    let startInp = document.getElementById('startInp')
    let formDateButton = document.getElementById('formDateBtn')
    let noteTemplate = document.getElementById('noteTemplate')
    let emptyNotesTemplate = document.getElementById('noNotesTemp')

    let connResult = window.indexedDB.open('notes')

    formDateButton.addEventListener('click',()=> startInp.showPicker())
    startInp.addEventListener('change', displayFormDateTime)

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

    
    resetForm()
    displayFormDateTime()
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
        displayFormDateTime()
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
        
        let countRes = db.transaction('notes').objectStore('notes').count()
        countRes.onsuccess = (event) => {
            console.log('count', event.target.result);
            if (event.target.result == 0) {
                let emptyNotesLi = emptyNotesTemplate.content.cloneNode(true)
                notesUl.appendChild(emptyNotesLi)
            }
            else {
                
                
                const objectStore = db.transaction('notes').objectStore('notes');
                const request = objectStore.index("start_time").openCursor(null, "next" )
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    // Check if there are no (more) cursor items to iterate through
                    if (!cursor) {
                        // No more items to iterate through, we quit.
                        addLog('All entries displayed.');
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
                    const weekDayHolder = listItem.querySelector('[data-weekday]')
                    const monthDayHolder = listItem.querySelector('[data-day]')
                    const monthHolder = listItem.querySelector('[data-month]')
                    const yearHolder = listItem.querySelector('[data-year]')
                    
                    const dateTimeWrapper = listItem.querySelector('[data-date-time-wrapper]')
                    textHolder && (textHolder.innerHTML = noteText);
        
                    let currentDateParts = getDateParts(new Date(start_time))
                    monthDayHolder && (monthDayHolder.innerHTML = currentDateParts.date )
                    monthHolder && (monthHolder.innerHTML = (currentDateParts.month ) )
                    weekDayHolder && (weekDayHolder.innerHTML = currentDateParts.weekday)
                    yearHolder && (yearHolder.innerHTML = currentDateParts.year)
                    
                    dateTimeWrapper && (dateTimeWrapper.dateTime = new Date(start_time).toISOString())
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
        }
  
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
        let logUl = document.getElementById('logList')
        logUl.appendChild(createListItem(text)); 
    }

    function createListItem(contents) {
        const listItem = document.createElement('li');
        listItem.innerHTML = contents;
        return listItem;
    };

    function resetForm() {
        noteInp.value = ''
        
        let dt = new Date()
        let dtStr = dt.getFullYear() + '-' + ((dt.getMonth() + 1).toString().padStart(2, '0')) + '-' + dt.getDate().toString().padStart(2,0) + 'T' + (dt.getHours().toString().padStart(2, '0')) + ':' + (dt.getMinutes().toString().padStart(2, '0'))
        // console.log(dtStr);
        startInp.value = dtStr
    }

    /**
     * Formats date to an epic readable format, like in a storybook
     * @param {Date} $dateTime 
     */
    function formatEpicDate(dateTime) {
        let datePart = dateTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            // hour: '2-digit',
            // minute: '2-digit',
        });
        
        return datePart 
    }

    function formatTime(dateTime) {
        let bigHour = dateTime.getHours()
        let amPm = bigHour >= 12 ? 'PM' : 'AM'
        let smallHour = bigHour > 12 ? bigHour - 12 : bigHour
        let timePart = smallHour.toString().padStart(2, '0') + ':' + dateTime.getMinutes().toString().padStart(2, '0') + amPm;
        return timePart
    }

    /**
     * 
     * @param {Date} date 
     * @returns {Object {date, month, weekday, year}}
     */
    function getDateParts(date) {
        return {
            date: date.getDate().toString().padStart(2, '0'),
            month: date.toLocaleString('en-US', { month: 'short' }),
            weekday: date.toLocaleString('en-US', { weekday: 'short' }),
            year: date.getFullYear()
        }
    }
        
})





