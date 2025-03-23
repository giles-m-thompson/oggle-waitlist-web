import * as BABYLON from '@babylonjs/core';
import { LogManager } from '../../logging/LogManager';
import { Level } from '../../logging/Level';
import { O3DMesh } from './O3DMesh';





/**
 * Represents a device mesh type in active scene (i.e phone,laptop or tablet), 
 * supplimentary functions are also provided to allow for the dynamic modification 
 * of the Device including the changing of its body colour and screen texture.
 * 
 * @date November 2nd 2024, 9:35:32 pm
 * @author Giles Thompson
 *
 * @class DeviceMesh
 * @typedef {DeviceMesh}
 */
class DeviceMesh extends O3DMesh{

    constructor(
        scene,
        name,
        meshURL,
        bodySubmeshName,
        bodyMaterialName,
        screenSubmeshName,
        screenMaterialName,
        additionalScreenSubmeshes = [],
        topLevelModelMeshName = "default",
        bodyColour = "default",
        screenTextureURL = "default",
        enableLoadingScreen = true, // shows an intermediary loading screen when a screen texture is updated.
        enableBackingScreen = true,
        visibility = 1,
        enabled = true

    ){

        super();
        this.scene = scene;
        this.name = name;
        this.meshURL = meshURL;
        this.bodySubmeshName = bodySubmeshName;
        this.bodyMaterialName = bodyMaterialName;
        this.screenSubmeshName = screenSubmeshName;
        this.screenMaterialName = screenMaterialName;
        this.additionalScreenSubmeshes = additionalScreenSubmeshes;
        this.topLevelModelMeshName = topLevelModelMeshName;
        this.bodyColour = bodyColour;
        this.screenTextureURL = screenTextureURL;
        this.enableLoadingScreen = enableLoadingScreen;
        this.loadingScreenName = `interstitial-loading-screen-${this.name}`
        this.enableBackingScreen = enableBackingScreen;
        this.backingScreenName = `backing-screen-${this.name}`
        this.visibility = visibility;
        this.enabled = enabled;

        //computed values known post initialisation
        /** @type {BABYLON.Mesh}*/
        this.parentMesh = null;
        this.initialised = false;
        this.cachedScreenMaterial = null; //used to cache screen material;
        this.meshHierarchyInSizeOrder = [];

        //optional cache of main device submeshes that are used frequently in this
        //class. Once initialised by any method they can be reused.
        this.bodySubmesh = null;
        this.backingScreenSubmesh = null;
        this.screenSubmesh = null;
        this.uploadProgressIndicatorScreen = null;
        this.showingLoadingScreen = false; //indicates whether the loading screen is currently being displayed.


    }

 
    
    /**
     * Initialises the DeviceMesh Instance which will include
     * the fetching and loading of the referenced mesh to 
     * the scene as well as applying any default
     * @date November 3rd 2024, 10:35:45 am
     * @author Giles Thompson
     *
     * @async
     * @returns {Promise<DeviceMesh>}
     */
    async initialise() {
        try {
            const loadedMesh =  await this.#loadMesh();
            this.initialised = true;

      
            return loadedMesh;
        } catch (err) {
            LogManager.getInstance().logAll(Level.ERROR,"Error initialising DeviceMesh:",err.message);
            throw new Error(`An error occurred whilst attempting to initialise device mesh: ${err.message}`);
        }
    }

    
    /**
     * Returns TRUE if the DeviceMesh instance has been initialised
     * and FALSE otherwise.
     * @date November 2nd 2024, 11:57:52 pm
     * @author Giles Thompson
     *
     * @returns {boolean}
     */
    isInitialised(){
        return this.initialised;
    }

    

    
    /**
     *  Returns reference to the parent mesh that was imported.
     * @date November 3rd 2024, 11:04:44 am
     * @author Giles Thompson
     *
     * @returns {BABYLON.Mesh}
     */
    getParentMesh(){
        this.#verifyInitialised();
        return this.parentMesh;
    }

    
    seekToTime(time){
        this.#verifyInitialised();

        const matVideo = this.cachedScreenMaterial.albedoTexture.video;
        if(time <= matVideo.duration){ 
            matVideo.currentTime = time;
            this.cachedScreenMaterial.albedoTexture.update(); 
        }
    }

    forceScreenTextureUpdate(){
        this.cachedScreenMaterial.albedoTexture.update();

        this.cachedScreenMaterial.albedoTexture.video.requestVideoFrameCallback(this.forceScreenTextureUpdate);
    }

    getCurrentPlayBackTime(){
        
       return this.cachedScreenMaterial
            .albedoTexture
            .video
            .currentTime;
    }

    getCurrentScreenVideo(){
            
       return this.cachedScreenMaterial
       .albedoTexture
       .video
    }
    
