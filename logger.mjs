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
export const log = (options) => {
    const levelName = getLevelName(options.level)
    let message = options.message ?? 'Unidentified Error'
    const error = options.error ?? null
    // always log to thr console
    writeToConsole(levelName,message,error)
    if(config.levels[levelName].writeToFile) {
        writeToFile(levelName,message)
    }
} 

/**
 * 
 * @param {*} level 
 * @returns 
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
const writeToConsole = (levelName, message, error = null) => {
    const level = config.levels[levelName]
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
    const header = `[${levelName.toUpperCase()}]:[${getFormattedCurrentDate()}]`
    const ipData = `[Mac Address:${address.mac(function(err,mac){ return mac })}] [IP Address: ${address.ip()}]`
    console.log(`${chalkFunction(header)} ${chalkFunction(message)} ${chalkFunction(ipData)}`)
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
 * @returns Formatted Date
 */
const getFormattedCurrentDate = () => {
    return moment(new Date()).format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS)
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
    const data = `{"level":"${level.toUpperCase()}","message":"${message}", "timestamp":"${getFormattedCurrentDate()}","mac-address":"${mac}","ip":"${ip}"}\r\n`
    if(!existsSync(logsDir)){
        mkdirSync(logsDir)
    }
    const options = {
        encoding:"utf8",
        mode:438
    }
    appendFileSync(`./logs/${level}.log`,data,options);
    // try {
    //     await axios.post('http://localhost:3000/',{
    //             name:'Jatin',
    //             logs:data
    //     })
    //     console.log("Success Sending Logs to Server")
    // } catch (error) {
    //     console.log("Error Sending Log Messages")
    // }
    // return
}