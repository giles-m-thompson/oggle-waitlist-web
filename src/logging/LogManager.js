import { Level } from "./Level";

/**
 * Responsible for undertaking all logging operations for the wider application.
 * @date December 10th 2024, 6:10:04 pm
 * @author Giles Thompson
 *
 * @class LogManager
 * @typedef {LogManager}
 */
class LogManager{

    static instance = null;

    
    /**
     * Singleton Factory method returns LogManager instance, and instance
     * will be created where one is found not to exist at the time this
     * method is called.
     * @date December 10th 2024, 7:05:24 pm
     * @author Giles Thompson
     *
     * @static
     * @returns {LogManager} The LogManager instance.
     */
    static getInstance(){
        if(!LogManager.instance){
            LogManager.instance = new LogManager();
        }
        return LogManager.instance;
    }

    
    /**
     * Creates an instance of LogManager with default LogLevel
     * set to INFO.
     * @date December 10th 2024, 6:18:02 pm
     * @author Giles Thompson
     *
     * @constructor
     * @param {Level} [loggingLevel=Level.INFO]
     */
    constructor(loggingLevel = Level.INFO) {
        this.loggingLevel = loggingLevel;

    }


    
   
    
    /**
     * Logs message and optional error object.  Where there isn't
     * a requirement to log an error, a call to one of the variant
     * log methods might be more appropriate.
     * @date December 10th 2024, 6:47:27 pm
     * @author Giles Thompson
     *
     * @param {Level} level The level to log the message at.
     * @param {string} message The message to log.
     * @param {Error} [errorObject=null] The error object to log where this is an error message.
     * @param {...*} args Optional array of arguments. 
     */
    logAll(level,message,errorObject=null,...args){

        if(level >= this.loggingLevel){

            if(level == Level.ERROR){
                const err = new Error(message);
                err.cause = errorObject;
                //(args[0] != undefined) ? console.error(`[${new Date().toISOString()}] [${Level.Name(level)}]:`,err,args) : console.error(`[${new Date().toISOString()}] [${Level.Name(level)}]:`,err)
                this.#logMessage(level,`[${new Date().toISOString()}] [${Level.Name(level)}]:`,args,err)
            }else{
               // (args[0] != undefined) ? console.log(`[${new Date().toISOString()}] [${Level.Name(level)}]: ${message}`,args) : console.log(`[${new Date().toISOString()}] [${Level.Name(level)}]: ${message}`)
               this.#logMessage(level,`[${new Date().toISOString()}] [${Level.Name(level)}]: ${message}`,...args)
            }

        }
    }

    
    /**
     * Logs the provided message at the specified level, where appropriate.
     * @date December 10th 2024, 6:52:25 pm
     * @author Giles Thompson
     *
     * @param {LogLevel} level The level to log the message at.
     * @param {string} message The message to log.
     * @param {*} args Optional array of arguments. 
     */ 
    log(level,message,...args){
        this.logAll(level,message,null,args);
    }


     /**
     * Sets logging level to the specified value.
     * @date December 10th 2024, 6:55:45 pm
     * @author Giles Thompson
     *
     * @param {Level} level
     */
     setLoggingLevel(level){
        this.loggingLevel = level;
    }

    
    /**
     * Returns the current logging level of this LogManager instance
     * @date December 10th 2024, 6:56:48 pm
     * @author Giles Thompson
     *
     * @returns {Level}
     */
    getLoggingLevel(){
        return this.loggingLevel;
    }

    #logMessage(level,message,args,err) {

        if(args[0] == undefined){
            if(level == Level.ERROR){
               console.error(message,err)
            }else if (level == Level.WARN){
               console.warn(message)
            }else{
               console.log(message)
            }
            
        }else{
            if(level == Level.ERROR){
                console.error(message,err,...args)
            }else if (level == Level.WARN){
                console.warn(message,...args)
            }else{
                console.log(message,...args)
            }
            
        }
    }
    
}

export { LogManager };