    /**
     * Updates the body colour of the device mesh to the specified 
     * hash colour value.
     * @date November 3rd 2024, 3:26:02 pm
     * @author Giles Thompson
     *
     * @param {string} newColour A hash-encoded colour value.
     */
    updateBodyColour(newColour){
        this.#verifyInitialised();

        const bodyMaterial = this.scene.getMaterialById(this.bodyMaterialName);

        if(bodyMaterial){
            this.bodyColour = BABYLON.Color3.FromHexString(newColour);
            bodyMaterial.albedoColor = this.bodyColour;
        }else{
            throw new Error(`Update of body colour failed; unable to find body material with id: ${this.bodyMaterialName}`);
        }

    }


    
   
    
    /**
     * Sets the visibility of the device mesh to the specified value.
     * @date January 16th 2025, 12:48:48 pm
     * @author Giles Thompson
     *
     * @param {number} visibility  An visibility value between 0 and 1 (inclusive)
     */
    updateVisibility(visibility,setFromProxy = false){
        this.#verifyInitialised();

        if(visibility < 0 ){
          this.visibility = 0;
          return
        }

        if(visibility > 1){
            this.visibility = 1;
        }

        this.visibility = visibility;

        //call into our private utility method to actually update the the meshes visibility.
        this.#setMeshVisibility(this.parentMesh,this.visibility,true,setFromProxy);
    
    }

    
    /**
     * Intended to be called from Proxy  to update the visibility value
     * Crucially, this method varient, will NOT attempt to directly 
     * update the visibility property on the parent mesh itself which 
     * would result in endless loop when called from the proxy.
     * @date February 4th 2025, 2:58:35 pm
     * @author Giles Thompson
     *
     * @param {number} visibility A visibility value.
     */
    updateVisibilityFromProxy(visibility){
        this.updateVisibility(visibility,true);
     }


