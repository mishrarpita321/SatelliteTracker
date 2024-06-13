const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors } = format;

const myFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        errors({ stack: true }),
        myFormat
    ),
    transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.Console()
    ],
});

module.exports = logger;
