
/** An enum of all currently supported Log Levels. */
const Level = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};



/**
 * Returns the corresponding string representation of the provided, numeric, log level.
 * @date December 10th 2024, 6:11:35 pm
 * @author Giles Thompson
 */
Level.Name = (levelValue) => {
    return Object.entries(Level).find(entry => entry[1] === levelValue)[0];
};

export { Level };