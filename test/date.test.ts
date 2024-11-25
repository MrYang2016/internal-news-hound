import * as moment from 'moment-timezone';

const timeString = '16:24 PDT (Sunday, Jun 9, 2024)';
const date = moment.tz(timeString, 'HH:mm z (dddd, MMM D, YYYY)', 'America/Los_Angeles');

console.log(date.toDate());