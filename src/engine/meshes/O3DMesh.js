import { LogManager } from "../../logging/LogManager";
import { Level } from "../../logging/Level";
import { Vector3 } from "@babylonjs/core";


/**
 * The base class from which all engine meshes are derived. Provides a
 * suite of utility methods/properties that are applicable to all meshes.
 * @date February 1st 2025, 9:11:03 pm
 * @author Giles Thompson
 *
 * @class O3DMesh
 * @typedef {O3DMesh}
 */
class O3DMesh{

    
    /**
     * Creates an instance of O3DMesh.
     * @date February 1st 2025, 9:38:03 pm
     * @author Giles Thompson
     *
     * @constructor
     */
    constructor(){

        /**
         * Map to hold all registered property change listeners, each
         * listener is associated with a string name/id key to allow 
         * the listener to be subsequently removed, at later time, as necessary.
         * Property change listeners are notified when an attempt is made to
         * directly update a propery of an applicable low-level BABYLON.mesh that 
         * is being proxied.
         * @type {Map<string,function>} 
         */
        this.directPropertyChangeListeners = new Map();
    }


    
    /**
     * Registers a new direct property change listener, the specified 
     * name/id may be used to later remove the listener.
     * @date February 1st 2025, 9:32:46 pm
     * @author Giles Thompson
     *
     * @param {string} name A unique name/id for the listener
     * @param {function} listener The listener to register.
     */
    addDirectPropertyChangeListener(name,listener){
        this.directPropertyChangeListeners.set(name,listener);
    }


    /**
     * Removes the specified direct property change listener from the map.
     * @date February 1st 2025, 9:33:42 pm
     * @author Giles Thompson
     * @param {string} name  The name/id of the listener to remove.
     */
    removeDirectPropertyChangeListener(name){
        return this.directPropertyChangeListeners.delete(name);
    }

    
    /**
     * Intended to be called by subclasses only! Wraps the provided
     * ParentMesh in a proxy and applies the specified setter intercepts.
     * 
     * 
     * @date February 2nd 2025, 12:39:35 am
     * @author Giles Thompson
     *
     * @param {} parentMesh The target parent mesh to proxy.
     * 
     * @param {Map<string,function>} setterIntercepts A map of property names to intercept functions, for setter operations
     *                                                attempts to SET values on properties (provided as entry keys) defined in this map
     *                                                will be intercepted and the associated function (provided as the corresponding entry value)
     *                                                will be called instead.
     * 
     * @param {Map<stringmfunction>} getterInterceps  A map of property names to intercept functions, for getter operations
     *                                                attempts to GET values on properties (provided as entry keys) defined in this map
     *                                                will be intercepted and the associated function (provided as the corresponding entry value)
     *                                                will be called instead.
     *      
     */
    wrapParentMeshInProxy(parentMesh,setterIntercepts,getterInterceps){

        const parentMeshProxy = new Proxy(
            parentMesh,
            new O3DMeshProxyHandler(this,setterIntercepts,getterInterceps),
        );
        return parentMeshProxy;

    }

    
    /**
     * Called from the internal O3DMeshProxyHandler to notify external property change listenrs
     * that a property has been updated.
     * @date February 3rd 2025, 2:05:28 pm
     * @author Giles Thompson
     *
     * @param {*} aSceneObject The scene object whos property was updated.
     * @param {*} aPropertyName  
     * @param {*} aPropertyValue 
     */
    notifyPropertyChangeListeners(aSceneObject,aPropertyName,aPropertyValue){
        
        this.directPropertyChangeListeners.forEach((v,k) => {
            v(aSceneObject, aPropertyName, aPropertyValue);
        })
    }

}


/**
 * Custom ProxyHandler for all O3DMesh derived meshes.
 * @date February 2nd 2025, 12:11:21 am
 * @author Giles Thompson
 *
 * @class O3DMeshProxyHandler
 * @typedef {O3DMeshProxyHandler}
 */
class O3DMeshProxyHandler{

    constructor(
        o3dMesh,
        setterInterceptsMap = new Map(),
        getterIntercepsMap = new Map()
    ){

        this.o3dMesh = o3dMesh;

        /** 
         * Map of property, setter intercept functions, each function is
         * associated with a property name and must have a signature, that
         * accepts the value that was attempted to be set.
         * @type {Map<string,function} 
         * */
        this.setterInterceptsMap = setterInterceptsMap;

         /** 
          * Map of property, getter intercept functions, each function is
          * associated with a property name and must have a signature, that
          * accepts the value that was attempted to be fetched.
          * @type {Map<string,function} */
        this.getterIntercepsMap = getterIntercepsMap;
    }

    /**
     * Intercepts/traps the set operation on a property.
     * @date February 2nd 2025, 12:13:36 am
     * @author Giles Thompson
     * @param {*} target The class the property is associated with.
     * @param {string} prop The name of the property.
     * @param {*} value The value that was attempted to be assigned to the property.
     */
    set(target, prop, value) {

        // Check if the specific property has been defined to be intercepted
        //in our setter intercepts map...
        // if (prop === "cornerRadius") {
        let targetSetterInterceptFunc;
        if((targetSetterInterceptFunc = this.setterInterceptsMap.get(prop))){
       

            //if so... call the target setter intercept function..
            let override = targetSetterInterceptFunc(value);

            //update the property on the low-level BABYLON.mesh that would have been set
            //had we not intercepted the operation here.. The only exception is where
            //TRUE is returned from the setter intercept function which indicates that
            //the setting of the property should be overriden by the function i.e not set...
            if(!override) {
                target[prop] = value;
            }


            //update the property value on the high-level Scene Object.
            if (this.o3dMesh.sceneObject) {

                //where the value is a low-level, Babylon-specific Vector3 convert it to an equivalent 3 component array
                //as we don't store low-level objects in the high level SceneObject and its derivitives.
                value = (value instanceof Vector3) ? value.asArray() : value;
                
                this.o3dMesh.sceneObject[prop] = value;  

                //notify propertyChangeListeners that a property has been updated. One of 
                //these listeners will be the EngineManager subsystem; it will inturn 
                //Publish an applicable global event to notify other subsystems 
                //(princpally the InspectorManager, currently) of the update.
                this.o3dMesh.notifyPropertyChangeListeners(this.o3dMesh.sceneObject, prop, value);
            }else{
                LogManager.getInstance().logAll(Level.ERROR,"No SceneObject associated with this O3DMesh!")
            }

        } else {

            //allow all other properties to fall through to the target class.
            Reflect.set(...arguments);
        }
        return true;
    }
        
}

export { O3DMesh };