import { getDateParts, nl2br } from "./helpers"
import { addNote, db } from "./model"

export function initui() {
    let subBtn = document.getElementById('subBtn')
    let noteInp = document.getElementById('noteInp')
    let startInp = document.getElementById('startInp')
    let formDateButton = document.getElementById('formDateBtn')
    
    
    
    formDateButton.addEventListener('click', function () { startInp.showPicker() })
    startInp.addEventListener('change', displayFormDateTime)
    subBtn.addEventListener('click', () => {
        let noteVal = noteInp.value
        console.log(startInp.value);
        
        let startValParts = getDateParts(new Date(startInp.value))
        // let startVal = startValParts.year + '-' + startValParts.month.padStart(2, '0') + '-' + startValParts.date.padStart(2, '0')
        addNote(noteVal, startInp.value, (noteId) => {
            const insertedNoteLi = insertNoteLi(nl2br(noteVal), startInp.value, noteId, false)
            if(insertedNoteLi.scrollIntoView) {
                insertedNoteLi.scrollIntoView({ behavior: 'smooth' })
            }
            else {
                console.log('insertedNoteLi',insertedNoteLi);
            }
        })
        // displayNotes()
        resetForm()
        displayFormDateTime()
    })

    resetForm()
    displayFormDateTime()
}

export function resetForm() {
let startInp = document.getElementById('startInp')
    noteInp.value = ''
    
    let dt = new Date()
    let dp = getDateParts(dt)
    startInp.value = dt.toISOString()
}

function createNoteLi(noteText, date, noteId) {
    let noteTemplate = document.getElementById('noteTemplate')
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

export function insertNoteLi(noteText, date, noteId, appendAtEnd = true) {
    const notesUl = document.getElementById('notesList')
    const noteLi = createNoteLi(noteText,date,noteId)
    // Put the list item inside the task list
    if (!noteLi.children.length || appendAtEnd) {
        notesUl.appendChild(noteLi);
        return noteLi
    }
    // if there are other lis, determine where to put the new one first
    let displayedDates = [...notesUl.children].map(el => el.querySelector('time[data-date-time-wrapper]').dateTime)
    let toDisplayNoteDate = new Date(date).toISOString()
    displayedDates.push(toDisplayNoteDate)
    displayedDates.sort()
    let toDisplayNoteIndex = displayedDates.indexOf(toDisplayNoteDate)
    if (toDisplayNoteIndex == noteLi.children.length) {
        notesUl.appendChild(noteLi);
        return noteLi
    }
    // means it's got a next li, which is sitting at its to-be index
    const nextNoteLi = notesUl.children[toDisplayNoteIndex]
    notesUl.insertBefore(noteLi, nextNoteLi)
    return noteLi
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

export function displayNotes() {
    let notesUl = document.getElementById('notesList')
    let emptyNotesTemplate = document.getElementById('noNotesTemp')
    // clear existing notes first
    while (notesUl.firstChild) {
        notesUl.removeChild(notesUl.firstChild);
    }
    
    let countRes = db.transaction('notes').objectStore('notes').count()
    countRes.onsuccess = (event) => {
        console.log('count', event.target.result);
        if (event.target.result == 0) {
            // let emptyNotesLi = emptyNotesTemplate.content.cloneNode(true)
            // notesUl.appendChild(emptyNotesLi)
        }
        else {
            
            
            const objectStore = db.transaction('notes').objectStore('notes');
            console.log(objectStore.indexNames,db.version);
            
            const request = objectStore.index("start_time").openCursor(null, "next" )
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                // Check if there are no (more) cursor items to iterate through
                if (!cursor) {
                    // No more items to iterate through, we quit.
                    console.log('All entries displayed.');
                    return;
                }
            
                // Check which suffix the deadline day of the month needs
                const { start_time, note } = cursor.value;
            
                
    
                // Build the entry and put it into the list item.
                const noteText = nl2br(note)
                // const noteText =  `${nt}`;
                insertNoteLi(noteText, start_time, cursor.primaryKey)
                
    
    
                // continue on to the next item in the cursor
                cursor.continue();
            };
        }
    }

}

export function displayFormDateTime() {

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