     setupProxy(){
         //prepare setter intercept functions map.. the key will be the name of
        //the property whilst the value will be the function to call when access to
        //that property is intercepted...
        const setterInterceptsMap = new Map();
        setterInterceptsMap.set("visibility", this.parentMesh.parentDeviceMesh.updateVisibilityFromProxy.bind(this));
        //TODO:GT Add other setter intercepts here... as appropriate.

        //wrap the parent mesh in a proxy that will trap/intercept direct property access
        this.proxyWrapper = this.wrapParentMeshInProxy(this.parentMesh, setterInterceptsMap);
        this.parentMesh = this.proxyWrapper;
     }


    
    /**
     * Enables or disables the device mesh. When a mesh is disabled it will not be visible
     * in the scene and no longer receive pointer events.
     * @date January 16th 2025, 1:10:09 pm
     * @author Giles Thompson
     *
     * @param {boolean} enable Set to TRUE (as it is by default) to enable mesh or FALSE otherwise.
     */
    enableMesh(enable){
        this.#verifyInitialised();
        this.enabled = enable;

        //call into our private utility method to set the enablement 
        //of the mesh and recursively set the value for each of its children.
        this.#setMeshEnablement(this.parentMesh,this.enabled);

    }

    
    /**
     * Updates the devices screen material texture to the resource
     * at the specified URL. The method will implictly attempt to determine 
     * whether the resource is a video or image and apply the appropriate
     * texture. For example, In the case of videos, a VideoTexture will be
     * created, where it doesn't already exist, and applied to the Screen Material.
     * @date November 29th 2024, 9:49:52 am
     * @author Giles Thompson
     *
     * @param {string} imageOrVideoTextureURL The Image Or Mesh to apply to the device screen.
     */
    updateScreenTextureURL(imageOrVideoTextureURL) {
        this.#verifyInitialised();

        //show loading screen if enabled
        if(this.enableLoadingScreen) this.#showInterstitialLoadingScreen();
        

        const screenMaterial = this.scene.getMaterialById(this.screenMaterialName);

        this.cachedScreenMaterial = screenMaterial;

        if (screenMaterial) {

            //attempt to detect the content mimetype this will enable us to prepare the 
            //correct texture for the provided media type i.e Video or Image.
            this.#detectMediaMimeTypeFromURL(imageOrVideoTextureURL,"video")
                .then((mediaType) => {

                    if (mediaType === "video") {

                        //dispose of any prior textures
                        if(screenMaterial.albedoTexture.video) {
                            const videoTexture = screenMaterial.albedoTexture;
                            videoTexture.video.pause();
                            videoTexture.video.src = "";
                            videoTexture.video.load(); 
                            videoTexture.video.remove();
                            videoTexture.dispose();
                            screenMaterial.albedoTexture = null;
                        }
//
                        //create a new video texture and assign it to the screen material
                        const videoTexture = new BABYLON.VideoTexture(`${this.name}-video-texture`, imageOrVideoTextureURL, this.scene, true, true);
                        videoTexture.updateSamplingMode( BABYLON.Texture.NEAREST_NEAREST);
                        videoTexture.anisotropicFilteringLevel = 64; // Set to the maximum supported level

                        videoTexture.generateMipMaps = false; // Disable mipmaps for an existing texture
                        videoTexture.video.preload = "auto"; 
                        videoTexture.video.load();
                        videoTexture.video.autoplay = false;
                        
                       

                        screenMaterial.albedoTexture = videoTexture;
                      
                        //screenMaterial.alpha = 1;
                        //screenMaterial.albedoTexture.gammaSpace = true; // Ensure gamma is applied
                        //screenMaterial.albedoTexture.uScale = 1; // Correct scaling for sharpness
                        //screenMaterial.albedoTexture.vScale = 1;


                        // Set up image processing configuration
                        screenMaterial.imageProcessingConfiguration = new BABYLON.ImageProcessingConfiguration();
                        
                        // Adjust brightness and contrast
                        //screenMaterial.imageProcessingConfiguration.contrast = 3.0;  // Adjust to preference
                        //screenMaterial.imageProcessingConfiguration.exposure = 0.5;  // Adjust exposure

                        //screenMaterial.imageProcessingConfiguration.brightness = 0.9; // Adjust as needed (positive values increase brightness)
                        //screenMaterial.imageProcessingConfiguration.contrast = 1.2; // Adjust as needed (1.0 = no change, >1.0 = increase contrast)
                        //screenMaterial.imageProcessingConfiguration.exposure = 0.5; // Adjust exposure if needed
                        //screenMaterial.metallic = 10;
                        //screenMaterial.roughness = 0.5;
                        //screenMaterial.specularColor = new BABYLON.Color3(1, 1, 1); // White specular color for shiny highlights
                        //screenMaterial.specularPower = 128;
                        //screenMaterial.emissiveColor = new BABYLON.Color3(0.15, 0.15, 0.15); // Keep the video bright
                        //screenMaterial.emissiveIntensity = 3.5; // Make the video stand out more
                        //screenMaterial.reflectivityTexture = this.scene.environmentTexture;
                        //screenMaterial.reflectivityTexture.level = 0.3; // Lower reflection effect
                        //screenMaterial.roughness = 10; // Higher roughness for softer reflections
                        screenMaterial.unlit = true;

                        screenMaterial.emissiveTexture = videoTexture;
                        screenMaterial.emissiveColor = new BABYLON.Color3(0.2,0.2,0.2);
                        screenMaterial.emissiveIntensity = 0.15; // Lower intensity to prevent washout
                        //screenMaterial.specularIntensity = 1;

                        //sharpen screen
                        //const screenMesh = this.#getMeshByName(this.screenSubmeshName);
                       // screenMesh.convertToFlatShadedMesh();
                       //screenMesh.subdivide(50);
                       
                        const screenMesh = this.#getMeshByName(this.screenSubmeshName);
                        const renderTarget = new BABYLON.RenderTargetTexture("renderTarget2", { width: 2048, height: 2048 }, this.scene);
                        renderTarget.renderList.push(screenMesh);  // Add the mesh with video texture to the render list

                        // Apply sharpen post-process specifically to the render target

                        const sharpenPostProcess = new BABYLON.SharpenPostProcess(
                            "sharpenEffect",  // Post-process name
                            10,              // Sharpen amount
                            null,             // Camera (use null to not apply globally)
                            null,             // SamplingMode
                            this.scene.getEngine(),           // Engine
                            false,            // Reusable
                            renderTarget      // Apply post-process to the render target
                        );

                        sharpenPostProcess.edgeAmount = 1;
                        sharpenPostProcess.colorAmount = 1;




                    //attach event handler to detect when video is fully loaded..
                    videoTexture.video.addEventListener('canplaythrough', function() {
                        LogManager.getInstance().log(Level.DEBUG,"Video is fully loaded and can play without interruption.");
                    });



                    } else if (mediaType === "image") {

                        //create a new texture and assign it to the screen material
                        const texture = new BABYLON.Texture(imageOrVideoTextureURL, this.scene, undefined, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE, null, null, false); // Last 'false' disables mipmaps
                        screenMaterial.albedoTexture = texture;
                        screenMaterial.alpha = 1;
                       
                        // Set up image processing configuration
                        screenMaterial.imageProcessingConfiguration = new BABYLON.ImageProcessingConfiguration();

                        // Adjust brightness and contrast
                        screenMaterial.imageProcessingConfiguration.brightness = 1.9; // Adjust as needed (positive values increase brightness)
                        screenMaterial.imageProcessingConfiguration.contrast = 2.6; // Adjust as needed (1.0 = no change, >1.0 = increase contrast)
                        screenMaterial.imageProcessingConfiguration.exposure = 1.5; // Adjust exposure if needed


                    } else {

                        //TODO:GT for now we just log the error,we will eventually want to
                        //        publish an event to prompt the upconing notification manager
                        //        to display a pill or toaster in the UI.
                        LogManager.getInstance().logAll(Level.ERROR,"Unsupported media type for screen texture:",null,mediaType);
                    }

                    this.#hideInterstitialLoadingScreen(5000);

                })

        } else {
            throw new Error(`Update of screen texture failed; unable to find screen material with id: ${this.screenMaterialName}`);
        }



        /*
      if(screenMaterial){
          this.screenTextureURL = imageOrVideoTextureURL;
          const videoTexture = new BABYLON.VideoTexture(`${this.name}-video-texture`, this.screenTextureURL, this.scene, true,true);
          screenMaterial.albedoTexture = videoTexture;
          videoTexture.video.play(); //TODO: remove this,play should be triggered by timeline.

      } else{
          
      }
      */
    }

    
    /**
     * Updates the device's screen material to a new VideoTexture
     * that references the provided video element. thereby rendering that
     * video to the device's screen.
     * @date November 29th 2024, 10:30:20 am
     * @author Giles Thompson
     *
     * 
     * @param {HTMLVideoElement} aVideoElement The video element to update to the device screen.
     * @param {boolean} showLoadingScreen Optional, where set to true and the loading screen is enabled for the mesh instance,
     *                                    a loading sequence will be displayed before the screen is updated.
     */
    updateScreenTextureVideo(aVideoElement,showLoadingScreen = false){
        this.#verifyInitialised();

        //obtain screen material.
        const screenMaterial = this.scene.getMaterialById(this.screenMaterialName);
        if(screenMaterial){

            let curTexture = screenMaterial.albedoTexture;

            //show loading screen (where enabled )where this is the first update to the screen.
            if(!curTexture || showLoadingScreen){
                //show loading screen if enabled.
                if (this.enableLoadingScreen) this.#showInterstitialLoadingScreen();
                this.#hideInterstitialLoadingScreen(5000);

            }else{

                //otherwise dispose of the current video texture
                curTexture.dispose();
                curTexture = null;
                this.#showBackScreen();
            }

            //create a new texture and assign it to the screen material
            const newVideoTexture = this.#genVideoTexture(aVideoElement);
            screenMaterial.albedoTexture = newVideoTexture;
            screenMaterial.unlit = true;
            screenMaterial.emissiveTexture = newVideoTexture;
            screenMaterial.emissiveColor = new BABYLON.Color3(0.2,0.2,0.2);
            screenMaterial.emissiveIntensity = 0.15; // Lower intensity to prevent washout
            this.#hideBackScreen(500);

        }

    }


    
    /**
     * Updates the device's screen material to the image referenced 
     * by the specified URL, thereby rendering that image to the 
     * device's screen.
     * @date January 18th 2025, 5:24:20 pm
     * @author Giles Thompson
     *
     * @param {string} anImageURL The URL of the image to update to the device screen.
     * @param {boolean} [showLoadingScreen=false] Flag which indicates whether the loading screen should be
     *                                            displayed on update of the screen, it isn't by default.
     */
    updateScreenTextureImage(anImageURL,showLoadingScreen = false){
        this.#verifyInitialised();

        //obtain screen material.
        const screenMaterial = this.scene.getMaterialById(this.screenMaterialName);
      
        if(screenMaterial){

            let curTexture =  screenMaterial.albedoTexture;

            //show loading screen (where enabled )where this is the first update to the screen.
            if(!curTexture || showLoadingScreen){
                //show loading screen if enabled.
                if (this.enableLoadingScreen) this.#showInterstitialLoadingScreen();
                this.#hideInterstitialLoadingScreen(5000);

            }else{

                //otherwise dispose of the current video texture
                curTexture.dispose();
                curTexture = null;
                this.#showBackScreen();
                screenMaterial.albedoTexture = undefined;
            }

            //create a new texture and assign it to the screen material
            const imgTexture = new BABYLON.Texture(anImageURL, this.scene); // Last 'false' disables mipmaps
            screenMaterial.albedoTexture = imgTexture;
            screenMaterial.emissiveTexture = imgTexture
            screenMaterial.unlit = true;
            screenMaterial.visibility = 1;
            this.#hideBackScreen(500);

            //const imgTexture = new BABYLON.Texture("./src/engine/img/black-screen-with-reflection-dark.png", this.scene);
            

            ////apply the image texture to the cloned screen mesh.
            //clonedDeviceScreenSubMesh.material.albedoTexture = imgTexture;
            //clonedDeviceScreenSubMesh.material.unlit = true;
            //clonedDeviceScreenSubMesh.visibility = 0;  
            

        }

    }

    

    
    /**
     * Enables or disables the intermediary loading screen when 
     * a device screen texture is updated. The looading screen is 
     * facilitated by the addition of an additional screen mesh to 
     * the model and thus this feature may be disabled to conserve 
     * resources, as necessary. It is ENABLED by default.
     * @date November 13th 2024, 10:08:51 am
     * @author Giles Thompson
     *
     * @param {boolean} enable Set to TRUE to enable the loading screen or FALSE otherwise.
     */
    setEnableLoadingScreen(enable){
        this.enableLoadingScreen = enable;
    }


