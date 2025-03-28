
import { EngineManager } from "./engine/EngineManager";
import { Level } from "./logging/Level";
import { LogManager } from "./logging/LogManager";


/**
 * A SUPER stripped back version of the Oggle 3D editor platform 
 * created purely for the purposes of demoing various aspects of the platform, 
 * live on the home page of the main website. The demoed features will be initially 
 * constrained to the loading of various device meshes and their dynamic customization 
 * i.e loading video/image screens changing the device colour/opacity,etc.
 * @date March 21st 2025, 3:16:08 pm
 * @author Giles Thompson
 *
 * @class Oggle3dEditorDemo
 * @typedef {Oggle3dEditorDemo}
 */
class Oggle3dEditorDemo {

    constructor(
        engineTargetRenderElementId,
        engineColorEditorElementId,
        engineDragDropPanelElementId
    ) {
        this.engineTargetRenderElementId = engineTargetRenderElementId;
        this.engineColorEditorElementId = engineColorEditorElementId;
        this.engineDragDropPanelElementId = engineDragDropPanelElementId;
        this.engineManager = null;
        this.logManager = null;
    }

    initialise() {

        this.#log("Initialising Oggle 3D Editor Demo.")

        //instantiate and initialise LogManager.
        this.logManager = LogManager.getInstance();
        this.logManager.setLoggingLevel(Level.DEBUG);

        //instantiate and initialise EngineManager.
        this.engineManager = EngineManager.getSingletonInstance(
            this.engineTargetRenderElementId,
            this.engineColorEditorElementId,
            this.engineDragDropPanelElementId
        );
        this.engineManager.initialise();

    }

    #log(message){
        console.log(message);
    }


}

export {Oggle3dEditorDemo}