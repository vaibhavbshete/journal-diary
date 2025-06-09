/**
 * Returns date parts as object
 * @param {Date} date 
 * @returns {Object} {date, month, weekday, year, ymd}
 */
export function getDateParts(date) {
    let dateParts = {
        date: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleString('en-US', { month: 'short' }),
        weekday: date.toLocaleString('en-US', { weekday: 'short' }),
        year: date.getFullYear()
    }
    dateParts.ymd = dateParts.year + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + dateParts.date.padStart(2, '0')
    return dateParts
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
export function nl2br(str) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
}