     /**
     * An optional progress percentage value
     * @date February 11th 2025, 2:58:17 pm
     * @author Giles Thompson
     *
     * @param {number} progressValue 
     */
     showUploadProgressIndicatorScreen(progressValue = 0,showLoadingScreen = false){
        this.uploadProgressIndicatorScreen.setEnabled(true);
        this.uploadProgressIndicatorScreen.visibility = 1;
        this.uploadProgressIndicatorScreen.material.alpha = 1;

        //opitonally show interstitial loading screen while upload is in progress.
        if(showLoadingScreen){
            this.#showInterstitialLoadingScreen();
        }

        if(progressValue > 0 && this.uploadProgressIndicatorScreen){
           const dynamicTexture =  this.uploadProgressIndicatorScreen.material.diffuseTexture;
           dynamicTexture.clear();
           dynamicTexture.drawText(`  ${progressValue}%`, null, 50, " 44px Titan One", "white", "transparent");
           dynamicTexture.drawText("   Uploading Media...", null, 75, "bold 14px Arial", "white", "transparent");

        }

    }

    hideUploadProgressIndicatorScreen(){
        this.uploadProgressIndicatorScreen.setEnabled(false);
        this.uploadProgressIndicatorScreen.visibility = 0;
        this.uploadProgressIndicatorScreen.material.alpha = 0;
        this.#hideInterstitialLoadingScreen(100);
        //reset the progress indicator screen to 0% complete.
        const dynamicTexture =  this.uploadProgressIndicatorScreen.material.diffuseTexture;
        dynamicTexture.clear();
        dynamicTexture.drawText(`  0%`, null, 50, " 44px Titan One", "white", "transparent");
        dynamicTexture.drawText("   Uploading Media...", null, 75, "bold 14px Arial", "white", "transparent");
    }


