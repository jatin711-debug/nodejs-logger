import path from 'path';
import chalk from 'chalk';
import moment from 'moment';
//import { existsSync, mkDirSync, appendFileSync, createReadStream } from 'fs';
import readLine from 'readline';
import config from './config.mjs';

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
    // if(config.levels[levelName].writeToFile) {
    //     writeToFile(levelName,message)
    // }
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
    console.log(`${chalkFunction(header)}: ${chalkFunction(message)}`)

}

const getFormattedCurrentDate = () => {
    return moment(new Date()).format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS)
}

