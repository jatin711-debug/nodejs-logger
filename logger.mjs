import path from 'path';
import chalk from 'chalk';
import moment from 'moment';
import { existsSync, mkdirSync, appendFileSync, createReadStream } from 'fs';
import readLine from 'readline';
import config from './config.mjs';
import address from 'address';
import axios from 'axios';
/**
 * Main Logging Function
 * @param {object} options 
 * object -> { level, message, error }
 */

let logServerAddress = "";

export const logger = (options,requestObject) => {
    const levelName = getLevelName(options.level);
    let message = options.message ?? 'Unidentified Error';
    const error = options.error ?? null;
    const request = createRequestObject(requestObject);

    if(config.levels[levelName].sendToConsole) {
        writeToConsole(levelName,message, error, request)
    }
    if(config.levels[levelName].writeToFile) {
        writeToFile(levelName,message)
    }
    if(config.levels[levelName].sendToServer) {
        if(getLogServerAddress() == "") {
            throw new Error("Please Set Logging Server First to send Log to server using setLogServerAddress(string:Address) method and try again...")
        }
        sendLogToServer( levelName, message, request);
    }
}

/**
 * 
 * @param {string} level 
 * @returns {string}
 */
const getLevelName = (level) => {
    return level && config.levels.hasOwnProperty(level) ? level:'info'
}

/**
 * Write formatted message to console
 * @param {string} level 
 * @param {string} message 
 * @param {Error|null} error 
 */
const writeToConsole = (levelName, message, error = null, requestObject = null) => {
    if(requestObject === null) {
        throw new Error("Request object is required");
    }
    const level = config.levels[levelName];
    let chalkFunction = null
    if(level.color.includes('#')) {
        chalkFunction = chalk.hex(level.color)
    }
    else if(Array.isArray(level.color)) {
        if(level.color.length === 3) {
            chalkFunction = chalk.rgb(level.color[0],level.color[1],level.color[2])
        }else {
            throw new Error('Invalid Array Config')
        }
    } else {
        chalkFunction = chalk[level.color]
    }
    message = error ? `${chalkFunction(`${error.message} \n ${error.stack}`)}` : message
    const header = `[${levelName.toUpperCase()}]:[${getFormattedCurrentTime()}]`
    const ipData = `[Mac Address:${address.mac(function(err,mac){ return mac })}] [IP Address: ${address.ip()}]`
    const requestData = `[Method:${requestObject.method} Host:${requestObject.hostname} BaseUrl:${requestObject.baseUrl} Url:${requestObject.url}]`
    console.log(`${chalkFunction(header)} ${chalkFunction(message)} ${chalkFunction(ipData)} ${chalkFunction(requestData)}`)
}

/**
 * Read Data from the logs
 * @param {string} fileName 
 * @return Promise
 */
export const readLog = async (fileName = null)=>{
    const logsDir = "./logs";
    return new Promise((resolve, reject) =>{
        const file = path.join(logsDir,
            fileName.includes('.') ? fileName : `${fileName}.log`
        );
        const lineReader = readLine.createInterface({
            input: createReadStream(file)
        })
        const logs = [];
        lineReader.on('line', (line) =>{
            logs.push(JSON.parse(line))
        })
        lineReader.on('close', () =>{
            console.log(
                chalk.yellow(`${fileName.toUpperCase()} has been accessed`)
            )
            console.table(logs);
            resolve(logs);
        })
        lineReader.on('error',(error)=>{
            reject(error);
        })
    });
}

/**
 * 
 * @returns Formatted Time
 */
const getFormattedCurrentTime = () => {
    return moment(new Date()).format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS)
}

export const getFormattedCurrentDate = (date) => {
    return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
}

/**
 * 
 * @param {string} level
 * @param {string} message 
 */
const writeToFile = async (level,message) => {
    const logsDir = "./logs"
    const mac = address.mac(function(err,m){return m})
    const ip = address.ip()
    const data = `{"level":"${level.toUpperCase()}","message":"${message}", "timestamp":"${getFormattedCurrentTime()}","mac-address":"${mac}","ip":"${ip}"}\r\n`
    if(!existsSync(logsDir)){
        mkdirSync(logsDir)
    }
    const options = {
        encoding:"utf8",
        mode:438
    }
    appendFileSync(`${logsDir}/${level}.log`,data,options);
}

/**
 * 
 * @param {string} level 
 * @param {string} message 
 * @param {string} serverUrl 
 * @returns 
 */
const sendLogToServer = (level,message,requestObject) => {
    if(validateUrl(getLogServerAddress())) {
        console.log(chalk.red("UnIdentified server Url Protocol...."))
        return;
    }
    const mac = address.mac(function(err,m){return m})
    const ip = address.ip()
    const requestData = `"Method":"${requestObject.method}","Host":"${requestObject.hostname}", "BaseUrl":"${requestObject.baseUrl}", "Url":"${requestObject.url}"`
    const data = `{"Level":"${level.toUpperCase()}","Message":"${message}",${requestData} ,"timestamp":"${getFormattedCurrentTime()}","mac-address":"${mac}","ip":"${ip}"}`
    try {
        axios.post(getLogServerAddress(),{
                logs:data
            }
        );
        console.log(chalk.green('Success Sending Logs to server'),getLogServerAddress())
    } catch (error) {
        console.log(chalk.red('Error Sending Logs to server...'));
    }
}


/**
 * 
 * @param {string} rawUrl 
 * @returns {boolean}
 */
const validateUrl = (rawUrl)=>{
    if(rawUrl.length < 1 || rawUrl.trim('').length < 1) {
        return false;
    }
    let url = new URL(rawUrl);
    if(!(url.protocol === 'https') || !(url.protocol === 'http')) {
        return false;
    }
    return true;
}

/**
 * 
 * @param {object} request 
 * @returns {object}
 */
const createRequestObject = (request) =>{
    return {
        method: request.method,
        hostname: request.hostname,
        baseUrl: request.baseUrl,
        url: request.url
    }
}

export const setLogServerAddress = (baseAddress) =>{
    logServerAddress = baseAddress;
    console.log(chalk.greenBright("Successfully set logging serverUrl to -"),logServerAddress);
}

export const getLogServerAddress = () => logServerAddress