                                               //private helper methods

    
    #verifyInitialised(){
        if(!this.initialised){
            throw new Error("The DeviceMesh instance has not been initialised.")
        }
    }

    #getMeshByName(aName){
        return this.scene.getMeshByName(aName);
    }

    #detectMediaMimeTypeFromURL(aMediaURL,staticTest) {


        return new Promise((resolve, reject) => {

            if (staticTest) {

                if (staticTest == "image") {
                    resolve("image");
                } else if (staticTest == "video") {
                    resolve("video");
                }
            }

            const fileName = aMediaURL.match(/[^/]*$/)[0];
            const fileParts = fileName.split('.');
            LogManager.getInstance().log(Level.DEBUG,fileParts);
            if (fileParts.length > 1) {
                LogManager.getInstance().log(Level.DEBUG,"Attempting to detect media type from file name:",fileName);
                const ext = fileParts.pop().toLowerCase();
                if (ext === "mp4" || ext === "webm") {
                    return resolve("video");
                } else if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif" || ext === "webp") {
                    return resolve("image");
                } else {
                    reject(`An invalid file type was specified`);
                }
            } else {
                LogManager.getInstance().log(Level.DEBUG,"Attempting to detect media type from file mime type..");
                const xhr = new XMLHttpRequest();
                xhr.open("HEAD", aMediaURL, true);
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const contentType = xhr.getResponseHeader("Content-Type");
                        if (contentType.includes("video")) {
                            resolve("video");
                        } else if (contentType.includes("image")) {
                            resolve("image");
                        } else {
                            reject(`An invalid content type was found: ${contentType}`);
                        }
                    } else {
                        reject(new Error(`Failed to fetch resource. Status: ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error("Network error or request failed"));
                xhr.send();
            }
        });
    }

    
    /**
     * Generates and returns a VideoTexture and associates it with the provided
     * video element.
     * @date November 29th 2024, 10:25:59 am
     * @author Giles Thompson
     *
     * @param {HTMLVideoElement} aVideoElement The video element to associate with the texture.
     */
    #genVideoTexture(aVideoElement){
        const videoTexture = new BABYLON.VideoTexture(`${this.name}-video-texture`,aVideoElement,this.scene, true, true);
        videoTexture.updateSamplingMode( BABYLON.Texture.NEAREST_NEAREST);
        videoTexture.anisotropicFilteringLevel = 64; // Set to the maximum supported level
        videoTexture.generateMipMaps = false; // Disable mipmaps for an existing texture
        videoTexture.video.preload = "auto"; 
        videoTexture.video.load();
        videoTexture.video.autoplay = false;
        return videoTexture;
    }
    
    
 
    /**
     * Attempts to load mesh at the URL specified to the constructor of
     * this DeviceMesh instance to the scene applying default mesh config
     * settings in the process.
     * @date November 3rd 2024, 8:27:38 am
     * @author Giles Thompson
     *
     * @async
     * @returns {*}
     */
    async #loadMesh(){

        //load mesh wrapped in a Promise to allow us to resolve or reject the promise on success or failure, respectfully
        return new Promise((resolve, reject) => {

            BABYLON.SceneLoader.ImportMesh("", 
                                           "", 
                                           this.meshURL, 
                                           this.scene, 
                                           (meshes) => this.#onMeshImportSuccess(meshes, resolve),
                                            null,
                                           (scene, message, exception) => this.#onMeshImportError(scene, message, exception, reject), 
                                           ".glb");
        });
    }
 
    /**
     * Called on successful import of a mesh, configures the mesh with
     * default settings and material adjustments. In later version the 
     * method will be updated to apply custom settings as defined in the
     * meshes associated Asset data.
     * @date November 3rd 2024, 8:20:33 am
     * @author Giles Thompson
     *
     * @param {*} meshes
     */
    #onMeshImportSuccess(meshes, resolve) {

        //grab the loaded mesh 
        const loadedMesh = meshes[0];
        loadedMesh.name = this.name;
        loadedMesh.uniqueName = this.name;

        //set the mesh pivot point
        loadedMesh.setPivotPoint(new BABYLON.Vector3(0, 0, 0)); // Set the pivot point to the center

        //setup default shadow and material properties
        //TODO: we will likely wan to inroduce additional properties so these properties
        //      can be uniquely set for each device.
        loadedMesh.receiveShadows = true;
        loadedMesh.getChildMeshes().forEach((m) => {
            m.receiveShadows = true;
            m.anisotropicFilteringLevel = 32;

        })

        this.parentMesh = loadedMesh;

        //set the parent of this parentMesh (i.e the top-level node) to this class instance
        this.parentMesh["parentDeviceMesh"] = this;

        //prepare setter intercept functions map.. the key will be the name of
        //the property whilst the value will be the function to call when access to
        //that property is intercepted...
        const setterInterceptsMap = new Map();
        setterInterceptsMap.set("visibility", this.parentMesh.parentDeviceMesh.updateVisibilityFromProxy.bind(this));
        //TODO:GT Add other setter intercepts here... as appropriate.

        //setup intercepts for the TRANSFORM related properties, attempts to set these on the
        //top-level, root mesh (which is usually just a container in a complex mesh) 
        //should be intercepted and redirected to the appropriate  child 
        //that the transforms should actually be applied to, usually the first child. Eventually
        //we will want to identify the actual target mesh and its depth in the model hierarchy, store
        //this data in the related Asset and then specifically target that child mesh for these transform updates.
        //NB: Note we return TRUE from the intercept functions which will signal the to the Proxy that the setting of
        //    the underlying properties should be overidden (i.e not set)  which is what we want in this case
        //    as we are instead applying these transforms to the first child.
        setterInterceptsMap.set("position",(position) => {this.parentMesh.getChildren()[0].position = position; return true;});
        setterInterceptsMap.set("rotationQuaternion",(rotationQuaternion) => {this.parentMesh.getChildren()[0].rotationQuaternion = rotationQuaternion; return true;});
        setterInterceptsMap.set("scaling",(scaling) => {this.parentMesh.getChildren()[0].scaling = scaling; return true;});
       
        

    
        //wrap the parent mesh in a proxy that will trap/intercept direct property access
        this.proxyWrapper = this.wrapParentMeshInProxy(this.parentMesh, setterInterceptsMap);
        this.parentMesh = this.proxyWrapper;



        //if loadingScreen feature is enabled append an interstitial loading screen.
        if (this.enableLoadingScreen) {
            this.#appendInterstitialLoadingScreen();
        }

        //if backingscreen feature is enabled append backing screen
        if (this.enableBackingScreen) {
            this.#appendBackingScreen();
        }

        //create upload progress indication screen (will be hidden initially)
        this.uploadProgressIndicatorScreen = this.#createUploadProgressIndicatorScreen();

        //generate an array of the entire meshes hierarchy, ordered by size, this will allow us
        //to selectively disable the rendering internal smaller meshes as necessary.
        this.meshHierarchyInSizeOrder = this.#orderMeshHierarchyBySize(this.parentMesh);


        //return reference to this class instance where the mesh was successfully imported.
        resolve(this);

    }

    #onMeshImportError(scene,message,exception,reject){
        LogManager.getInstance().logAll(Level.ERROR,"Failed to load specified mesh: %s",exception,this.name);
        reject(new Error("Failed to load specified mesh: " + message));
    }


    #orderMeshHierarchyBySize(mesh){

        return mesh.getChildMeshes().sort((a, b) => {
            let aSize = a.getBoundingInfo().boundingBox.maximumWorld.subtract(a.getBoundingInfo().boundingBox.minimumWorld).length();
            let bSize = b.getBoundingInfo().boundingBox.maximumWorld.subtract(b.getBoundingInfo().boundingBox.minimumWorld).length();
            return bSize - aSize; // Sort descending by size
        });

    }
    
    /**
     * Generates and appends an additional screen to the mesh. This will serve as a 
     * base screen and prevent the intenals of the device from being displayed
     * when the default screen is momentarily hidden, during an update of its  
     * image/video texture.
     * @date December 25th 2024, 9:32:22 am
     * @author Giles Thompson
     */
    #appendBackingScreen(){

        //attempt to locate the child mesh with the screen sub mesh name..
        const deviceScreenSubMesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.screenSubmeshName);
        
        if(deviceScreenSubMesh){

            //clone the device screen.
            const clonedDeviceScreenSubMesh = deviceScreenSubMesh.clone(this.backingScreenName);

            //clone the screen material too, as by default the child mesh will share the SAME material instance.
            clonedDeviceScreenSubMesh.material = deviceScreenSubMesh.material.clone(`material-${this.backingScreenName}`);

            //create backing screen image texture
            const imgTexture = new BABYLON.Texture("./src/engine/img/black-screen-with-reflection-dark.png", this.scene);
            

            //apply the image texture to the cloned screen mesh.
            clonedDeviceScreenSubMesh.material.albedoTexture = imgTexture;
            clonedDeviceScreenSubMesh.material.unlit = true;
            clonedDeviceScreenSubMesh.visibility = 0;  

        }else{
            LogManager.getInstance().logAll(Level.ERROR,"Failed to append backing screen; unable to find screen submesh with id:",null,this.screenSubmeshName);
        }
    }


    #createUploadProgressIndicatorScreen() {

        const deviceScreenSubMesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.screenSubmeshName);

        if (deviceScreenSubMesh) {


            // Create a single plane to display the text
            //const uploadProgressPlane = BABYLON.MeshBuilder.CreatePlane(`${this.name}-upload-progress-plane`, { width: screenSubMeshDim.height, height: screenSubMeshDim.width }, this.scene);
            var uploadProgressPlane = BABYLON.MeshBuilder.CreatePlane(`${this.name}-upload-progress-plane`, { width: 1, height: 1 }, this.scene);


             // Position the plane 
             const screenSubMeshDim = this.#computeMeshDimentions(deviceScreenSubMesh);
             const planeDim =  this.#computeMeshDimentions(uploadProgressPlane);
             uploadProgressPlane.position = deviceScreenSubMesh.position.clone();
             uploadProgressPlane.position.y = (screenSubMeshDim.height/2) + (planeDim.height/2);
             uploadProgressPlane.position.z += 0.35;

             //Parent the plane without transforming anything
             const loadingScreenSubMesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.loadingScreenName);
             uploadProgressPlane.setParent(loadingScreenSubMesh);

    
             //we make the plain invisible to begin with 
             uploadProgressPlane.setEnabled(false);
             uploadProgressPlane.visibility = 0;
             uploadProgressPlane.isPickable = false;

             // Create a dynamic texture for the text
             var uploadProgresTextTexture = new BABYLON.DynamicTexture(`${this.name}-upload-progress-text-texture`, { width: 256, height: 256 }, this.scene);

             // Create a material and assign the dynamic texture to it
             var uploadProgressTextTextureMaterial = new BABYLON.StandardMaterial(`${this.name}-upload-progress-text-texture-material`, this.scene);
             uploadProgressTextTextureMaterial.diffuseTexture = uploadProgresTextTexture;
             uploadProgressTextTextureMaterial.opacityTexture = uploadProgresTextTexture;
             uploadProgressTextTextureMaterial.backFaceCulling = false;
             uploadProgressTextTextureMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
             uploadProgressPlane.material = uploadProgressTextTextureMaterial;
             uploadProgressPlane.material.alpha = 0;


           
           
            //draw the actual text to the texture.
            uploadProgresTextTexture.drawText("  0%", null, 50, " 44px Titan One", "white", "transparent");
            uploadProgresTextTexture.drawText("   Uploading Media...", null, 75, "bold 14px Arial", "white", "transparent");

            return uploadProgressPlane;

        }else{
            LogManager.getInstance().logAll(Level.ERROR,"Failed to create progress indication screen; unable to find screen submesh with id:",null,this.screenSubmeshName);
        }


    }

    
   

    #appendInterstitialLoadingScreen(){

        //attempt to locate the child mesh with the screen sub mesh name..
        const deviceScreenSubMesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.screenSubmeshName);
        
        if(deviceScreenSubMesh){

            //clone the device screen.
            const clonedDeviceScreenSubMesh = deviceScreenSubMesh.clone(this.loadingScreenName);

            //clone the screen material too, as by default the child mesh will share the SAME material instance.
            clonedDeviceScreenSubMesh.material = deviceScreenSubMesh.material.clone(`material-${this.loadingScreenName}`);

            //append loading video texture..
            const videoTexture = new BABYLON.VideoTexture(`material-videotexture-${this.loadingScreenName}`, "./src/engine/img/screen-texture-update-loading-vid.mp4", this.scene, true, true, 
                BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE, {
                    autoPlay: false,      // Automatically play the video
                    loop: false,          // Loop the video
                    muted: true          // Start the video muted if necessary
                }
            );

            videoTexture.video.addEventListener('loadeddata', () => {
                videoTexture.video.playbackRate = 1.0; // Speed up the video once it's loaded
                LogManager.getInstance().log(Level.DEBUG,"Video loaded and playback rate set to: %d",videoTexture.video.playbackRate);
            });

            

            //apply the video texture to the cloned screen mesh.
            clonedDeviceScreenSubMesh.material.albedoTexture = videoTexture;
            clonedDeviceScreenSubMesh.material.unlit = true;

            //set the visibility of the cloned screen to false.
            //clonedDeviceScreenSubMesh.isVisible = false;
            clonedDeviceScreenSubMesh.visibility = 0;

            //set cloned mesh parent to equal the parent of the original mesh.
            clonedDeviceScreenSubMesh.parent = deviceScreenSubMesh.parent;

            //add a loading animation to the cloned screen.
            //TODO: Implement loading animation here.

        }else{
            LogManager.getInstance().logAll(Level.ERROR,"Failed to append interstitial loading screen; unable to find screen submesh with id:",null,this.screenSubmeshName);
        }
    }


    #showBackScreen(){
       if(this.parentMesh.visibility > 0){
         const backingScreen = this.parentMesh.getChildMeshes().find((mesh)  => mesh.name === this.backingScreenName);
         backingScreen.visibility = 1;
       }else{
           LogManager.getInstance().log(Level.ERROR,"Failed to show backing screen; parent mesh is not visible.");
       }
    }

    #hideBackScreen(delay){
        setTimeout(() =>{
            LogManager.getInstance().log(Level.DEBUG,"hiding backing screen.");
            const backingScreen = this.parentMesh.getChildMeshes().find((mesh)  => mesh.name === this.backingScreenName);
            backingScreen.visibility = 0;
        },delay)
        
    }

    #showInterstitialLoadingScreen(){
        if(this.showingLoadingScreen)
            return;
        if(this.parentMesh.visibility >= 1){
          const loadingScreen = this.parentMesh.getChildMeshes().find((mesh)  => mesh.name === this.loadingScreenName);
          loadingScreen.visibility = 1;
          loadingScreen.material.albedoTexture.video.loop = true;
          loadingScreen.material.albedoTexture.video.play();
          this.showingLoadingScreen = true;
        }else{
            LogManager.getInstance().log(Level.ERROR,"Failed to show interstitial loading screen; parent mesh is not entirely visible.");
        }
    }

    #hideInterstitialLoadingScreen(delay){
      
        setTimeout(() => {
            LogManager.getInstance().log(Level.DEBUG,"Hiding loading screen.");
            const loadingScreen = this.parentMesh.getChildMeshes().find((mesh)  => mesh.name === this.loadingScreenName);
            loadingScreen.visibility = 0;
            this.showingLoadingScreen = false;
        },delay);
       
    }



    
    /**
     * Handles fade in and out the DeviceMesh in a very specific way such that an
     * explanation of how and why the method functions as it does is warrented:
     * 
     * Objective:
     * The goal of the method is to fade out a complex DeviceMesh WHILST
     * reducing the exposure of the child meshes its composed of as much as 
     * practicably possible. We'd like the mesh to fade in and out as if it
     * was a single solid object, without exposing its internals.
     * 
     * Strategy:
     * Whilst backface-culling is enabled by default in the engine, making an exterior 
     * face transparent will, of course, expose the meshes internals, which looks unsightly.
     * To mitigate against this we split the mesh into two distinct categories namely: Shell
     * and Internals. The Shell comprises of the mesh body and screen and the Internals are 
     * everything else. When fading out the mesh we ALWAYS decrease the visibility of the internal
     * components of the mesh FIRST before uniformly fading out the shell and we undertake exactly 
     * the inverse operation when fading in the mesh.
     * 
     * RESULT
     * The mesh fades and in out more like a single cohesive structure rather than as the 
     * a mesh composed of mutiple sub meshes.
     * @date January 17th 2025, 10:48:24 am
     * @author Giles Thompson
     *
     * @param {*} mesh The mesh that is to have its visibility adjusted.
     * @param {number} visibility A visibility level between 0 and 1.
     * @param {boolean} isRootMesh A boolean which denotes whether the provided mesh is the root, used in the recursive operation of this mesh.
     */
    #setMeshVisibility(mesh, visibility, isRootMesh,setFromProxy = false) {

        const decreasing = visibility < mesh.visibility;

        if (isRootMesh && decreasing) {

            const backingScreen = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.backingScreenName);

            if (backingScreen) {
                backingScreen.visibility = 1;
            }

        }


        if (mesh) {

            // Recursively visibility on all child meshes (if they exist)..
            if (mesh.getChildMeshes) {



                //we exclude the backing and loading screen, as the visibility of these screens is explicitly set when
                //they are displayed or hidden...
                const childMeshesExclBackingScreen = mesh.getChildMeshes()
                    .filter((curChild) => curChild.name != this.backingScreenName
                        && curChild.name != this.loadingScreenName
                        && curChild.name != this.bodySubmeshName

                    );


                childMeshesExclBackingScreen.forEach(childMesh => {

                    this.#setMeshVisibility(childMesh, visibility, false);

                });

            }

            if(!(isRootMesh && setFromProxy)){
                mesh.visibility = visibility;
            }

            if(decreasing && mesh.visibility <= 0.2){
               this.#setMeshShellVisibility(visibility,decreasing);
            }else if(!decreasing && mesh.visibility > 0.1){
                this.#setMeshShellVisibility(visibility,decreasing);
            }

        }

    }

    
    /**
     * Fades the Shell components of the mesh in and out at various levels.
     * @date January 17th 2025, 10:09:38 am
     * @author Giles Thompson
     *
     * @param {number} visibilityValue A visibility value to set the mesh to.
     * @param {boolean} isDecreasing boolean which denote whether or not the visibility is decreasing.
     */
    #setMeshShellVisibility(visibilityValue,isDecreasing){

        const bodyMesh = (this.bodySubmesh != null) ? this.bodySubmesh : this.bodySubmesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.bodySubmeshName);
        const backingScreenMesh = (this.backingScreenSubmesh != null) ? this.backingScreenSubmesh : this.backingScreenSubmesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.backingScreenName);
        const mainScreenMesh = (this.screenSubmesh != null) ? this.screenSubmesh : this.screenSubmesh = this.parentMesh.getChildMeshes().find((mesh) => mesh.name === this.screenSubmeshName);
    
        if(bodyMesh){
            if(isDecreasing){
                bodyMesh.visibility = visibilityValue/4;  //fade out body faster.
            }else{
                bodyMesh.visibility = visibilityValue; 
            }
            
        }

        if(backingScreenMesh){
            if(!isDecreasing){
                backingScreenMesh.visibility = 0; //don't fade backing screen back in.
            }else{
                backingScreenMesh.visibility = visibilityValue
            }
        }

        if(mainScreenMesh){
            mainScreenMesh.visibility = visibilityValue*5; //fade in screen faster.
        }
       
    }

    #setMeshEnablement(mesh,enable) {
        // Disable the mesh itself
        if (mesh) {
            mesh.setEnabled(enable);  // Disable the mesh
            mesh.isVisible = enable;  // Optionally make the mesh invisible
            

            // Recursively disable all child meshes (if they exist)
            if (mesh.getChildMeshes) {
                mesh.getChildMeshes().forEach(childMesh => {
                    this.#setMeshEnablement(childMesh,enable);  // Recursively disable child meshes
                });
            }
        }
    }


    #computeMeshDimentions(mesh) {

        var boundingInfo = mesh.getBoundingInfo();
        var boundingBox = boundingInfo.boundingBox;

        var modelHeight = boundingBox.maximum.y - boundingBox.minimum.y;  // Height
        var modelWidth = boundingBox.maximum.x - boundingBox.minimum.x;   // Width
        var modelDepth = boundingBox.maximum.z - boundingBox.minimum.z;   // Depth (for 3D models)

        return {
            height: modelHeight,
            width: modelWidth,
            depth: modelDepth
        };
    }


}

export {DeviceMesh};