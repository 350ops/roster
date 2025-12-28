const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('/Users/mgl/flight-scanner-app/Duty Hrs Statistics Report.pdf');

pdf(dataBuffer).then(function (data) {
    console.log('--- START PDF TEXT ---');
    console.log(data.text);
    console.log('--- END PDF TEXT ---');
}).catch(function (error) {
    console.error('Error parsing PDF:', error);
});
