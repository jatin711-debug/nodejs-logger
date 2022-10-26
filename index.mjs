import { log, readLog } from "./logger.mjs";
(async function (){
    log({level: 'info', message: 'Hello Welsh!!'})
    await readLog("info")
})()

